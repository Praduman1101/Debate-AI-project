import React, { useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Animated, Share,
} from 'react-native';
import { SafeAreaView }  from 'react-native-safe-area-context';
import api               from '../services/api';
import ScoreRadar        from '../components/ScoreRadar';
import { useToast }      from '../context/ToastContext';
import useBadgeUnlock    from '../hooks/useBadgeUnlock';
import { COLORS, RADIUS, SPACING } from '../utils/theme';
import { scoreToGrade, getResultConfig, formatDuration } from '../utils/helpers';

/* ─── Animated metric bar ─────────────────────────────────────────────── */
const AnimatedBar = ({ value, color, delay = 0 }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setTimeout(() => {
      Animated.timing(anim, {
        toValue:         value / 100,
        duration:        700,
        useNativeDriver: false,
      }).start();
    }, delay);
  }, []);

  return (
    <View style={bar.track}>
      <Animated.View
        style={[
          bar.fill,
          {
            width:           anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
};

const bar = StyleSheet.create({
  track: { flex: 1, height: 6, backgroundColor: COLORS.bgSurface, borderRadius: 3, overflow: 'hidden' },
  fill:  { height: '100%', borderRadius: 3 },
});

/* ─── Metric row ──────────────────────────────────────────────────────── */
const MetricRow = ({ label, userVal = 0, aiVal = 0, delay = 0 }) => (
  <View style={styles.metricRow}>
    <Text style={styles.metricLabel}>{label}</Text>
    <View style={styles.metricBars}>
      <View style={styles.barSide}>
        <Text style={[styles.barVal, { color: COLORS.scoreUser }]}>{userVal}</Text>
        <AnimatedBar value={userVal} color={COLORS.scoreUser} delay={delay} />
      </View>
      <View style={styles.barDivider} />
      <View style={[styles.barSide, { flexDirection: 'row-reverse' }]}>
        <Text style={[styles.barVal, { color: COLORS.scoreOpponent }]}>{aiVal}</Text>
        <AnimatedBar value={aiVal} color={COLORS.scoreOpponent} delay={delay + 100} />
      </View>
    </View>
  </View>
);

/* ─── Main Results Screen ─────────────────────────────────────────────── */
export default function ResultsScreen({ navigation, route }) {
  const { debate, scores, winner, feedback, topic } = route.params || {};

  const won       = winner === 'user';
  const resultCfg = getResultConfig(winner);
  const userGrade = scoreToGrade(scores?.user?.total ?? 0);
  const toast          = useToast();
  const { announceBadges } = useBadgeUnlock();

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    // Finalize stats on mount — then show badge unlocks
    if (debate?.debateId) {
      api.post(`/scores/finalize/${debate.debateId}`)
        .then(res => {
          if (res.data.newBadges?.length) {
            announceBadges(res.data.newBadges);
          }
        })
        .catch(() => {});
    }

    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `I just debated on DebateAI!\n\nTopic: "${topic?.title}"\nResult: ${resultCfg.label} · Score ${scores?.user?.total ?? 0}\n\nDownload DebateAI to challenge me!`,
        title:   'DebateAI Result',
      });
    } catch (_) {}
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Result banner ── */}
        <Animated.View
          style={[
            styles.banner,
            winner === 'user'     ? styles.bannerWin  :
            winner === 'draw'     ? styles.bannerDraw :
                                    styles.bannerLoss,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Text style={styles.bannerIcon}>{resultCfg.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>
              {winner === 'user' ? 'You Won!' : winner === 'draw' ? "It's a Draw!" : 'AI Won This Round'}
            </Text>
            <Text style={styles.bannerSub}>
              {winner === 'user'
                ? 'Excellent argumentation — keep it up!'
                : winner === 'draw'
                ? 'Very close debate — well contested!'
                : 'Good effort — review the feedback below'}
            </Text>
          </View>
          <View style={[styles.gradeBadge, { backgroundColor: userGrade.color + '33', borderColor: userGrade.color + '66' }]}>
            <Text style={[styles.gradeText, { color: userGrade.color }]}>{userGrade.grade}</Text>
          </View>
        </Animated.View>

        {/* ── Final scores ── */}
        <View style={styles.scoreBoard}>
          <View style={styles.scoreSide}>
            <Text style={styles.scorePlayerLabel}>You</Text>
            <Text style={[styles.scoreBig, { color: COLORS.scoreUser }]}>{scores?.user?.total ?? 0}</Text>
            <Text style={styles.scoreSubLabel}>pts</Text>
          </View>
          <View style={styles.scoreCenter}>
            <Text style={styles.vsText}>VS</Text>
            {debate?.duration ? (
              <Text style={styles.durationText}>{formatDuration(debate.duration)}</Text>
            ) : null}
          </View>
          <View style={styles.scoreSide}>
            <Text style={styles.scorePlayerLabel}>AI</Text>
            <Text style={[styles.scoreBig, { color: COLORS.scoreOpponent }]}>{scores?.opponent?.total ?? 0}</Text>
            <Text style={styles.scoreSubLabel}>pts</Text>
          </View>
        </View>

        {/* ── Radar chart ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Radar</Text>
          <ScoreRadar userScores={scores?.user} aiScores={scores?.opponent} />
        </View>

        {/* ── Metric breakdown ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Score Breakdown</Text>
          <View style={styles.metricLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.scoreUser }]} />
              <Text style={styles.legendText}>You</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.scoreOpponent }]} />
              <Text style={styles.legendText}>AI</Text>
            </View>
          </View>
          {[
            ['🧠  Logic',      scores?.user?.logic,      scores?.opponent?.logic,      0],
            ['🎯  Relevance',  scores?.user?.relevance,   scores?.opponent?.relevance,  100],
            ['🗣  Clarity',    scores?.user?.clarity,     scores?.opponent?.clarity,    200],
            ['💪  Confidence', scores?.user?.confidence,  scores?.opponent?.confidence, 300],
          ].map(([lbl, u, a, delay]) => (
            <MetricRow key={lbl} label={lbl} userVal={u ?? 0} aiVal={a ?? 0} delay={delay} />
          ))}
        </View>

        {/* ── AI Judge Feedback ── */}
        {feedback && (
          <>
            {feedback.summary ? (
              <View style={styles.summaryBox}>
                <Text style={styles.summaryLabel}>⚖️ Judge's Verdict</Text>
                <Text style={styles.summaryText}>{feedback.summary}</Text>
              </View>
            ) : null}

            <View style={[styles.feedbackCard, { borderLeftColor: COLORS.primary }]}>
              <Text style={[styles.feedbackTitle, { color: COLORS.primary }]}>✅ Strengths</Text>
              {feedback.strengths?.map((s, i) => (
                <Text key={i} style={styles.feedbackItem}>• {s}</Text>
              ))}
            </View>

            <View style={[styles.feedbackCard, { borderLeftColor: COLORS.amber }]}>
              <Text style={[styles.feedbackTitle, { color: COLORS.amber }]}>⚠️ Needs Work</Text>
              {feedback.weaknesses?.map((w, i) => (
                <Text key={i} style={styles.feedbackItem}>• {w}</Text>
              ))}
            </View>

            <View style={[styles.feedbackCard, { borderLeftColor: COLORS.accent }]}>
              <Text style={[styles.feedbackTitle, { color: COLORS.accent }]}>💡 How to Improve</Text>
              {feedback.improvements?.map((tip, i) => (
                <Text key={i} style={styles.feedbackItem}>• {tip}</Text>
              ))}
            </View>
          </>
        )}

        {/* ── Actions ── */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.btnPrimary} onPress={() => navigation.navigate('Mode', { topic })} activeOpacity={0.85}>
            <Text style={styles.btnPrimaryText}>⚡ Debate Again</Text>
          </TouchableOpacity>

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.btnSecondary} onPress={handleShare} activeOpacity={0.85}>
              <Text style={styles.btnSecondaryText}>📤 Share</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnSecondary} onPress={() => navigation.navigate('Main')} activeOpacity={0.85}>
              <Text style={styles.btnSecondaryText}>🏠 Home</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: COLORS.bg },
  container:      { padding: SPACING.xl, paddingBottom: 50 },

  banner:         { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.lg, borderWidth: 1 },
  bannerWin:      { backgroundColor: COLORS.primaryBg, borderColor: COLORS.primary + '66' },
  bannerDraw:     { backgroundColor: COLORS.amberBg,   borderColor: COLORS.amber + '66' },
  bannerLoss:     { backgroundColor: COLORS.bgCard,    borderColor: COLORS.border },
  bannerIcon:     { fontSize: 38 },
  bannerTitle:    { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 3 },
  bannerSub:      { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
  gradeBadge:     { width: 48, height: 48, borderRadius: 24, borderWidth: 2, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  gradeText:      { fontSize: 16, fontWeight: '800' },

  scoreBoard:     { flexDirection: 'row', backgroundColor: COLORS.bgCard, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.xl, alignItems: 'center', marginBottom: SPACING.lg },
  scoreSide:      { flex: 1, alignItems: 'center' },
  scorePlayerLabel:{ fontSize: 11, fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  scoreBig:       { fontSize: 44, fontWeight: '800', lineHeight: 50 },
  scoreSubLabel:  { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  scoreCenter:    { paddingHorizontal: 20, alignItems: 'center', gap: 6 },
  vsText:         { fontSize: 13, fontWeight: '700', color: COLORS.textMuted },
  durationText:   { fontSize: 11, color: COLORS.textMuted },

  section:        { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  sectionTitle:   { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14 },
  metricLegend:   { flexDirection: 'row', gap: 16, marginBottom: 14 },
  legendItem:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot:      { width: 8, height: 8, borderRadius: 4 },
  legendText:     { fontSize: 12, color: COLORS.textSecondary },

  metricRow:      { marginBottom: 14 },
  metricLabel:    { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 7 },
  metricBars:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barSide:        { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  barDivider:     { width: 1, height: 20, backgroundColor: COLORS.border },
  barVal:         { fontSize: 12, fontWeight: '700', width: 26, textAlign: 'center' },

  summaryBox:     { backgroundColor: COLORS.bgSurface, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.md, borderLeftWidth: 4, borderLeftColor: COLORS.primary },
  summaryLabel:   { fontSize: 11, fontWeight: '700', color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 7 },
  summaryText:    { fontSize: 13, color: COLORS.textSecondary, lineHeight: 21 },

  feedbackCard:   { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border, borderLeftWidth: 4 },
  feedbackTitle:  { fontSize: 13, fontWeight: '700', marginBottom: 10 },
  feedbackItem:   { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20, marginBottom: 5 },

  actions:        { gap: 10, marginTop: 8 },
  btnPrimary:     { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, padding: 16, alignItems: 'center' },
  btnPrimaryText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  actionsRow:     { flexDirection: 'row', gap: 10 },
  btnSecondary:   { flex: 1, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  btnSecondaryText:{ fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
});
