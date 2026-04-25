import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';
import { COLORS, RADIUS, SPACING } from '../utils/theme';

const TAG_COLORS = {
  technology: { bg: COLORS.accentBg,  text: COLORS.accent },
  climate:    { bg: '#0d2e1a',         text: '#3fbf6e' },
  politics:   { bg: '#2a1a2e',         text: '#b06ee0' },
  education:  { bg: COLORS.primaryBg, text: COLORS.primary },
  economy:    { bg: COLORS.amberBg,   text: COLORS.amber },
  science:    { bg: '#0d2635',        text: '#5bc0eb' },
  health:     { bg: '#2a0d1e',        text: '#e06e8a' },
};

const StatBadge = ({ icon, value, label }) => (
  <View style={styles.statBadge}>
    <Text style={styles.statIcon}>{icon}</Text>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

export default function TopicScreen({ navigation, route }) {
  const { topicId } = route.params || {};
  const [topic,   setTopic]   = useState(null);
  const [loading, setLoading] = useState(!!topicId);
  const [related, setRelated] = useState([]);

  useEffect(() => {
    if (!topicId) return;
    const load = async () => {
      try {
        const topicRes = await api.get('/topics/' + topicId);
        setTopic(topicRes.data.topic);
        const relRes = await api.get('/topics', { params: { category: topicRes.data.topic.category, limit: 4 } });
        setRelated(relRes.data.topics.filter(t => t._id !== topicId).slice(0, 3));
      } catch {
        Alert.alert('Error', 'Could not load topic');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [topicId]);

  if (loading) return (
    <SafeAreaView style={styles.safe}>
      <ActivityIndicator color={COLORS.primary} style={{ marginTop: 60 }} />
    </SafeAreaView>
  );
  if (!topic) return null;

  const tagStyle = TAG_COLORS[topic.category] || { bg: COLORS.bgSurface, text: COLORS.textSecondary };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={[styles.catBadge, { backgroundColor: tagStyle.bg }]}>
          <Text style={[styles.catText, { color: tagStyle.text }]}>{topic.category?.toUpperCase()}</Text>
        </View>
        <Text style={styles.topicTitle}>{topic.title}</Text>
        {topic.description && <Text style={styles.description}>{topic.description}</Text>}
        <View style={styles.statsRow}>
          <StatBadge icon="💬" value={topic.totalDebates || 0} label="Debates" />
          <StatBadge icon="📈" value={topic.difficulty}        label="Difficulty" />
          {topic.trending && <StatBadge icon="🔥" value="Trending" label="Now" />}
        </View>
        {topic.tags?.length > 0 && (
          <View style={styles.tagsRow}>
            {topic.tags.map(tag => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>Ready to debate this topic?</Text>
          <Text style={styles.ctaSubtitle}>Choose your mode and stance to begin</Text>
          <TouchableOpacity style={styles.ctaBtn} onPress={() => navigation.navigate('Mode', { topic })}>
            <Text style={styles.ctaBtnText}>Start Debate ⚡</Text>
          </TouchableOpacity>
        </View>
        {related.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Related Topics</Text>
            {related.map(t => (
              <TouchableOpacity key={t._id} style={styles.relatedCard}
                onPress={() => navigation.navigate('Mode', { topic: t })}>
                <Text style={styles.relatedTitle} numberOfLines={2}>{t.title}</Text>
                <Text style={styles.relatedMeta}>{t.totalDebates} debates · {t.difficulty}</Text>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: COLORS.bg },
  container:   { padding: SPACING.xl, paddingBottom: 50 },
  back:        { marginBottom: SPACING.lg },
  backText:    { color: COLORS.textSecondary, fontSize: 14 },
  catBadge:    { alignSelf: 'flex-start', borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 5, marginBottom: SPACING.md },
  catText:     { fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  topicTitle:  { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary, lineHeight: 32, marginBottom: SPACING.md },
  description: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22, marginBottom: SPACING.lg },
  statsRow:    { flexDirection: 'row', gap: 10, marginBottom: SPACING.lg, flexWrap: 'wrap' },
  statBadge:   { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, padding: 12, alignItems: 'center', minWidth: 80, borderWidth: 1, borderColor: COLORS.border },
  statIcon:    { fontSize: 20, marginBottom: 4 },
  statValue:   { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, textTransform: 'capitalize' },
  statLabel:   { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  tagsRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: SPACING.lg },
  tag:         { backgroundColor: COLORS.bgSurface, borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: COLORS.border },
  tagText:     { fontSize: 12, color: COLORS.textSecondary },
  ctaSection:  { backgroundColor: COLORS.primaryBg, borderRadius: RADIUS.xl, padding: SPACING.xl, alignItems: 'center', marginBottom: SPACING.xl, borderWidth: 1, borderColor: COLORS.primary + '55' },
  ctaTitle:    { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  ctaSubtitle: { fontSize: 13, color: COLORS.textSecondary, marginBottom: SPACING.lg },
  ctaBtn:      { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingVertical: 13, paddingHorizontal: 32 },
  ctaBtnText:  { fontSize: 15, fontWeight: '700', color: '#fff' },
  sectionLabel:{ fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },
  relatedCard: { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  relatedTitle:{ fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, lineHeight: 20, marginBottom: 5 },
  relatedMeta: { fontSize: 12, color: COLORS.textMuted },
});
