import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../utils/theme';

export default function TimerBar({ timeLeft, maxTime = 30, isMyTurn, aiThinking, currentTurn }) {
  const progress = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pct = timeLeft / maxTime;
    Animated.timing(progress, {
      toValue:  pct,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [timeLeft]);

  const barColor = progress.interpolate({
    inputRange:  [0, 0.3, 0.6, 1],
    outputRange: [COLORS.danger, COLORS.amber, COLORS.accent, COLORS.primary],
  });

  const urgent = timeLeft <= 10 && isMyTurn;

  return (
    <View style={styles.wrap}>
      <View style={styles.labelsRow}>
        <View style={[styles.turnBadge, isMyTurn ? styles.turnBadgeActive : styles.turnBadgeIdle]}>
          <Text style={[styles.turnText, isMyTurn && styles.turnTextActive]}>
            {aiThinking ? '🤖 AI thinking...' : isMyTurn ? '⚡ Your turn' : '⏳ AI turn'}
          </Text>
        </View>
        <Text style={[styles.timer, urgent && styles.timerUrgent]}>
          0:{String(timeLeft).padStart(2, '0')}
        </Text>
      </View>
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            {
              width:           progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
              backgroundColor: barColor,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:             { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm },
  labelsRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  turnBadge:        { borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1, borderColor: COLORS.border },
  turnBadgeActive:  { borderColor: COLORS.primary, backgroundColor: COLORS.primaryBg },
  turnBadgeIdle:    { backgroundColor: COLORS.bgCard },
  turnText:         { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
  turnTextActive:   { color: COLORS.primary },
  timer:            { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, fontVariant: ['tabular-nums'] },
  timerUrgent:      { color: COLORS.danger },
  track:            { height: 4, backgroundColor: COLORS.bgSurface, borderRadius: 2, overflow: 'hidden' },
  fill:             { height: '100%', borderRadius: 2 },
});
