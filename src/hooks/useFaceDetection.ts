import { useRef, useCallback, useState, useEffect } from 'react';
import * as faceapi from 'face-api.js';

export interface FaceDetectionState {
  faceDetected: boolean;
  eyesOpen: boolean;
  eyeAspectRatio: number;
  drowsinessScore: number;
  headPose: { pitch: number; yaw: number; roll: number };
  landmarks: any[] | null;
  isModelLoading: boolean;
  isModelReady: boolean;
  error: string | null;
}

const MODEL_URL = '/models';

export function useFaceDetection() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);
  const earHistoryRef = useRef<number[]>([]);

  const [state, setState] = useState<FaceDetectionState>({
    faceDetected: false,
    eyesOpen: true,
    eyeAspectRatio: 1,
    drowsinessScore: 0,
    headPose: { pitch: 0, yaw: 0, roll: 0 },
    landmarks: null,
    isModelLoading: false,
    isModelReady: false,
    error: null,
  });

  const detectFace = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.paused || video.readyState < 2) return;

    try {
      const detections = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({
          inputSize: 320,
          scoreThreshold: 0.3,
        }))
        .withFaceLandmarks();

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!detections) {
        setState(prev => ({
          ...prev,
          faceDetected: false,
          eyesOpen: true,
          eyeAspectRatio: 1,
          drowsinessScore: 0,
          landmarks: null,
        }));
        return;
      }

      const landmarks = detections.landmarks;
      const jaw = landmarks.getJawOutline();
      const leftEye = landmarks.getLeftEye();
      const rightEye = landmarks.getRightEye();
      const nose = landmarks.getNose();
      const mouth = landmarks.getMouth();

      // Calculate eye aspect ratio
      const leftEAR = calculateEyeOpenness(leftEye);
      const rightEAR = calculateEyeOpenness(rightEye);
      const avgEAR = (leftEAR + rightEAR) / 2;

      earHistoryRef.current.push(avgEAR);
      if (earHistoryRef.current.length > 30) earHistoryRef.current.shift();

      const eyesOpen = avgEAR > 0.25;

      let drowsinessScore = 0;
      if (!eyesOpen) {
        const closedCount = earHistoryRef.current.filter(e => e < 0.25).length;
        drowsinessScore = Math.min(closedCount / 8, 1);
      }

      // Draw face landmarks
      ctx.strokeStyle = eyesOpen ? '#10b981' : '#ef4444';
      ctx.lineWidth = 1;

      // Draw jaw outline
      ctx.beginPath();
      jaw.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();

      // Draw eyes
      [leftEye, rightEye].forEach(eye => {
        ctx.beginPath();
        eye.forEach((p, i) => {
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.closePath();
        ctx.stroke();
      });

      // Draw nose
      ctx.beginPath();
      nose.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();

      // Draw mouth
      ctx.beginPath();
      mouth.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.closePath();
      ctx.stroke();

      // Draw all points
      ctx.fillStyle = eyesOpen ? '#10b981' : '#ef4444';
      const allPoints = landmarks.positions;
      for (const point of allPoints) {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 1, 0, 2 * Math.PI);
        ctx.fill();
      }

      // Head pose estimation (simplified)
      const noseTip = nose[3];
      const leftEyeCenter = {
        x: leftEye.reduce((s, p) => s + p.x, 0) / leftEye.length,
        y: leftEye.reduce((s, p) => s + p.y, 0) / leftEye.length,
      };
      const rightEyeCenter = {
        x: rightEye.reduce((s, p) => s + p.x, 0) / rightEye.length,
        y: rightEye.reduce((s, p) => s + p.y, 0) / rightEye.length,
      };

      const yaw = Math.atan2(rightEyeCenter.x - leftEyeCenter.x, 50) * (180 / Math.PI);
      const pitch = (noseTip.y - canvas.height / 2) / canvas.height * 60;
      const roll = Math.atan2(rightEyeCenter.y - leftEyeCenter.y, rightEyeCenter.x - leftEyeCenter.x) * (180 / Math.PI);

      setState(prev => ({
        ...prev,
        faceDetected: true,
        eyesOpen,
        eyeAspectRatio: avgEAR,
        drowsinessScore,
        headPose: { pitch, yaw, roll },
        landmarks: allPoints,
      }));
    } catch (err) {
      // Ignore detection errors
    }
  }, []);

  const startDetection = useCallback(async (video: HTMLVideoElement, canvas: HTMLCanvasElement) => {
    videoRef.current = video;
    canvasRef.current = canvas;

    setState(prev => ({ ...prev, isModelLoading: true, error: null }));

    try {
      // Load models
      console.log('[FaceDetect] Loading models from:', MODEL_URL);
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      console.log('[FaceDetect] Models loaded');

      // Get camera stream
      console.log('[FaceDetect] Requesting camera...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });
      console.log('[FaceDetect] Camera stream obtained:', stream.getTracks().length, 'tracks');
      streamRef.current = stream;

      // Attach stream to video
      video.srcObject = stream;
      console.log('[FaceDetect] Stream attached to video element');

      // Wait for metadata then play
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Video load timeout - camera may be in use by another app'));
        }, 10000);

        video.onloadedmetadata = () => {
          console.log('[FaceDetect] Metadata loaded:', video.videoWidth, 'x', video.videoHeight);
          video.play()
            .then(() => {
              console.log('[FaceDetect] Video playing');
              clearTimeout(timeout);
              resolve();
            })
            .catch((e) => {
              console.error('[FaceDetect] Video play error:', e);
              clearTimeout(timeout);
              reject(e);
            });
        };

        // If metadata already loaded
        if (video.readyState >= 1) {
          console.log('[FaceDetect] Metadata already loaded, playing...');
          video.play()
            .then(() => {
              console.log('[FaceDetect] Video playing');
              clearTimeout(timeout);
              resolve();
            })
            .catch((e) => {
              console.error('[FaceDetect] Video play error:', e);
              clearTimeout(timeout);
              reject(e);
            });
        }
      });

      console.log('[FaceDetect] Video dimensions:', video.videoWidth, 'x', video.videoHeight);
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      console.log('[FaceDetect] Canvas sized:', canvas.width, 'x', canvas.height);

      // Start detection loop
      console.log('[FaceDetect] Starting detection loop...');
      intervalRef.current = window.setInterval(detectFace, 150);

      setState(prev => ({
        ...prev,
        isModelLoading: false,
        isModelReady: true,
      }));
      console.log('[FaceDetect] Ready!');
    } catch (err: any) {
      console.error('[FaceDetect] Error:', err);
      setState(prev => ({
        ...prev,
        isModelLoading: false,
        error: err.message || 'Failed to start face detection',
      }));
    }
  }, [detectFace]);

  const stopDetection = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopDetection();
    };
  }, [stopDetection]);

  const getStream = useCallback(() => {
    return streamRef.current;
  }, []);

  return { ...state, startDetection, stopDetection, getStream, videoRef, canvasRef };
}

function calculateEyeOpenness(eyePoints: any[]): number {
  if (eyePoints.length < 6) return 1;
  const vertical1 = Math.hypot(eyePoints[3].x - eyePoints[1].x, eyePoints[3].y - eyePoints[1].y);
  const vertical2 = Math.hypot(eyePoints[4].x - eyePoints[2].x, eyePoints[4].y - eyePoints[2].y);
  const horizontal = Math.hypot(eyePoints[5].x - eyePoints[0].x, eyePoints[5].y - eyePoints[0].y);
  if (horizontal === 0) return 1;
  return (vertical1 + vertical2) / (2.0 * horizontal);
}
