import { useRef, useCallback, useState, useEffect } from 'react';
import * as faceapi from 'face-api.js';

export interface FaceDetectionState {
  faceDetected: boolean;
  eyesOpen: boolean;
  leftEyeOpen: boolean;
  rightEyeOpen: boolean;
  eyeAspectRatio: number;
  drowsinessScore: number;
  headPose: { pitch: number; yaw: number; roll: number };
  landmarks: any[] | null;
  isModelLoading: boolean;
  isModelReady: boolean;
  error: string | null;
}

const MODEL_URL = '/models';
const EAR_THRESHOLD = 0.25;
const DEBOUNCE_FRAMES = 3;

export function useFaceDetection() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);
  const earHistoryRef = useRef<number[]>([]);

  const leftClosedCountRef = useRef(0);
  const rightClosedCountRef = useRef(0);
  const leftOpenCountRef = useRef(0);
  const rightOpenCountRef = useRef(0);

  const [state, setState] = useState<FaceDetectionState>({
    faceDetected: false,
    eyesOpen: true,
    leftEyeOpen: true,
    rightEyeOpen: true,
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
    if (!faceapi.nets.tinyFaceDetector.isLoaded || !faceapi.nets.faceLandmark68Net.isLoaded) return;

    try {
      const detections = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({
          inputSize: 224,
          scoreThreshold: 0.1,
        }))
        .withFaceLandmarks();

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!detections) {
        leftClosedCountRef.current = 0;
        rightClosedCountRef.current = 0;
        leftOpenCountRef.current = 0;
        rightOpenCountRef.current = 0;
        setState(prev => ({
          ...prev,
          faceDetected: false,
          eyesOpen: true,
          leftEyeOpen: true,
          rightEyeOpen: true,
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

      const leftEAR = calculateEyeOpenness(leftEye);
      const rightEAR = calculateEyeOpenness(rightEye);
      const avgEAR = (leftEAR + rightEAR) / 2;

      earHistoryRef.current.push(avgEAR);
      if (earHistoryRef.current.length > 30) earHistoryRef.current.shift();

      const rawLeftOpen = leftEAR > EAR_THRESHOLD;
      const rawRightOpen = rightEAR > EAR_THRESHOLD;

      if (rawLeftOpen) {
        leftClosedCountRef.current = 0;
        leftOpenCountRef.current = Math.min(leftOpenCountRef.current + 1, DEBOUNCE_FRAMES);
      } else {
        leftOpenCountRef.current = 0;
        leftClosedCountRef.current = Math.min(leftClosedCountRef.current + 1, DEBOUNCE_FRAMES);
      }

      if (rawRightOpen) {
        rightClosedCountRef.current = 0;
        rightOpenCountRef.current = Math.min(rightOpenCountRef.current + 1, DEBOUNCE_FRAMES);
      } else {
        rightOpenCountRef.current = 0;
        rightClosedCountRef.current = Math.min(rightClosedCountRef.current + 1, DEBOUNCE_FRAMES);
      }

      const leftEyeOpen = leftClosedCountRef.current >= DEBOUNCE_FRAMES ? false :
                          leftOpenCountRef.current >= DEBOUNCE_FRAMES ? true :
                          undefined;
      const rightEyeOpen = rightClosedCountRef.current >= DEBOUNCE_FRAMES ? false :
                           rightOpenCountRef.current >= DEBOUNCE_FRAMES ? true :
                           undefined;

      const prevLeft = state.leftEyeOpen;
      const prevRight = state.rightEyeOpen;
      const finalLeftEyeOpen = leftEyeOpen !== undefined ? leftEyeOpen : prevLeft;
      const finalRightEyeOpen = rightEyeOpen !== undefined ? rightEyeOpen : prevRight;
      const bothOpen = finalLeftEyeOpen && finalRightEyeOpen;

      let drowsinessScore = 0;
      if (!bothOpen) {
        const closedCount = earHistoryRef.current.filter(e => e < EAR_THRESHOLD).length;
        drowsinessScore = Math.min(closedCount / 8, 1);
      }

      ctx.strokeStyle = bothOpen ? '#10b981' : '#ef4444';
      ctx.lineWidth = 1;

      ctx.beginPath();
      jaw.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();

      [leftEye, rightEye].forEach(eye => {
        ctx.beginPath();
        eye.forEach((p, i) => {
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.closePath();
        ctx.stroke();
      });

      ctx.beginPath();
      nose.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();

      ctx.beginPath();
      mouth.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.closePath();
      ctx.stroke();

      ctx.fillStyle = bothOpen ? '#10b981' : '#ef4444';
      const allPoints = landmarks.positions;
      for (const point of allPoints) {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 1, 0, 2 * Math.PI);
        ctx.fill();
      }

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
        eyesOpen: bothOpen,
        leftEyeOpen: finalLeftEyeOpen,
        rightEyeOpen: finalRightEyeOpen,
        eyeAspectRatio: avgEAR,
        drowsinessScore,
        headPose: { pitch, yaw, roll },
        landmarks: allPoints,
      }));
    } catch {
      // Ignore detection errors
    }
  }, [state.leftEyeOpen, state.rightEyeOpen]);

  const startDetection = useCallback(async (video: HTMLVideoElement, canvas: HTMLCanvasElement) => {
    videoRef.current = video;
    canvasRef.current = canvas;

    setState(prev => ({ ...prev, isModelLoading: true, error: null }));

    try {
      console.log('[FaceDetect] Loading models from:', MODEL_URL);
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      console.log('[FaceDetect] TinyFaceDetector loaded:', faceapi.nets.tinyFaceDetector.isLoaded);
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      console.log('[FaceDetect] FaceLandmark68 loaded:', faceapi.nets.faceLandmark68Net.isLoaded);

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

      video.srcObject = stream;
      console.log('[FaceDetect] Stream attached to video element');

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
    leftClosedCountRef.current = 0;
    rightClosedCountRef.current = 0;
    leftOpenCountRef.current = 0;
    rightOpenCountRef.current = 0;
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
  const vertical1 = Math.hypot(eyePoints[1].x - eyePoints[5].x, eyePoints[1].y - eyePoints[5].y);
  const vertical2 = Math.hypot(eyePoints[2].x - eyePoints[4].x, eyePoints[2].y - eyePoints[4].y);
  const horizontal = Math.hypot(eyePoints[3].x - eyePoints[0].x, eyePoints[3].y - eyePoints[0].y);
  if (horizontal === 0) return 1;
  return (vertical1 + vertical2) / (2.0 * horizontal);
}
