import { useState, useRef, useCallback, useEffect } from 'react';

export function useBuzzer() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const isPlayingRef = useRef(false);

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
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') return;

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
    if (isPlayingRef.current) return;
    isPlayingRef.current = true;
    setIsPlaying(true);

    const beepCycle = () => {
      if (!isPlayingRef.current) return;
      playBeep(880, 200);
      setTimeout(() => {
        if (!isPlayingRef.current) return;
        playBeep(660, 200);
      }, 250);
      setTimeout(() => {
        if (!isPlayingRef.current) return;
        playBeep(880, 200);
      }, 500);
    };

    beepCycle();
    intervalRef.current = window.setInterval(beepCycle, 1500);
  }, [playBeep]);

  const stopBuzzer = useCallback(() => {
    isPlayingRef.current = false;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    return () => {
      isPlayingRef.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  return { isPlaying, isReady, initAudio, startBuzzer, stopBuzzer };
}
