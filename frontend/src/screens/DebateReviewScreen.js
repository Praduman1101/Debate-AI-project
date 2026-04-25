import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator, Share,
} from 'react-native';
import { SafeAreaView }  from 'react-native-safe-area-context';
import api               from '../services/api';
import ArgumentBubble    from '../components/ArgumentBubble';
import ScoreRadar        from '../components/ScoreRadar';
import { useToast }      from '../context/ToastContext';
import { COLORS, RADIUS, SPACING } from '../utils/theme';
import { getResultConfig, formatDuration, formatDate, scoreToGrade } from '../utils/helpers';

const RoundDivider = ({ round }) => (
  <View style={styles.roundDivider}>
    <View style={styles.dividerLine} />
    <Text style={styles.dividerText}>Round {round}</Text>
    <View style={styles.dividerLine} />
  </View>
);

const ScoreChip = ({ label, value, color }) => (
  <View style={[styles.scoreChip, { backgroundColor: color + '1a', borderColor: color + '44' }]}>
    <Text style={[styles.scoreChipVal, { color }]}>{value}</Text>
    <Text style={styles.scoreChipLbl}>{label}</Text>
  </View>
);

export default function DebateReviewScreen({ navigation, route }) {
  const { debateId } = route.params;
  const toast = useToast();

  const [debate,  setDebate]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState('arguments'); // 'arguments' | 'analysis'

  useEffect(() => {
    api.get(`/debates/${debateId}`)
      .then(res => setDebate(res.data.debate))
      .catch(() => {
        toast.error('Could not load debate');
        navigation.goBack();
      })
      .finally(() => setLoading(false));
  }, [debateId]);

  const handleShare = async () => {
    if (!debate) return;
    const result = getResultConfig(debate.winner);
    try {
      await Share.share({
        message: `DebateAI Recap\n\nTopic: "${debate.topic?.title}"\nResult: ${result.label}\nYour score: ${debate.scores?.user?.total ?? 0}\n\nChallenge me on DebateAI!`,
      });
    } catch {}
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={COLORS.primary} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  if (!debate) return null;

  const result    = getResultConfig(debate.winner);
  const userGrade = scoreToGrade(debate.scores?.user?.total ?? 0);

  // Group arguments by round
  const byRound = {};
  (debate.arguments || []).forEach(a => {
    if (!byRound[a.round]) byRound[a.round] = [];
    byRound[a.round].push(a);
  });

  const flatData = [];
  Object.keys(byRound).sort((a, b) => +a - +b).forEach(r => {
    flatData.push({ type: 'divider', round: +r, key: `div_${r}` });
    byRound[r].forEach((a, i) => flatData.push({ type: 'argument', ...a, key: `arg_${r}_${i}` }));
  });

  return (
    <SafeAreaView style={styles.safe}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Debate Review</Text>
        <TouchableOpacity onPress={handleShare}>
          <Text style={styles.shareBtn}>📤</Text>
        </TouchableOpacity>
      </View>

      {/* Result banner */}
      <View style={[styles.resultBanner, {
        backgroundColor: result.color + '1a',
        borderColor:     result.color + '44',
      }]}>
        <Text style={styles.resultIcon}>{result.icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.resultTitle}>
            {debate.winner === 'user' ? 'You Won' : debate.winner === 'draw' ? 'Draw' : 'AI Won'}
            <Text style={[styles.gradeText, { color: userGrade.color }]}>  {userGrade.grade}</Text>
          </Text>
          <Text style={styles.resultMeta} numberOfLines={1}>{debate.topic?.title}</Text>
          <Text style={styles.resultDate}>
            {formatDate(debate.completedAt)} · {formatDuration(debate.duration || 0)}
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {['arguments', 'analysis'].map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'arguments' ? '💬 Arguments' : '📊 Analysis'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {tab === 'arguments' ? (
        <FlatList
          data={flatData}
          keyExtractor={item => item.key}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            if (item.type === 'divider') return <RoundDivider round={item.round} />;
            return <ArgumentBubble argument={item} showFullScores />;
          }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No arguments recorded.</Text>
          }
        />
      ) : (
        <FlatList
          data={[{ key: 'analysis' }]}
          keyExtractor={i => i.key}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={() => (
            <View style={styles.analysisWrap}>
              {/* Score chips */}
              <Text style={styles.analysisSectionTitle}>Final Scores</Text>
              <View style={styles.scoreChips}>
                <ScoreChip label="Your Total"  value={debate.scores?.user?.total ?? 0}     color={COLORS.scoreUser} />
                <ScoreChip label="AI Total"    value={debate.scores?.opponent?.total ?? 0} color={COLORS.scoreOpponent} />
              </View>

              {/* Radar */}
              <Text style={[styles.analysisSectionTitle, { marginTop: SPACING.lg }]}>Performance Radar</Text>
              <View style={styles.radarWrap}>
                <ScoreRadar userScores={debate.scores?.user} aiScores={debate.scores?.opponent} />
              </View>

              {/* Dimension breakdown */}
              <Text style={[styles.analysisSectionTitle, { marginTop: SPACING.lg }]}>Dimension Scores</Text>
              {['logic','relevance','clarity','confidence'].map(dim => {
                const uVal = debate.scores?.user?.[dim]     ?? 0;
                const aVal = debate.scores?.opponent?.[dim] ?? 0;
                return (
                  <View key={dim} style={styles.dimRow}>
                    <Text style={styles.dimLabel}>{dim.charAt(0).toUpperCase() + dim.slice(1)}</Text>
                    <View style={styles.dimBars}>
                      <View style={styles.dimBarSide}>
                        <Text style={[styles.dimVal, { color: COLORS.scoreUser }]}>{uVal}</Text>
                        <View style={styles.dimTrack}>
                          <View style={[styles.dimFill, { width: `${uVal}%`, backgroundColor: COLORS.scoreUser }]} />
                        </View>
                      </View>
                      <View style={styles.dimBarSide}>
                        <View style={styles.dimTrack}>
                          <View style={[styles.dimFill, { width: `${aVal}%`, backgroundColor: COLORS.scoreOpponent }]} />
                        </View>
                        <Text style={[styles.dimVal, { color: COLORS.scoreOpponent }]}>{aVal}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}

              {/* Feedback */}
              {debate.feedback && (
                <>
                  <Text style={[styles.analysisSectionTitle, { marginTop: SPACING.lg }]}>AI Coaching</Text>
                  {[
                    ['✅', 'Strengths',   debate.feedback.strengths,    COLORS.primary],
                    ['⚠️', 'Needs Work',  debate.feedback.weaknesses,   COLORS.amber],
                    ['💡', 'Tips',        debate.feedback.improvements, COLORS.accent],
                  ].map(([icon, title, items, color]) =>
                    items?.length ? (
                      <View key={title} style={[styles.feedCard, { borderLeftColor: color }]}>
                        <Text style={[styles.feedTitle, { color }]}>{icon} {title}</Text>
                        {items.map((item, i) => (
                          <Text key={i} style={styles.feedItem}>• {item}</Text>
                        ))}
                      </View>
                    ) : null
                  )}
                  {debate.feedback.summary ? (
                    <View style={styles.summaryBox}>
                      <Text style={styles.summaryLabel}>⚖️ Judge's Summary</Text>
                      <Text style={styles.summaryText}>{debate.feedback.summary}</Text>
                    </View>
                  ) : null}
                </>
              )}
            </View>
          )}
        />
      )}

      {/* Bottom action */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.rematchBtn}
          onPress={() => navigation.navigate('Mode', { topic: debate.topic })}
        >
          <Text style={styles.rematchText}>⚡ Rematch</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: COLORS.bg },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.lg },
  back:           { fontSize: 14, color: COLORS.textSecondary },
  headerTitle:    { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
  shareBtn:       { fontSize: 20 },

  resultBanner:   { flexDirection: 'row', alignItems: 'center', gap: 14, marginHorizontal: SPACING.lg, marginBottom: SPACING.sm, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1 },
  resultIcon:     { fontSize: 28 },
  resultTitle:    { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  gradeText:      { fontSize: 14, fontWeight: '800' },
  resultMeta:     { fontSize: 12, color: COLORS.textSecondary },
  resultDate:     { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },

  tabs:           { flexDirection: 'row', marginHorizontal: SPACING.lg, marginBottom: SPACING.sm, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: 4, borderWidth: 1, borderColor: COLORS.border },
  tab:            { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: RADIUS.md },
  tabActive:      { backgroundColor: COLORS.primary },
  tabText:        { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
  tabTextActive:  { color: '#fff' },

  list:           { padding: SPACING.lg, paddingBottom: 100, gap: 10 },
  emptyText:      { textAlign: 'center', color: COLORS.textMuted, marginTop: 40 },

  roundDivider:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 4 },
  dividerLine:    { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText:    { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },

  analysisWrap:   { gap: 0 },
  analysisSectionTitle: { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },

  scoreChips:     { flexDirection: 'row', gap: 12 },
  scoreChip:      { flex: 1, borderRadius: RADIUS.lg, borderWidth: 1, padding: SPACING.md, alignItems: 'center' },
  scoreChipVal:   { fontSize: 32, fontWeight: '800' },
  scoreChipLbl:   { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },

  radarWrap:      { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },

  dimRow:         { marginBottom: 12 },
  dimLabel:       { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 6 },
  dimBars:        { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dimBarSide:     { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  dimTrack:       { flex: 1, height: 5, backgroundColor: COLORS.bgSurface, borderRadius: 3, overflow: 'hidden' },
  dimFill:        { height: '100%', borderRadius: 3 },
  dimVal:         { fontSize: 12, fontWeight: '700', width: 26, textAlign: 'center' },

  feedCard:       { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: 10, borderLeftWidth: 3, borderWidth: 1, borderColor: COLORS.border },
  feedTitle:      { fontSize: 12, fontWeight: '700', marginBottom: 8 },
  feedItem:       { fontSize: 12, color: COLORS.textSecondary, lineHeight: 19, marginBottom: 3 },

  summaryBox:     { backgroundColor: COLORS.bgSurface, borderRadius: RADIUS.md, padding: SPACING.md, borderLeftWidth: 3, borderLeftColor: COLORS.primary },
  summaryLabel:   { fontSize: 11, fontWeight: '700', color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  summaryText:    { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },

  bottomBar:      { padding: SPACING.lg, borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: COLORS.bgCard },
  rematchBtn:     { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, padding: 14, alignItems: 'center' },
  rematchText:    { fontSize: 15, fontWeight: '700', color: '#fff' },
});
