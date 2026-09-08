import { useRef, useCallback, useState, useEffect } from 'react';
import * as faceapi from 'face-api.js';

export type EyeState = 'open' | 'closing' | 'closed' | 'unknown';
export type CameraState = 'idle' | 'connecting' | 'active' | 'error' | 'stopped';

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
  cameraState: CameraState;
  error: string | null;
  fps: number;
  faceConfidence: number;
  lastBlinkTime: number;
  blinkCount: number;
}

const MODEL_URL = '/models';
const CALIBRATION_FRAMES = 40;
const DETECTION_INTERVAL_MS = 60;
const EMA_ALPHA = 0.45;
const NO_FACE_GRACE_FRAMES = 8;

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
  const closedThresholdRef = useRef(0.16);

  const leftEARHistoryRef = useRef<number[]>([]);
  const rightEARHistoryRef = useRef<number[]>([]);

  const consecutiveClosedRef = useRef(0);
  const noFaceGraceRef = useRef(0);
  const lastBlinkTimeRef = useRef(0);
  const blinkCountRef = useRef(0);
  const modelsLoadedRef = useRef(false);
  const logCounterRef = useRef(0);

  const [state, setState] = useState<FaceDetectionState>({
    faceDetected: false,
    eyesOpen: true,
    leftEyeOpen: true,
    rightEyeOpen: true,
    leftEyeState: 'unknown',
    rightEyeState: 'unknown',
    eyeState: 'unknown',
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
    cameraState: 'idle',
    error: null,
    fps: 0,
    faceConfidence: 0,
    lastBlinkTime: 0,
    blinkCount: 0,
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
          scoreThreshold: 0.25,
        }))
        .withFaceLandmarks();

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!detections) {
        noFaceGraceRef.current++;
        if (noFaceGraceRef.current >= NO_FACE_GRACE_FRAMES) {
          consecutiveClosedRef.current = 0;
          setState(prev => ({
            ...prev,
            faceDetected: false,
            eyesOpen: true,
            leftEyeOpen: true,
            rightEyeOpen: true,
            leftEyeState: 'unknown',
            rightEyeState: 'unknown',
            eyeState: 'unknown',
            leftEAR: 0,
            rightEAR: 0,
            avgEAR: 0,
            drowsinessScore: 0,
            landmarks: null,
            faceConfidence: 0,
          }));
        }
        return;
      }

      noFaceGraceRef.current = 0;
      const confidence = Math.round((detections.detection?.score || 0) * 100);
      const landmarks = detections.landmarks;
      const jaw = landmarks.getJawOutline();
      const leftEye = landmarks.getLeftEye();
      const rightEye = landmarks.getRightEye();
      const nose = landmarks.getNose();
      const mouth = landmarks.getMouth();

      const rawLeftEAR = calculateEAR(leftEye);
      const rawRightEAR = calculateEAR(rightEye);

      const smoothLeft = emaSmooth(leftEARHistoryRef.current, rawLeftEAR, EMA_ALPHA);
      const smoothRight = emaSmooth(rightEARHistoryRef.current, rawRightEAR, EMA_ALPHA);
      const smoothAvg = (smoothLeft + smoothRight) / 2;

      leftEARHistoryRef.current.push(smoothLeft);
      rightEARHistoryRef.current.push(smoothRight);
      if (leftEARHistoryRef.current.length > 8) leftEARHistoryRef.current.shift();
      if (rightEARHistoryRef.current.length > 8) rightEARHistoryRef.current.shift();

      if (!stateRef.current.isCalibrated) {
        calibrationSamplesRef.current.push(smoothAvg);
        const progress = Math.min(calibrationSamplesRef.current.length / CALIBRATION_FRAMES, 1);

        if (calibrationSamplesRef.current.length >= CALIBRATION_FRAMES) {
          const sorted = [...calibrationSamplesRef.current].sort((a, b) => a - b);
          const trimCount = Math.floor(sorted.length * 0.15);
          const trimmed = sorted.slice(trimCount, sorted.length - trimCount);
          const baseline = average(trimmed);
          const closedThresh = baseline * 0.45;
          baselineEARRef.current = baseline;
          closedThresholdRef.current = closedThresh;

          console.log(`[FaceDetect] CALIBRATION DONE: baseline=${baseline.toFixed(4)} closedThreshold=${closedThresh.toFixed(4)}`);

          setState(prev => ({
            ...prev,
            faceDetected: true,
            baselineEAR: baseline,
            openThreshold: baseline * 0.72,
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
          if (calibrationSamplesRef.current.length % 10 === 0) {
            console.log(`[FaceDetect] Calibrating: ${Math.round(progress * 100)}% rawL=${rawLeftEAR.toFixed(3)} rawR=${rawRightEAR.toFixed(3)} smL=${smoothLeft.toFixed(3)} smR=${smoothRight.toFixed(3)}`);
          }
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

      // POST-CALIBRATION: Simple threshold comparison using LOCAL variables
      const closedThresh = closedThresholdRef.current;

      const leftClosedNow = smoothLeft < closedThresh;
      const rightClosedNow = smoothRight < closedThresh;
      const bothClosedNow = leftClosedNow && rightClosedNow;
      const bothOpenNow = !leftClosedNow && !rightClosedNow;

      // Update consecutive counter using local variables
      if (bothClosedNow) {
        consecutiveClosedRef.current++;
      } else {
        // Blink detection
        if (consecutiveClosedRef.current > 0 && consecutiveClosedRef.current < 10) {
          const blinkTime = Date.now();
          if (blinkTime - lastBlinkTimeRef.current > 200) {
            blinkCountRef.current++;
            lastBlinkTimeRef.current = blinkTime;
          }
        }
        consecutiveClosedRef.current = 0;
      }

      const leftEyeState: EyeState = leftClosedNow ? 'closed' : 'open';
      const rightEyeState: EyeState = rightClosedNow ? 'closed' : 'open';
      const eyeState: EyeState = bothClosedNow ? 'closed' : bothOpenNow ? 'open' : 'closing';

      let drowsinessScore = 0;
      if (bothClosedNow) {
        drowsinessScore = Math.min(consecutiveClosedRef.current / 30, 1);
      }

      // Log every 10th frame for diagnostics
      logCounterRef.current++;
      if (logCounterRef.current % 10 === 0) {
        console.log(
          `[FaceDetect] rawL=${rawLeftEAR.toFixed(3)} rawR=${rawRightEAR.toFixed(3)} | smL=${smoothLeft.toFixed(3)} smR=${smoothRight.toFixed(3)} | thresh=${closedThresh.toFixed(3)} | L=${leftClosedNow ? 'CLOSED' : 'OPEN'} R=${rightClosedNow ? 'CLOSED' : 'OPEN'} | consec=${consecutiveClosedRef.current}`
        );
      }

      const eyeColor = bothOpenNow ? '#10b981' : eyeState === 'closing' ? '#f59e0b' : '#ef4444';
      drawLandmarks(ctx, jaw, leftEye, rightEye, nose, mouth, landmarks, bothOpenNow, eyeColor);

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

      // Update React state — but use local variables for logic
      setState(prev => ({
        ...prev,
        faceDetected: true,
        eyesOpen: bothOpenNow,
        leftEyeOpen: !leftClosedNow,
        rightEyeOpen: !rightClosedNow,
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
        lastBlinkTime: lastBlinkTimeRef.current,
        blinkCount: blinkCountRef.current,
      }));
    } catch {
      // Ignore detection errors silently
    }
  }, []);

  const startDetection = useCallback(async (video: HTMLVideoElement, canvas: HTMLCanvasElement) => {
    videoRef.current = video;
    canvasRef.current = canvas;

    setState(prev => ({ ...prev, isModelLoading: true, error: null, cameraState: 'connecting' }));

    try {
      if (!modelsLoadedRef.current) {
        console.log('[FaceDetect] Loading models from', MODEL_URL);
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        modelsLoadedRef.current = true;
        console.log('[FaceDetect] Models loaded');
      }

      const existingStream = video.srcObject as MediaStream | null;
      let stream: MediaStream;

      if (existingStream && existingStream.active) {
        stream = existingStream;
        console.log('[FaceDetect] Using existing stream');
      } else {
        console.log('[FaceDetect] Requesting front camera...');
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        });
        console.log('[FaceDetect] Camera obtained');
      }

      streamRef.current = stream;
      video.srcObject = stream;

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Video load timeout')), 10000);
        const onReady = () => {
          clearTimeout(timeout);
          video.play()
            .then(() => { console.log('[FaceDetect] Video playing'); resolve(); })
            .catch((e) => { console.error('[FaceDetect] Play error:', e); reject(e); });
        };
        if (video.readyState >= 1) onReady();
        else video.onloadedmetadata = onReady;
      });

      console.log('[FaceDetect] Video:', video.videoWidth, 'x', video.videoHeight);
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      console.log('[FaceDetect] Starting detection loop...');
      intervalRef.current = window.setInterval(detectFace, DETECTION_INTERVAL_MS);

      setState(prev => ({
        ...prev,
        isModelLoading: false,
        isModelReady: true,
        cameraState: 'active',
      }));
      console.log('[FaceDetect] Ready!');
    } catch (err: any) {
      console.error('[FaceDetect] Error:', err);
      let errorMsg = err.message || 'Failed to start face detection';
      if (err.name === 'NotAllowedError') errorMsg = 'Camera permission denied. Please allow camera access.';
      else if (err.name === 'NotFoundError') errorMsg = 'No camera found. Please connect a camera.';
      else if (err.name === 'NotReadableError') errorMsg = 'Camera is in use by another application.';
      else if (err.message?.includes('timeout')) errorMsg = 'Camera connection timed out.';
      setState(prev => ({
        ...prev,
        isModelLoading: false,
        error: errorMsg,
        cameraState: 'error',
      }));
    }
  }, [detectFace]);

  const stopDetection = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    consecutiveClosedRef.current = 0;
    noFaceGraceRef.current = 0;
    leftEARHistoryRef.current = [];
    rightEARHistoryRef.current = [];
    calibrationSamplesRef.current = [];
    frameCountRef.current = 0;
    fpsRef.current = 0;
    setState(prev => ({ ...prev, cameraState: 'stopped' }));
  }, []);

  const recalibrate = useCallback(() => {
    calibrationSamplesRef.current = [];
    baselineEARRef.current = 0;
    closedThresholdRef.current = 0.16;
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
    return () => { stopDetection(); };
  }, [stopDetection]);

  const getStream = useCallback(() => streamRef.current, []);

  return { ...state, startDetection, stopDetection, getStream, recalibrate, videoRef, canvasRef };
}

function calculateEAR(eyePoints: any[]): number {
  if (eyePoints.length < 6) return 0;

  const p1 = eyePoints[1];
  const p2 = eyePoints[2];
  const p4 = eyePoints[4];
  const p5 = eyePoints[5];
  const p0 = eyePoints[0];
  const p3 = eyePoints[3];

  const vertical1 = Math.hypot(p1.x - p5.x, p1.y - p5.y);
  const vertical2 = Math.hypot(p2.x - p4.x, p2.y - p4.y);
  const horizontal = Math.hypot(p3.x - p0.x, p3.y - p0.y);

  if (horizontal < 1) return 0;
  return (vertical1 + vertical2) / (2.0 * horizontal);
}

function emaSmooth(history: number[], newValue: number, alpha: number): number {
  if (history.length === 0) return newValue;
  const last = history[history.length - 1];
  return alpha * newValue + (1 - alpha) * last;
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
