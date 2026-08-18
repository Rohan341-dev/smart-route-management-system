import { useRef, useCallback, useState, useEffect } from 'react';

export function useWebRTC() {
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [role, setRole] = useState<'driver' | 'admin'>('driver');

  const createPeer = useCallback(() => {
    const peer = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        const key = role === 'driver' ? 'webrtc-driver-candidate' : 'webrtc-admin-candidate';
        localStorage.setItem(key, JSON.stringify(event.candidate));
      }
    };

    peer.ontrack = (event) => {
      console.log('[WebRTC] Received track:', event.track.kind, 'streams:', event.streams.length);
      if (event.streams[0]) {
        console.log('[WebRTC] Stream tracks:', event.streams[0].getTracks().map(t => t.kind));
      }
      setRemoteStream(event.streams[0]);
      setConnectionState('connected');
    };

    peer.onconnectionstatechange = () => {
      const state = peer.connectionState;
      if (state === 'connected') setConnectionState('connected');
      else if (state === 'disconnected' || state === 'failed') setConnectionState('disconnected');
      else if (state === 'connecting') setConnectionState('connecting');
    };

    peerRef.current = peer;
    return peer;
  }, [role]);

  const startAsDriver = useCallback(async (stream: MediaStream) => {
    setRole('driver');
    setLocalStream(stream);
    setConnectionState('connecting');

    const peer = createPeer();
    stream.getTracks().forEach(track => peer.addTrack(track, stream));

    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    localStorage.setItem('webrtc-offer', JSON.stringify(offer));

    // Watch for answer
    const checkAnswer = setInterval(async () => {
      const answerData = localStorage.getItem('webrtc-answer');
      if (answerData && peer.signalingState === 'have-local-offer') {
        clearInterval(checkAnswer);
        const answer = JSON.parse(answerData);
        await peer.setRemoteDescription(new RTCSessionDescription(answer));
        localStorage.removeItem('webrtc-answer');
      }
    }, 500);

    // Watch for ICE candidates from admin
    const checkCandidates = setInterval(() => {
      const candidateData = localStorage.getItem('webrtc-admin-candidate');
      if (candidateData && peer.remoteDescription) {
        clearInterval(checkCandidates);
        const candidate = JSON.parse(candidateData);
        peer.addIceCandidate(new RTCIceCandidate(candidate));
        localStorage.removeItem('webrtc-admin-candidate');
      }
    }, 500);

    return () => {
      clearInterval(checkAnswer);
      clearInterval(checkCandidates);
    };
  }, [createPeer]);

  const startAsAdmin = useCallback(async () => {
    setRole('admin');
    setConnectionState('connecting');

    const peer = createPeer();

    // Watch for offer
    const checkOffer = setInterval(async () => {
      const offerData = localStorage.getItem('webrtc-offer');
      if (offerData && peer.signalingState === 'stable') {
        clearInterval(checkOffer);
        const offer = JSON.parse(offerData);
        await peer.setRemoteDescription(new RTCSessionDescription(offer));

        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        localStorage.setItem('webrtc-answer', JSON.stringify(answer));
        localStorage.removeItem('webrtc-offer');
      }
    }, 500);

    // Watch for ICE candidates from driver
    const checkCandidates = setInterval(() => {
      const candidateData = localStorage.getItem('webrtc-driver-candidate');
      if (candidateData && peer.remoteDescription) {
        clearInterval(checkCandidates);
        const candidate = JSON.parse(candidateData);
        peer.addIceCandidate(new RTCIceCandidate(candidate));
        localStorage.removeItem('webrtc-driver-candidate');
      }
    }, 500);

    return () => {
      clearInterval(checkOffer);
      clearInterval(checkCandidates);
    };
  }, [createPeer]);

  const disconnect = useCallback(() => {
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }
    setRemoteStream(null);
    setLocalStream(null);
    setConnectionState('disconnected');
    localStorage.removeItem('webrtc-offer');
    localStorage.removeItem('webrtc-answer');
    localStorage.removeItem('webrtc-driver-candidate');
    localStorage.removeItem('webrtc-admin-candidate');
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    localStream,
    remoteStream,
    connectionState,
    role,
    startAsDriver,
    startAsAdmin,
    disconnect,
  };
}
