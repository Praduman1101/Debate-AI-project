import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
} from 'react-native';
import api from '../services/api';
import { COLORS, RADIUS, SPACING } from '../utils/theme';

/**
 * DailyChallenge
 * Fetches today's featured topic and shows a "Daily Challenge" banner.
 * Tapping navigates to ModeScreen with the topic pre-loaded.
 */
const DailyChallenge = ({ navigation }) => {
  const [topic,   setTopic]   = useState(null);
  const [loading, setLoading] = useState(true);
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    api.get('/topics', { params: { featured: true, limit: 1 } })
      .then(res => setTopic(res.data.topics?.[0] || null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Subtle pulse on the badge
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,   duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  if (loading || !topic) return null;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('Mode', { topic })}
      activeOpacity={0.85}
    >
      {/* Badge */}
      <Animated.View style={[styles.badge, { transform: [{ scale: pulseAnim }] }]}>
        <Text style={styles.badgeText}>🔥 Daily</Text>
      </Animated.View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.label}>TODAY'S CHALLENGE</Text>
        <Text style={styles.title} numberOfLines={2}>{topic.title}</Text>
        <View style={styles.footer}>
          <Text style={styles.footerMeta}>{topic.category} · {topic.difficulty}</Text>
          <View style={styles.ctaWrap}>
            <Text style={styles.cta}>Debate Now ⚡</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card:       {
    marginHorizontal: SPACING.xl,
    marginBottom:     SPACING.md,
    backgroundColor:  COLORS.primaryBg,
    borderRadius:     RADIUS.xl,
    borderWidth:      1,
    borderColor:      COLORS.primary + '55',
    padding:          SPACING.lg,
    overflow:         'visible',
  },
  badge:      { position: 'absolute', top: -10, left: 16, backgroundColor: COLORS.primary, borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 4, zIndex: 1 },
  badgeText:  { fontSize: 11, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  content:    { marginTop: 6 },
  label:      { fontSize: 9, fontWeight: '800', color: COLORS.primary, letterSpacing: 1.2, marginBottom: 6 },
  title:      { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, lineHeight: 22, marginBottom: 10 },
  footer:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerMeta: { fontSize: 11, color: COLORS.textSecondary, textTransform: 'capitalize' },
  ctaWrap:    { backgroundColor: COLORS.primary, borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 5 },
  cta:        { fontSize: 12, fontWeight: '700', color: '#fff' },
});

export default DailyChallenge;
