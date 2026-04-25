import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../utils/theme';

const ScorePill = ({ label, value }) => (
  <View style={styles.pill}>
    <Text style={styles.pillText}>{label} {value}</Text>
  </View>
);

export default function ArgumentBubble({ argument }) {
  const isUser = argument.speaker === 'user';
  const scores = argument.scores;

  return (
    <View style={[styles.wrap, isUser ? styles.wrapUser : styles.wrapAI]}>
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
        <Text style={[styles.speaker, isUser ? styles.speakerUser : styles.speakerAI]}>
          {isUser ? 'You' : 'AI Opponent'} · Round {argument.round}
        </Text>
        <Text style={styles.text}>{argument.text}</Text>

        {scores && (
          <View style={styles.scores}>
            {scores.logic      > 0 && <ScorePill label="Logic"   value={scores.logic} />}
            {scores.clarity    > 0 && <ScorePill label="Clarity" value={scores.clarity} />}
            {scores.relevance  > 0 && <ScorePill label="Rel."    value={scores.relevance} />}
            {scores.confidence > 0 && <ScorePill label="Conf."   value={scores.confidence} />}
          </View>
        )}

        {argument.nlp?.intent && (
          <Text style={styles.intent}>{argument.nlp.intent} · {argument.nlp.sentiment}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:         { width: '100%' },
  wrapUser:     { alignItems: 'flex-end' },
  wrapAI:       { alignItems: 'flex-start' },
  bubble: {
    maxWidth:     '88%',
    borderRadius: RADIUS.lg,
    padding:      SPACING.md,
    borderWidth:  1,
  },
  bubbleUser: {
    backgroundColor: COLORS.primaryBg,
    borderColor:     COLORS.primary + '66',
    borderBottomRightRadius: 4,
  },
  bubbleAI: {
    backgroundColor: COLORS.bgCard,
    borderColor:     COLORS.border,
    borderBottomLeftRadius: 4,
  },
  speaker:     { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  speakerUser: { color: COLORS.primary },
  speakerAI:   { color: COLORS.accent },
  text:        { fontSize: 13, color: COLORS.textPrimary, lineHeight: 20 },
  scores:      { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 10 },
  pill:        { backgroundColor: COLORS.bgSurface, borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: COLORS.border },
  pillText:    { fontSize: 10, color: COLORS.textSecondary, fontWeight: '600' },
  intent:      { fontSize: 10, color: COLORS.textMuted, marginTop: 6, fontStyle: 'italic' },
});
