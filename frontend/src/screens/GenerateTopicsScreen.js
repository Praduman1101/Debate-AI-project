import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api          from '../services/api';
import { useToast } from '../context/ToastContext';
import { COLORS, RADIUS, SPACING } from '../utils/theme';

const CATEGORIES = [
  { id: 'technology', label: 'Technology',  emoji: '🤖' },
  { id: 'climate',    label: 'Climate',      emoji: '🌍' },
  { id: 'politics',   label: 'Politics',     emoji: '⚖️' },
  { id: 'education',  label: 'Education',    emoji: '🏫' },
  { id: 'economy',    label: 'Economy',      emoji: '💼' },
  { id: 'science',    label: 'Science',      emoji: '🧬' },
  { id: 'health',     label: 'Health',       emoji: '❤️' },
  { id: 'society',    label: 'Society',      emoji: '🏘' },
];

const COUNTS = [3, 5, 8];

const DIFF_STYLE = {
  beginner:     { bg: COLORS.primaryBg, text: COLORS.primary },
  intermediate: { bg: COLORS.accentBg,  text: COLORS.accent },
  expert:       { bg: COLORS.amberBg,   text: COLORS.amber },
};

export default function GenerateTopicsScreen({ navigation }) {
  const toast = useToast();

  const [category,  setCategory]  = useState('technology');
  const [count,     setCount]     = useState(5);
  const [loading,   setLoading]   = useState(false);
  const [generated, setGenerated] = useState([]);
  const [selected,  setSelected]  = useState(new Set());

  const handleGenerate = useCallback(async () => {
    setLoading(true);
    setGenerated([]);
    setSelected(new Set());

    try {
      const res = await api.get('/topics/generate', { params: { category, count } });
      const topics = res.data.topics || [];
      if (topics.length === 0) {
        toast.warning('No topics generated. Try again.');
      } else {
        setGenerated(topics);
        toast.success(`${topics.length} topics generated!`);
      }
    } catch (e) {
      toast.error(e.response?.data?.error || 'Generation failed. Check your API key.');
    } finally {
      setLoading(false);
    }
  }, [category, count, toast]);

  const toggleSelect = (idx) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const handleDebateNow = (topic) => {
    navigation.navigate('Mode', {
      topic: {
        _id:        `generated_${Date.now()}`,
        title:      topic.title,
        category,
        difficulty: topic.difficulty || 'intermediate',
        totalDebates: 0,
      },
    });
  };

  return (
    <SafeAreaView style={S.safe}>
      <ScrollView contentContainerStyle={S.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={S.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={S.back}>← Back</Text>
          </TouchableOpacity>
          <Text style={S.title}>AI Topic Generator</Text>
          <View style={{ width: 50 }} />
        </View>

        <Text style={S.subtitle}>
          Let Claude generate fresh debate topics for any category in seconds.
        </Text>

        {/* Category */}
        <Text style={S.sectionLabel}>Category</Text>
        <View style={S.catGrid}>
          {CATEGORIES.map(c => (
            <TouchableOpacity
              key={c.id}
              style={[S.catBtn, category === c.id && S.catBtnOn]}
              onPress={() => setCategory(c.id)}
            >
              <Text style={S.catEmoji}>{c.emoji}</Text>
              <Text style={[S.catLabel, category === c.id && { color: COLORS.primary }]}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Count */}
        <Text style={S.sectionLabel}>How Many?</Text>
        <View style={S.countRow}>
          {COUNTS.map(n => (
            <TouchableOpacity
              key={n}
              style={[S.countBtn, count === n && S.countBtnOn]}
              onPress={() => setCount(n)}
            >
              <Text style={[S.countNum, count === n && { color: COLORS.primary }]}>{n}</Text>
              <Text style={[S.countLbl, count === n && { color: COLORS.primary }]}>topics</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Generate button */}
        <TouchableOpacity
          style={[S.genBtn, loading && S.genBtnBusy]}
          onPress={handleGenerate}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={S.genBtnText}>✨ Generate Topics</Text>
          }
        </TouchableOpacity>

        {/* Generated topics */}
        {generated.length > 0 && (
          <View style={S.resultsWrap}>
            <Text style={S.resultsLabel}>{generated.length} Topics Generated</Text>

            {generated.map((t, idx) => {
              const diff  = DIFF_STYLE[t.difficulty] || DIFF_STYLE.intermediate;
              const isSel = selected.has(idx);
              return (
                <View key={idx} style={[S.topicCard, isSel && S.topicCardSel]}>
                  <TouchableOpacity style={S.topicMain} onPress={() => toggleSelect(idx)} activeOpacity={0.8}>
                    <View style={[S.diffBadge, { backgroundColor: diff.bg }]}>
                      <Text style={[S.diffText, { color: diff.text }]}>{t.difficulty || 'intermediate'}</Text>
                    </View>
                    <Text style={S.topicTitle}>{t.title}</Text>
                    {t.description && <Text style={S.topicDesc} numberOfLines={2}>{t.description}</Text>}
                  </TouchableOpacity>

                  <View style={S.topicActions}>
                    <TouchableOpacity
                      style={S.selectBtn}
                      onPress={() => toggleSelect(idx)}
                    >
                      <Text style={[S.selectBtnText, isSel && { color: COLORS.primary }]}>
                        {isSel ? '✓ Selected' : 'Select'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={S.debateNowBtn} onPress={() => handleDebateNow(t)}>
                      <Text style={S.debateNowText}>⚡ Debate Now</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: COLORS.bg },
  container:   { padding: SPACING.xl, paddingBottom: 60 },

  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.md },
  back:        { fontSize: 14, color: COLORS.textSecondary },
  title:       { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  subtitle:    { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20, marginBottom: SPACING.xl },

  sectionLabel:{ fontSize: 11, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },

  catGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: SPACING.xl },
  catBtn:      { width: '22%', backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  catBtnOn:    { borderColor: COLORS.primary, backgroundColor: COLORS.primaryBg },
  catEmoji:    { fontSize: 20, marginBottom: 4 },
  catLabel:    { fontSize: 10, fontWeight: '600', color: COLORS.textSecondary, textAlign: 'center' },

  countRow:    { flexDirection: 'row', gap: 12, marginBottom: SPACING.xl },
  countBtn:    { flex: 1, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  countBtnOn:  { borderColor: COLORS.primary, backgroundColor: COLORS.primaryBg },
  countNum:    { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary },
  countLbl:    { fontSize: 10, color: COLORS.textMuted, marginTop: 2 },

  genBtn:      { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, padding: 16, alignItems: 'center', marginBottom: SPACING.xl },
  genBtnBusy:  { opacity: 0.7 },
  genBtnText:  { fontSize: 16, fontWeight: '700', color: '#fff' },

  resultsWrap: { gap: 12 },
  resultsLabel:{ fontSize: 11, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 },

  topicCard:   { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  topicCardSel:{ borderColor: COLORS.primary, borderWidth: 2 },
  topicMain:   { padding: SPACING.lg },
  diffBadge:   { alignSelf: 'flex-start', borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 8 },
  diffText:    { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  topicTitle:  { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, lineHeight: 22, marginBottom: 5 },
  topicDesc:   { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },

  topicActions:{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: COLORS.border },
  selectBtn:   { flex: 1, padding: 12, alignItems: 'center', borderRightWidth: 1, borderRightColor: COLORS.border },
  selectBtnText:{ fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  debateNowBtn:{ flex: 1, padding: 12, alignItems: 'center', backgroundColor: COLORS.primaryBg },
  debateNowText:{ fontSize: 13, fontWeight: '700', color: COLORS.primary },
});
