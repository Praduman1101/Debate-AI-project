import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SPACING } from '../utils/theme';

const MODES = [
  {
    id:    'ai_vs_user',
    icon:  '🤖',
    title: 'AI vs You',
    desc:  'Debate a Claude AI opponent in real-time with live scoring and feedback.',
    tag:   'Most Popular',
    color: COLORS.primary,
  },
  {
    id:    'user_vs_user',
    icon:  '👥',
    title: 'User vs User',
    desc:  'Get matched with a real opponent who chose the same topic.',
    tag:   'Multiplayer',
    color: COLORS.accent,
  },
  {
    id:    'practice',
    icon:  '📚',
    title: 'Practice Mode',
    desc:  'No scoring pressure — freely explore and structure your arguments.',
    tag:   'No Pressure',
    color: COLORS.amber,
  },
];

const DIFFICULTIES = [
  { id: 'beginner',     label: 'Beginner',     emoji: '🌱', desc: 'Clear, forgiving arguments' },
  { id: 'intermediate', label: 'Intermediate', emoji: '⚡', desc: 'Balanced challenge' },
  { id: 'expert',       label: 'Expert',        emoji: '🔥', desc: 'Rigorous & relentless' },
];

const STANCES = [
  { id: 'for',     label: 'For',     emoji: '✅', desc: 'Argue in favour' },
  { id: 'against', label: 'Against', emoji: '❌', desc: 'Argue against' },
  { id: 'random',  label: 'Random',  emoji: '🎲', desc: 'Decide at start' },
];

const ROUND_OPTIONS = [2, 4, 6];

const OptionCard = ({ item, selected, onPress }) => (
  <TouchableOpacity
    style={[styles.optCard, selected && styles.optCardSelected]}
    onPress={onPress}
    activeOpacity={0.75}
  >
    <Text style={styles.optEmoji}>{item.emoji}</Text>
    <Text style={[styles.optLabel, selected && { color: COLORS.primary }]}>{item.label}</Text>
    <Text style={styles.optDesc}>{item.desc}</Text>
  </TouchableOpacity>
);

export default function ModeScreen({ navigation, route }) {
  const { topic } = route.params;

  const [mode,       setMode]       = useState('ai_vs_user');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [stance,     setStance]     = useState('for');
  const [rounds,     setRounds]     = useState(4);
  const [timerOn,    setTimerOn]    = useState(true);

  const handleStart = () => {
    const resolvedStance =
      stance === 'random' ? (Math.random() > 0.5 ? 'for' : 'against') : stance;

    if (mode === 'user_vs_user') {
      navigation.navigate('Matchmaking', {
        topic,
        stance:      resolvedStance,
        difficulty,
        totalRounds: rounds,
      });
    } else {
      navigation.navigate('Debate', {
        topic,
        mode,
        difficulty,
        stance:      resolvedStance,
        totalRounds: rounds,
        timerOn,
      });
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back + Topic */}
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.topicCard}>
          <Text style={styles.topicMeta}>{topic.category?.toUpperCase()} · {topic.difficulty}</Text>
          <Text style={styles.topicTitle}>{topic.title}</Text>
        </View>

        {/* Mode selection */}
        <Text style={styles.sectionTitle}>Mode</Text>
        <View style={styles.modeList}>
          {MODES.map(m => (
            <TouchableOpacity
              key={m.id}
              style={[styles.modeCard, mode === m.id && { borderColor: m.color, borderWidth: 2, backgroundColor: m.color + '18' }]}
              onPress={() => setMode(m.id)}
              activeOpacity={0.8}
            >
              <View style={styles.modeLeft}>
                <View style={[styles.modeIconBox, { backgroundColor: m.color + '22' }]}>
                  <Text style={styles.modeIcon}>{m.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.modeTitleRow}>
                    <Text style={styles.modeTitle}>{m.title}</Text>
                    <View style={[styles.modeTag, { backgroundColor: m.color + '22' }]}>
                      <Text style={[styles.modeTagText, { color: m.color }]}>{m.tag}</Text>
                    </View>
                  </View>
                  <Text style={styles.modeDesc}>{m.desc}</Text>
                </View>
              </View>
              {mode === m.id && (
                <View style={[styles.modeTick, { backgroundColor: m.color }]}>
                  <Text style={styles.modeTickText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Stance */}
        <Text style={styles.sectionTitle}>Your Stance</Text>
        <View style={styles.optRow}>
          {STANCES.map(s => (
            <OptionCard key={s.id} item={s} selected={stance === s.id} onPress={() => setStance(s.id)} />
          ))}
        </View>

        {/* Difficulty (AI mode only) */}
        {mode !== 'user_vs_user' && (
          <>
            <Text style={styles.sectionTitle}>AI Difficulty</Text>
            <View style={styles.optRow}>
              {DIFFICULTIES.map(d => (
                <OptionCard key={d.id} item={d} selected={difficulty === d.id} onPress={() => setDifficulty(d.id)} />
              ))}
            </View>
          </>
        )}

        {/* Rounds */}
        <Text style={styles.sectionTitle}>Rounds</Text>
        <View style={styles.roundRow}>
          {ROUND_OPTIONS.map(r => (
            <TouchableOpacity
              key={r}
              style={[styles.roundBtn, rounds === r && styles.roundBtnActive]}
              onPress={() => setRounds(r)}
            >
              <Text style={[styles.roundNum, rounds === r && { color: COLORS.primary }]}>{r}</Text>
              <Text style={[styles.roundLbl, rounds === r && { color: COLORS.primary }]}>rounds</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Timer toggle */}
        {mode !== 'practice' && (
          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.toggleLabel}>⏱ Turn Timer</Text>
              <Text style={styles.toggleSub}>30 seconds per argument</Text>
            </View>
            <Switch
              value={timerOn}
              onValueChange={setTimerOn}
              trackColor={{ false: COLORS.bgSurface, true: COLORS.primary }}
              thumbColor={timerOn ? '#fff' : COLORS.textMuted}
            />
          </View>
        )}

        {/* Summary card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Setup Summary</Text>
          <View style={styles.summaryGrid}>
            {[
              ['Mode',       MODES.find(m2 => m2.id === mode)?.title],
              ['Stance',     stance === 'random' ? 'Random' : stance],
              ['Difficulty', mode === 'user_vs_user' ? 'Matched' : difficulty],
              ['Rounds',     `${rounds} rounds`],
            ].map(([lbl, val]) => (
              <View key={lbl} style={styles.summaryItem}>
                <Text style={styles.summaryItemLabel}>{lbl}</Text>
                <Text style={styles.summaryItemValue}>{val}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* CTA */}
        <TouchableOpacity style={styles.startBtn} onPress={handleStart} activeOpacity={0.85}>
          <Text style={styles.startBtnText}>
            {mode === 'user_vs_user' ? '🔍 Find Opponent' : '⚡ Start Debate'}
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: COLORS.bg },
  container:        { padding: SPACING.xl, paddingBottom: 50 },
  back:             { marginBottom: SPACING.lg },
  backText:         { color: COLORS.textSecondary, fontSize: 14 },

  topicCard:        { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.xl },
  topicMeta:        { fontSize: 10, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 0.8, marginBottom: 5 },
  topicTitle:       { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, lineHeight: 24 },

  sectionTitle:     { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },

  modeList:         { gap: 10, marginBottom: SPACING.xl },
  modeCard:         { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border, position: 'relative' },
  modeLeft:         { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  modeIconBox:      { width: 44, height: 44, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  modeIcon:         { fontSize: 22 },
  modeTitleRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  modeTitle:        { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  modeTag:          { borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 2 },
  modeTagText:      { fontSize: 10, fontWeight: '700' },
  modeDesc:         { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
  modeTick:         { position: 'absolute', top: 12, right: 12, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  modeTickText:     { fontSize: 11, color: '#fff', fontWeight: '700' },

  optRow:           { flexDirection: 'row', gap: 8, marginBottom: SPACING.xl },
  optCard:          { flex: 1, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, padding: 12, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  optCardSelected:  { borderColor: COLORS.primary, backgroundColor: COLORS.primaryBg },
  optEmoji:         { fontSize: 18, marginBottom: 5 },
  optLabel:         { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  optDesc:          { fontSize: 10, color: COLORS.textMuted, textAlign: 'center' },

  roundRow:         { flexDirection: 'row', gap: 12, marginBottom: SPACING.xl },
  roundBtn:         { flex: 1, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  roundBtnActive:   { borderColor: COLORS.primary, backgroundColor: COLORS.primaryBg },
  roundNum:         { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary },
  roundLbl:         { fontSize: 10, color: COLORS.textMuted, marginTop: 2 },

  toggleRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.xl },
  toggleLabel:      { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 3 },
  toggleSub:        { fontSize: 12, color: COLORS.textMuted },

  summaryCard:      { backgroundColor: COLORS.bgSurface, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.lg, borderWidth: 1, borderColor: COLORS.border },
  summaryTitle:     { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 12 },
  summaryGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  summaryItem:      { width: '45%' },
  summaryItemLabel: { fontSize: 11, color: COLORS.textMuted, marginBottom: 2 },
  summaryItemValue: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, textTransform: 'capitalize' },

  startBtn:         { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, padding: 16, alignItems: 'center' },
  startBtnText:     { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
});
