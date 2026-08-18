import { useRef, useCallback, useState, useEffect } from 'react';

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

const LEFT_EYE = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398];
const RIGHT_EYE = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246];

function calculateEAR(landmarks: any[], eyeIndices: number[]): number {
  const points = eyeIndices.map(i => landmarks[i]);
  const verticalDist1 = Math.hypot(points[3].x - points[1].x, points[3].y - points[1].y);
  const verticalDist2 = Math.hypot(points[5].x - points[2].x, points[5].y - points[2].y);
  const horizontalDist = Math.hypot(points[5].x - points[0].x, points[5].y - points[0].y);
  if (horizontalDist === 0) return 1;
  return (verticalDist1 + verticalDist2) / (2.0 * horizontalDist);
}

export function useFaceDetection() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const faceMeshRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
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

  const processFrame = useCallback(async () => {
    const video = videoRef.current;
    const faceMesh = faceMeshRef.current;
    if (!video || !faceMesh || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(processFrame);
      return;
    }
    try {
      await faceMesh.send({ image: video });
    } catch (e) {
      // ignore frame errors
    }
    rafRef.current = requestAnimationFrame(processFrame);
  }, []);

  const onResults = useCallback((results: any) => {
    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
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

    const landmarks = results.multiFaceLandmarks[0];
    const leftEAR = calculateEAR(landmarks, LEFT_EYE);
    const rightEAR = calculateEAR(landmarks, RIGHT_EYE);
    const avgEAR = (leftEAR + rightEAR) / 2;

    earHistoryRef.current.push(avgEAR);
    if (earHistoryRef.current.length > 30) earHistoryRef.current.shift();

    const normalizedEAR = Math.min(Math.max(avgEAR / 0.3, 0), 1);
    const eyesOpen = avgEAR > 0.15;

    let drowsinessScore = 0;
    if (!eyesOpen) {
      const closedCount = earHistoryRef.current.filter(e => e < 0.15).length;
      drowsinessScore = Math.min(closedCount / 10, 1);
    } else {
      drowsinessScore = Math.max(0, (earHistoryRef.current[earHistoryRef.current.length - 1] || 0) < 0.2 ? 0.3 : 0);
    }

    const nose = landmarks[1];
    const leftEyeCenter = landmarks[362];
    const rightEyeCenter = landmarks[133];
    const yaw = Math.atan2(rightEyeCenter.x - leftEyeCenter.x, 0.5) * (180 / Math.PI);
    const pitch = (nose.y - 0.5) * 60;
    const roll = Math.atan2(rightEyeCenter.y - leftEyeCenter.y, rightEyeCenter.x - leftEyeCenter.x) * (180 / Math.PI);

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = eyesOpen ? '#10b981' : '#ef4444';
        for (const lm of landmarks) {
          ctx.beginPath();
          ctx.arc(lm.x * canvas.width, lm.y * canvas.height, 1.5, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
    }

    setState(prev => ({
      ...prev,
      faceDetected: true,
      eyesOpen,
      eyeAspectRatio: normalizedEAR,
      drowsinessScore,
      headPose: { pitch, yaw, roll },
      landmarks,
    }));
  }, []);

  const startDetection = useCallback(async (video: HTMLVideoElement, canvas: HTMLCanvasElement) => {
    videoRef.current = video;
    canvasRef.current = canvas;

    setState(prev => ({ ...prev, isModelLoading: true, error: null }));

    try {
      // Get camera stream first
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 320 },
          height: { ideal: 240 },
        },
      });
      streamRef.current = stream;
      video.srcObject = stream;

      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => {
          video.play().then(resolve).catch(reject);
        };
        // Fallback if metadata already loaded
        if (video.readyState >= 1) {
          video.play().then(resolve).catch(reject);
        }
      });

      // Wait for video to be playing
      await new Promise<void>((resolve) => {
        if (video.paused) {
          video.onplay = () => resolve();
        } else {
          resolve();
        }
      });

      canvas.width = video.videoWidth || 320;
      canvas.height = video.videoHeight || 240;

      // Load MediaPipe Face Mesh
      const { FaceMesh } = await import('@mediapipe/face_mesh');

      const faceMesh = new FaceMesh({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
        },
      });

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      faceMesh.onResults(onResults);
      faceMeshRef.current = faceMesh;

      // Start processing frames
      rafRef.current = requestAnimationFrame(processFrame);

      setState(prev => ({
        ...prev,
        isModelLoading: false,
        isModelReady: true,
      }));
    } catch (err: any) {
      console.error('Face detection error:', err);
      setState(prev => ({
        ...prev,
        isModelLoading: false,
        error: err.message || 'Failed to start face detection',
      }));
    }
  }, [onResults, processFrame]);

  const stopDetection = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (faceMeshRef.current) {
      faceMeshRef.current.close();
      faceMeshRef.current = null;
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
