import { useState, useRef, useCallback, useEffect } from 'react';

export function useBuzzer() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const intervalRef = useRef<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const initAudio = useCallback(async () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = ctx;
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      setIsReady(true);
      return true;
    } catch {
      return false;
    }
  }, []);

  const playBeep = useCallback((frequency = 880, duration = 200) => {
    if (!audioContextRef.current) return;

    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration / 1000);
  }, []);

  const startBuzzer = useCallback(() => {
    if (isPlaying) return;
    setIsPlaying(true);
    let count = 0;
    const beepCycle = () => {
      count++;
      playBeep(880, 200);
      setTimeout(() => playBeep(660, 200), 250);
      setTimeout(() => playBeep(880, 200), 500);
    };
    beepCycle();
    intervalRef.current = window.setInterval(beepCycle, 1500);
  }, [isPlaying, playBeep]);

  const stopBuzzer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return { isPlaying, isReady, initAudio, startBuzzer, stopBuzzer };
}
