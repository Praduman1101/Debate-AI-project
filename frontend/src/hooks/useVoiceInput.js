import { useState, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import { Alert } from 'react-native';
import { VoiceAPI } from '../services/api';

/**
 * useVoiceInput
 * Records audio via expo-av, uploads to the backend Whisper proxy,
 * and returns the transcript via onTranscript callback.
 *
 * Falls back gracefully if permissions are denied or OPENAI_API_KEY
 * is not configured on the server.
 */
export default function useVoiceInput({ onTranscript, topic = '', maxDurationMs = 30000 } = {}) {
  const [isRecording,  setIsRecording]  = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript,   setTranscript]   = useState('');
  const [error,        setError]        = useState(null);

  const recordingRef = useRef(null);
  const timeoutRef   = useRef(null);

  const requestPermissions = async () => {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Microphone Access', 'Please grant microphone permission in Settings.');
      return false;
    }
    return true;
  };

  const startRecording = useCallback(async () => {
    setError(null);
    if (!(await requestPermissions())) return;

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true, playsInSilentModeIOS: true,
        shouldDuckAndroid: true, playThroughEarpieceAndroid: false,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setIsRecording(true);
      timeoutRef.current = setTimeout(stopRecording, maxDurationMs);
    } catch (e) {
      setError('Could not start recording: ' + e.message);
    }
  }, [maxDurationMs]);

  const stopRecording = useCallback(async () => {
    if (!recordingRef.current) return;
    clearTimeout(timeoutRef.current);
    setIsRecording(false);
    setIsProcessing(true);

    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      if (!uri) throw new Error('No audio recorded');

      const res  = await VoiceAPI.transcribe(uri, topic);
      const text = res.data?.transcript?.trim() || '';
      setTranscript(text);
      if (onTranscript && text) onTranscript(text);
    } catch (e) {
      const msg = e.response?.data?.error || e.message || 'Transcription failed';
      setError(msg.includes('not configured') ? 'Voice input requires OPENAI_API_KEY on the server' : msg);
    } finally {
      setIsProcessing(false);
      Audio.setAudioModeAsync({ allowsRecordingIOS: false }).catch(() => {});
    }
  }, [topic, onTranscript]);

  const clearTranscript = useCallback(() => { setTranscript(''); setError(null); }, []);

  return { isRecording, isProcessing, transcript, error, startRecording, stopRecording, clearTranscript };
}
