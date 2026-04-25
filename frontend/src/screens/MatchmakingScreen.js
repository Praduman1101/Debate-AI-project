import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import socketService from '../services/socket';
import { useAuth }   from '../context/AuthContext';
import { COLORS, RADIUS, SPACING } from '../utils/theme';

const MAX_WAIT_SECONDS = 60;

export default function MatchmakingScreen({ navigation, route }) {
  const { topic, stance, difficulty, totalRounds } = route.params;
  const { token } = useAuth();

  const [status,    setStatus]    = useState('searching'); // searching | matched | timeout
  const [waitTime,  setWaitTime]  = useState(0);
  const [queuePos,  setQueuePos]  = useState(null);
  const [opponent,  setOpponent]  = useState(null);

  const pulseAnim  = useRef(new Animated.Value(1)).current;
  const timerRef   = useRef(null);
  const socketRef  = useRef(null);

  // Pulse animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Connect socket + join matchmaking
  useEffect(() => {
    const socket = socketService.connect(token);
    socketRef.current = socket;

    socket.emit('matchmaking:join', {
      topicId:       topic._id,
      topicTitle:    topic.title,
      topicCategory: topic.category,
      stance,
      difficulty,
    });

    socket.on('matchmaking:waiting', ({ queuePosition }) => {
      setStatus('searching');
      setQueuePos(queuePosition);
    });

    socket.on('matchmaking:matched', ({ debateId, roomId, yourStance, opponentName }) => {
      setStatus('matched');
      setOpponent(opponentName);
      clearInterval(timerRef.current);
      // Brief delay so user sees "Matched!" before navigating
      setTimeout(() => {
        navigation.replace('Debate', {
          topic, mode: 'user_vs_user',
          stance: yourStance, difficulty, totalRounds,
          debateId, roomId,
        });
      }, 1500);
    });

    socket.on('matchmaking:timeout', ({ message }) => {
      setStatus('timeout');
      clearInterval(timerRef.current);
    });

    socket.on('error', ({ message }) => {
      Alert.alert('Error', message);
      navigation.goBack();
    });

    // Wait timer
    timerRef.current = setInterval(() => {
      setWaitTime(prev => prev + 1);
    }, 1000);

    return () => {
      socket.emit('matchmaking:leave');
      socket.off('matchmaking:waiting');
      socket.off('matchmaking:matched');
      socket.off('matchmaking:timeout');
      socket.off('error');
      clearInterval(timerRef.current);
    };
  }, [token]);

  const handleCancel = () => {
    socketRef.current?.emit('matchmaking:leave');
    navigation.goBack();
  };

  const handleRetry = () => {
    setStatus('searching');
    setWaitTime(0);
    socketRef.current?.emit('matchmaking:join', {
      topicId: topic._id, topicTitle: topic.title,
      topicCategory: topic.category, stance, difficulty,
    });
    timerRef.current = setInterval(() => setWaitTime(prev => prev + 1), 1000);
  };

  const handleSwitchToAI = () => {
    socketRef.current?.emit('matchmaking:leave');
    navigation.replace('Debate', {
      topic, mode: 'ai_vs_user', stance, difficulty, totalRounds,
    });
  };

  const progressPct = Math.min(waitTime / MAX_WAIT_SECONDS, 1);

  return (
    <SafeAreaView style={S.safe}>
      <View style={S.container}>

        {/* Back */}
        <TouchableOpacity style={S.backBtn} onPress={handleCancel}>
          <Text style={S.backText}>✕ Cancel</Text>
        </TouchableOpacity>

        {/* Topic pill */}
        <View style={S.topicPill}>
          <Text style={S.topicPillText} numberOfLines={2}>{topic.title}</Text>
        </View>

        {/* Main status area */}
        {status === 'searching' && (
          <>
            <Animated.View style={[S.radarOuter, { transform: [{ scale: pulseAnim }] }]}>
              <View style={S.radarMid}>
                <View style={S.radarInner}>
                  <Text style={S.radarIcon}>🔍</Text>
                </View>
              </View>
            </Animated.View>
            <Text style={S.statusTitle}>Finding opponent...</Text>
            <Text style={S.statusSub}>
              {queuePos ? `You are #${queuePos} in queue` : 'Searching globally'}
            </Text>
            <Text style={S.timerText}>
              Wait time: {Math.floor(waitTime / 60)}:{String(waitTime % 60).padStart(2, '0')}
            </Text>

            {/* Progress bar */}
            <View style={S.progressTrack}>
              <View style={[S.progressFill, { width: `${progressPct * 100}%` }]} />
            </View>

            {waitTime > 20 && (
              <View style={S.tipBox}>
                <Text style={S.tipText}>
                  💡 Taking longer than usual. You can switch to AI mode while waiting.
                </Text>
              </View>
            )}
          </>
        )}

        {status === 'matched' && (
          <>
            <View style={S.matchedIcon}>
              <Text style={{ fontSize: 56 }}>⚔️</Text>
            </View>
            <Text style={S.matchedTitle}>Opponent Found!</Text>
            <Text style={S.matchedSub}>
              You vs <Text style={{ color: COLORS.primary, fontWeight: '700' }}>{opponent}</Text>
            </Text>
            <ActivityIndicator color={COLORS.primary} style={{ marginTop: 20 }} />
            <Text style={S.matchedLoadingTxt}>Preparing arena...</Text>
          </>
        )}

        {status === 'timeout' && (
          <>
            <View style={S.timeoutIcon}>
              <Text style={{ fontSize: 56 }}>⏰</Text>
            </View>
            <Text style={S.statusTitle}>No opponent found</Text>
            <Text style={S.statusSub}>Nobody is queued for this topic right now</Text>
            <TouchableOpacity style={S.retryBtn} onPress={handleRetry}>
              <Text style={S.retryText}>🔄 Try Again</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Action buttons */}
        <View style={S.actions}>
          {status === 'searching' && (
            <TouchableOpacity style={S.aiBtn} onPress={handleSwitchToAI}>
              <Text style={S.aiBtnText}>🤖 Switch to AI Mode</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={S.cancelBtn} onPress={handleCancel}>
            <Text style={S.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: COLORS.bg },
  container:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  backBtn:    { position: 'absolute', top: SPACING.lg, left: SPACING.xl },
  backText:   { fontSize: 14, color: COLORS.textSecondary },
  topicPill:  { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.full, paddingHorizontal: 20, paddingVertical: 10, borderWidth: 1, borderColor: COLORS.border, marginBottom: 40, maxWidth: '85%' },
  topicPillText: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center' },
  radarOuter: { width: 140, height: 140, borderRadius: 70, backgroundColor: COLORS.primaryBg + '44', borderWidth: 1, borderColor: COLORS.primary + '33', alignItems: 'center', justifyContent: 'center', marginBottom: 30 },
  radarMid:   { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.primaryBg + '77', borderWidth: 1, borderColor: COLORS.primary + '55', alignItems: 'center', justifyContent: 'center' },
  radarInner: { width: 68, height: 68, borderRadius: 34, backgroundColor: COLORS.primaryBg, borderWidth: 2, borderColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  radarIcon:  { fontSize: 28 },
  statusTitle:{ fontSize: 22, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center', marginBottom: 8 },
  statusSub:  { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 16 },
  timerText:  { fontSize: 16, fontWeight: '600', color: COLORS.primary, marginBottom: 16, fontVariant: ['tabular-nums'] },
  progressTrack: { width: '80%', height: 4, backgroundColor: COLORS.bgSurface, borderRadius: 2, overflow: 'hidden', marginBottom: 20 },
  progressFill:  { height: '100%', backgroundColor: COLORS.primary, borderRadius: 2 },
  tipBox:     { backgroundColor: COLORS.accentBg, borderRadius: RADIUS.md, padding: 14, borderWidth: 1, borderColor: COLORS.accent + '55', maxWidth: '85%', marginBottom: 16 },
  tipText:    { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },
  matchedIcon:{ marginBottom: 24 },
  matchedTitle:{ fontSize: 26, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 },
  matchedSub: { fontSize: 16, color: COLORS.textSecondary, marginBottom: 16 },
  matchedLoadingTxt: { fontSize: 13, color: COLORS.textMuted, marginTop: 10 },
  timeoutIcon:{ marginBottom: 24 },
  retryBtn:   { backgroundColor: COLORS.primaryBg, borderRadius: RADIUS.lg, paddingVertical: 13, paddingHorizontal: 32, borderWidth: 1, borderColor: COLORS.primary, marginTop: 20 },
  retryText:  { fontSize: 15, fontWeight: '700', color: COLORS.primary },
  actions:    { position: 'absolute', bottom: 40, width: '100%', paddingHorizontal: SPACING.xl, gap: 10 },
  aiBtn:      { backgroundColor: COLORS.accentBg, borderRadius: RADIUS.lg, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: COLORS.accent + '55' },
  aiBtnText:  { fontSize: 14, fontWeight: '700', color: COLORS.accent },
  cancelBtn:  { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  cancelText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
});
