import { useRef, useCallback, useState, useEffect } from 'react';
import * as faceapi from 'face-api.js';

export type EyeState = 'open' | 'closing' | 'closed';

export interface FaceDetectionState {
  faceDetected: boolean;
  eyesOpen: boolean;
  leftEyeOpen: boolean;
  rightEyeOpen: boolean;
  leftEyeState: EyeState;
  rightEyeState: EyeState;
  eyeState: EyeState;
  leftEAR: number;
  rightEAR: number;
  avgEAR: number;
  baselineEAR: number;
  openThreshold: number;
  closedThreshold: number;
  isCalibrated: boolean;
  calibrationProgress: number;
  consecutiveClosedFrames: number;
  drowsinessScore: number;
  headPose: { pitch: number; yaw: number; roll: number };
  landmarks: any[] | null;
  isModelLoading: boolean;
  isModelReady: boolean;
  error: string | null;
  fps: number;
  faceConfidence: number;
}

const MODEL_URL = '/models';
const CALIBRATION_FRAMES = 30;
const SMOOTHING_FRAMES = 5;
const CLOSED_CONFIRM_FRAMES = 3;
const OPEN_CONFIRM_FRAMES = 2;

export function useFaceDetection() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);
  const frameCountRef = useRef(0);
  const lastFpsTimeRef = useRef(performance.now());
  const fpsRef = useRef(0);

  const calibrationSamplesRef = useRef<number[]>([]);
  const baselineEARRef = useRef(0);
  const openThresholdRef = useRef(0.22);
  const closedThresholdRef = useRef(0.16);

  const leftEARHistoryRef = useRef<number[]>([]);
  const rightEARHistoryRef = useRef<number[]>([]);

  const leftClosedCountRef = useRef(0);
  const rightClosedCountRef = useRef(0);
  const leftOpenCountRef = useRef(0);
  const rightOpenCountRef = useRef(0);
  const consecutiveClosedRef = useRef(0);

  const [state, setState] = useState<FaceDetectionState>({
    faceDetected: false,
    eyesOpen: true,
    leftEyeOpen: true,
    rightEyeOpen: true,
    leftEyeState: 'open',
    rightEyeState: 'open',
    eyeState: 'open',
    leftEAR: 0,
    rightEAR: 0,
    avgEAR: 0,
    baselineEAR: 0,
    openThreshold: 0.22,
    closedThreshold: 0.16,
    isCalibrated: false,
    calibrationProgress: 0,
    consecutiveClosedFrames: 0,
    drowsinessScore: 0,
    headPose: { pitch: 0, yaw: 0, roll: 0 },
    landmarks: null,
    isModelLoading: false,
    isModelReady: false,
    error: null,
    fps: 0,
    faceConfidence: 0,
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  const detectFace = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.paused || video.readyState < 2) return;
    if (!faceapi.nets.tinyFaceDetector.isLoaded || !faceapi.nets.faceLandmark68Net.isLoaded) return;

    frameCountRef.current++;
    const now = performance.now();
    if (now - lastFpsTimeRef.current >= 1000) {
      fpsRef.current = frameCountRef.current;
      frameCountRef.current = 0;
      lastFpsTimeRef.current = now;
    }

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
        consecutiveClosedRef.current = 0;
        setState(prev => ({
          ...prev,
          faceDetected: false,
          eyesOpen: true,
          leftEyeOpen: true,
          rightEyeOpen: true,
          leftEyeState: 'open',
          rightEyeState: 'open',
          eyeState: 'open',
          leftEAR: 0,
          rightEAR: 0,
          avgEAR: 0,
          drowsinessScore: 0,
          landmarks: null,
          faceConfidence: 0,
        }));
        return;
      }

      const confidence = Math.round((detections.detection?.score || 0) * 100);
      const landmarks = detections.landmarks;
      const jaw = landmarks.getJawOutline();
      const leftEye = landmarks.getLeftEye();
      const rightEye = landmarks.getRightEye();
      const nose = landmarks.getNose();
      const mouth = landmarks.getMouth();

      const rawLeftEAR = calculateEAR(leftEye);
      const rawRightEAR = calculateEAR(rightEye);
      const rawAvgEAR = (rawLeftEAR + rawRightEAR) / 2;

      leftEARHistoryRef.current.push(rawLeftEAR);
      rightEARHistoryRef.current.push(rawRightEAR);
      if (leftEARHistoryRef.current.length > SMOOTHING_FRAMES) leftEARHistoryRef.current.shift();
      if (rightEARHistoryRef.current.length > SMOOTHING_FRAMES) rightEARHistoryRef.current.shift();

      const smoothLeft = average(leftEARHistoryRef.current);
      const smoothRight = average(rightEARHistoryRef.current);
      const smoothAvg = (smoothLeft + smoothRight) / 2;

      if (!stateRef.current.isCalibrated) {
        calibrationSamplesRef.current.push(smoothAvg);
        const progress = Math.min(calibrationSamplesRef.current.length / CALIBRATION_FRAMES, 1);

        if (calibrationSamplesRef.current.length >= CALIBRATION_FRAMES) {
          const baseline = average(calibrationSamplesRef.current);
          const openThresh = baseline * 0.78;
          const closedThresh = baseline * 0.55;
          baselineEARRef.current = baseline;
          openThresholdRef.current = openThresh;
          closedThresholdRef.current = closedThresh;

          setState(prev => ({
            ...prev,
            faceDetected: true,
            baselineEAR: baseline,
            openThreshold: openThresh,
            closedThreshold: closedThresh,
            isCalibrated: true,
            calibrationProgress: 1,
            leftEAR: smoothLeft,
            rightEAR: smoothRight,
            avgEAR: smoothAvg,
            faceConfidence: confidence,
            fps: fpsRef.current,
          }));
        } else {
          setState(prev => ({
            ...prev,
            faceDetected: true,
            calibrationProgress: progress,
            leftEAR: smoothLeft,
            rightEAR: smoothRight,
            avgEAR: smoothAvg,
            faceConfidence: confidence,
            fps: fpsRef.current,
          }));
        }

        drawLandmarks(ctx, jaw, leftEye, rightEye, nose, mouth, landmarks, true);
        return;
      }

      const openThresh = openThresholdRef.current;
      const closedThresh = closedThresholdRef.current;

      const rawLeftOpen = smoothLeft > openThresh;
      const rawRightOpen = smoothRight > openThresh;
      const rawLeftClosed = smoothLeft < closedThresh;
      const rawRightClosed = smoothRight < closedThresh;

      if (rawLeftOpen) {
        leftClosedCountRef.current = 0;
        leftOpenCountRef.current = Math.min(leftOpenCountRef.current + 1, OPEN_CONFIRM_FRAMES + 1);
      } else if (rawLeftClosed) {
        leftOpenCountRef.current = 0;
        leftClosedCountRef.current = Math.min(leftClosedCountRef.current + 1, CLOSED_CONFIRM_FRAMES + 1);
      }

      if (rawRightOpen) {
        rightClosedCountRef.current = 0;
        rightOpenCountRef.current = Math.min(rightOpenCountRef.current + 1, OPEN_CONFIRM_FRAMES + 1);
      } else if (rawRightClosed) {
        rightOpenCountRef.current = 0;
        rightClosedCountRef.current = Math.min(rightClosedCountRef.current + 1, CLOSED_CONFIRM_FRAMES + 1);
      }

      const prev = stateRef.current;
      const leftEyeOpen = leftClosedCountRef.current >= CLOSED_CONFIRM_FRAMES ? false :
                          leftOpenCountRef.current >= OPEN_CONFIRM_FRAMES ? true :
                          prev.leftEyeOpen;
      const rightEyeOpen = rightClosedCountRef.current >= CLOSED_CONFIRM_FRAMES ? false :
                           rightOpenCountRef.current >= OPEN_CONFIRM_FRAMES ? true :
                           prev.rightEyeOpen;

      const getEyeState = (ear: number, isOpen: boolean): EyeState => {
        if (isOpen) return 'open';
        if (ear < closedThresh) return 'closed';
        return 'closing';
      };

      const leftEyeState = getEyeState(smoothLeft, leftEyeOpen);
      const rightEyeState = getEyeState(smoothRight, rightEyeOpen);
      const bothOpen = leftEyeOpen && rightEyeOpen;
      const bothClosed = !leftEyeOpen && !rightEyeOpen;
      const eyeState: EyeState = bothOpen ? 'open' : bothClosed ? 'closed' : 'closing';

      if (bothClosed) {
        consecutiveClosedRef.current++;
      } else {
        consecutiveClosedRef.current = 0;
      }

      let drowsinessScore = 0;
      if (bothClosed) {
        drowsinessScore = Math.min(consecutiveClosedRef.current / 20, 1);
      }

      const eyeColor = bothOpen ? '#10b981' : eyeState === 'closing' ? '#f59e0b' : '#ef4444';
      drawLandmarks(ctx, jaw, leftEye, rightEye, nose, mouth, landmarks, bothOpen, eyeColor);

      ctx.fillStyle = eyeColor;
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
        leftEyeOpen,
        rightEyeOpen,
        leftEyeState,
        rightEyeState,
        eyeState,
        leftEAR: smoothLeft,
        rightEAR: smoothRight,
        avgEAR: smoothAvg,
        consecutiveClosedFrames: consecutiveClosedRef.current,
        drowsinessScore,
        headPose: { pitch, yaw, roll },
        landmarks: allPoints,
        faceConfidence: confidence,
        fps: fpsRef.current,
      }));
    } catch {
      // Ignore detection errors
    }
  }, []);

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
      intervalRef.current = window.setInterval(detectFace, 100);

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
    consecutiveClosedRef.current = 0;
    leftEARHistoryRef.current = [];
    rightEARHistoryRef.current = [];
    calibrationSamplesRef.current = [];
    frameCountRef.current = 0;
    fpsRef.current = 0;
  }, []);

  const recalibrate = useCallback(() => {
    calibrationSamplesRef.current = [];
    baselineEARRef.current = 0;
    openThresholdRef.current = 0.22;
    closedThresholdRef.current = 0.16;
    leftClosedCountRef.current = 0;
    rightClosedCountRef.current = 0;
    leftOpenCountRef.current = 0;
    rightOpenCountRef.current = 0;
    consecutiveClosedRef.current = 0;
    leftEARHistoryRef.current = [];
    rightEARHistoryRef.current = [];
    setState(prev => ({
      ...prev,
      isCalibrated: false,
      calibrationProgress: 0,
      baselineEAR: 0,
      openThreshold: 0.22,
      closedThreshold: 0.16,
    }));
  }, []);

  useEffect(() => {
    return () => {
      stopDetection();
    };
  }, [stopDetection]);

  const getStream = useCallback(() => {
    return streamRef.current;
  }, []);

  return { ...state, startDetection, stopDetection, getStream, recalibrate, videoRef, canvasRef };
}

function calculateEAR(eyePoints: any[]): number {
  if (eyePoints.length < 6) return 0.3;

  const p1 = eyePoints[1];
  const p2 = eyePoints[2];
  const p4 = eyePoints[4];
  const p5 = eyePoints[5];
  const p0 = eyePoints[0];
  const p3 = eyePoints[3];

  const vertical1 = Math.hypot(p1.x - p5.x, p1.y - p5.y);
  const vertical2 = Math.hypot(p2.x - p4.x, p2.y - p4.y);
  const horizontal = Math.hypot(p3.x - p0.x, p3.y - p0.y);

  if (horizontal === 0) return 0.3;
  return (vertical1 + vertical2) / (2.0 * horizontal);
}

function average(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function drawLandmarks(
  ctx: CanvasRenderingContext2D,
  jaw: any[],
  leftEye: any[],
  rightEye: any[],
  nose: any[],
  mouth: any[],
  landmarks: any,
  bothOpen: boolean,
  color: string = '#10b981',
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;

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
}
