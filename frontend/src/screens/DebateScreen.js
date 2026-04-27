import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, Alert,
  ActivityIndicator, Animated, Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView }    from 'react-native-safe-area-context';
import { useDebate }       from '../context/DebateContext';
import { useAuth }         from '../context/AuthContext';
import { useToast }        from '../context/ToastContext';
import useDebateTimer      from '../hooks/useDebateTimer';
import useSound            from '../hooks/useSound';
import useHaptics          from '../hooks/useHaptics';
import ArgumentBubble      from '../components/ArgumentBubble';
import ArgumentInput       from '../components/ArgumentInput';
import TimerBar            from '../components/TimerBar';
import RoundProgressBar    from '../components/RoundProgressBar';
import { TouchableOpacity } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../utils/theme';

export default function DebateScreen({ navigation, route }) {
  const { topic, mode, difficulty, stance, totalRounds } = route.params;
  const { token } = useAuth();
  const toast     = useToast();
  const { play }  = useSound();
  const { impact, notification } = useHaptics();

  const {
    debate, arguments: args, scores,
    currentRound, timeLeft: socketTimeLeft,
    status, winner, feedback, currentTurn, error,
    connectSocket, disconnectSocket,
    startDebate, submitArgument, abandonDebate, resetDebate,
  } = useDebate();

  const [inputText,  setInputText]  = useState('');
  const flatListRef  = useRef(null);
  const pulseAnim    = useRef(new Animated.Value(1)).current;
  const prevRoundRef = useRef(currentRound);

  const { timeLeft, formatted, isUrgent, syncTime } = useDebateTimer({
    initialSeconds: 30,
    active: currentTurn === 'user' && status === 'active',
    onExpire: () => {
      toast.warning("Time's up — AI is taking your turn");
      play('timerUrgent');
    },
  });

  useEffect(() => { syncTime(socketTimeLeft); }, [socketTimeLeft]);

  // Connect + start
  useEffect(() => {
  const init = async () => {
    // Pehle connect karo, phir debate start karo
    await connectSocket(token);
    startDebate({
      topicId:       topic._id,
      topicTitle:    topic.title,
      topicCategory: topic.category,
      mode,
      stance,
      difficulty,
      totalRounds,
    });
  };
  init();
  return () => { disconnectSocket(); resetDebate(); };
}, []);

  // Navigate to results
  useEffect(() => {
    if (status === 'completed') {
      notification(winner === 'user' ? 'success' : 'warning');
      play(winner === 'user' ? 'debateWin' : 'debateLoss');
      navigation.replace('Results', { debate, scores, winner, feedback, topic });
    }
  }, [status]);

  // Sound + haptic on user's turn start
  useEffect(() => {
    if (currentTurn === 'user' && status === 'active') {
      play('turnStart');
      impact('medium');
    }
  }, [currentTurn]);

  // Sound on new round
  useEffect(() => {
    if (currentRound > 1 && currentRound !== prevRoundRef.current) {
      prevRoundRef.current = currentRound;
      play('roundEnd');
      toast.info(`Round ${currentRound} of ${totalRounds}`);
    }
  }, [currentRound]);

  // Sound on AI argument received
  useEffect(() => {
    const lastArg = args[args.length - 1];
    if (lastArg?.speaker === 'ai') play('aiResponse');
  }, [args.length]);

  // Error toasts
  useEffect(() => { if (error) toast.error(error); }, [error]);

  // Pulse on my turn
  useEffect(() => {
    if (currentTurn === 'user' && status === 'active') {
      Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.012, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,     duration: 900, useNativeDriver: true }),
      ])).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [currentTurn, status]);

  // Auto-scroll
  useEffect(() => {
    if (args.length > 0) setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 150);
  }, [args.length]);

  const handleSubmit = useCallback(() => {
    const text = inputText.trim();
    if (!text) { toast.warning('Write your argument first'); return; }
    if (!debate?.debateId) return;
    submitArgument(debate.debateId, text, false);
    setInputText('');
    impact('light');
    play('buttonTap');
  }, [inputText, debate, submitArgument]);

  const handleAbandon = () => Alert.alert('Abandon Debate?', 'Your progress will be lost.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Abandon', style: 'destructive', onPress: () => {
      if (debate?.debateId) abandonDebate(debate.debateId);
      navigation.goBack();
    }},
  ]);

  const isMyTurn = currentTurn === 'user' && status === 'active';
  const aiThinks = status === 'ai_thinking';
  const starting = status === 'idle' || status === 'starting';

  return (
    <SafeAreaView style={S.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>

        {/* Header */}
        <View style={S.header}>
          <View style={{ flex: 1 }}>
            <Text style={S.modeTag}>
              {mode === 'ai_vs_user' ? '🤖 AI Mode' : mode === 'practice' ? '📚 Practice' : '👥 PvP'} · {difficulty}
            </Text>
            <Text style={S.topicText} numberOfLines={2}>{topic.title}</Text>
          </View>
          <TouchableOpacity style={S.closeBtn} onPress={handleAbandon}>
            <Text style={S.closeTxt}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Scoreboard */}
        <View style={S.board}>
          <View style={S.scoreCol}>
            <Text style={S.scoreName}>You</Text>
            <Text style={[S.scoreNum, { color: COLORS.scoreUser }]}>{scores.user.total}</Text>
            <Text style={S.stanceLbl}>{stance.toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <RoundProgressBar currentRound={currentRound} totalRounds={totalRounds} />
          </View>
          <View style={S.scoreCol}>
            <Text style={[S.scoreNum, { color: COLORS.scoreOpponent }]}>{scores.opponent.total}</Text>
            <Text style={S.scoreName}>AI</Text>
            <Text style={S.stanceLbl}>{stance === 'for' ? 'AGAINST' : 'FOR'}</Text>
          </View>
        </View>

        {/* Timer */}
        <TimerBar timeLeft={timeLeft} maxTime={30} isMyTurn={isMyTurn} aiThinking={aiThinks} currentTurn={currentTurn} />

        {/* Feed */}
        {starting ? (
          <View style={S.startWrap}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={S.startTxt}>Preparing debate arena...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={args}
            keyExtractor={(_, i) => String(i)}
            contentContainerStyle={S.feed}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => <ArgumentBubble argument={item} />}
            ListEmptyComponent={
              <View style={S.emptyFeed}>
                <Text style={{ fontSize: 32, marginBottom: 10 }}>⚡</Text>
                <Text style={S.emptyTxt}>{isMyTurn ? 'Make your opening argument!' : 'Waiting...'}</Text>
              </View>
            }
            ListFooterComponent={
              aiThinks ? (
                <View style={S.thinkRow}>
                  <View style={S.dots}>{[0,1,2].map(i => <View key={i} style={[S.dot, { opacity: 0.3 + i*0.3 }]} />)}</View>
                  <Text style={S.thinkTxt}>AI is constructing argument...</Text>
                </View>
              ) : null
            }
          />
        )}

        {/* Argument input — uses the reusable ArgumentInput component */}
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <ArgumentInput
            value={inputText}
            onChange={setInputText}
            onSubmit={handleSubmit}
            disabled={!isMyTurn}
            isMyTurn={isMyTurn}
            isUrgent={isUrgent}
            formattedTime={formatted}
            placeholder={isMyTurn ? 'Type your argument...' : aiThinks ? 'AI is thinking...' : 'Waiting...'}
            showNLPHints
          />
        </Animated.View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: COLORS.bg },
  header:    { flexDirection: 'row', alignItems: 'flex-start', padding: SPACING.lg, paddingBottom: SPACING.sm },
  modeTag:   { fontSize: 10, fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  topicText: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, lineHeight: 20 },
  closeBtn:  { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.bgSurface, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', marginLeft: 10 },
  closeTxt:  { color: COLORS.textSecondary, fontSize: 14, fontWeight: '700' },
  board:     { flexDirection: 'row', marginHorizontal: SPACING.lg, marginBottom: SPACING.sm, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.sm, alignItems: 'center' },
  scoreCol:  { alignItems: 'center', width: 60 },
  scoreName: { fontSize: 10, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 },
  scoreNum:  { fontSize: 26, fontWeight: '700', lineHeight: 32 },
  stanceLbl: { fontSize: 8, color: COLORS.textMuted, letterSpacing: 0.5 },
  startWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  startTxt:  { color: COLORS.textSecondary, marginTop: 12, fontSize: 14 },
  feed:      { padding: SPACING.md, paddingBottom: 8, gap: 12, flexGrow: 1 },
  emptyFeed: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyTxt:  { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
  thinkRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  dots:      { flexDirection: 'row', gap: 4 },
  dot:       { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.accent },
  thinkTxt:  { fontSize: 12, color: COLORS.textMuted, fontStyle: 'italic' },
});
