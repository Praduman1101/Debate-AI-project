import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { COLORS, RADIUS } from '../utils/theme';

// Client-side lightweight NLP hints (no API call needed)
const analyzeLocally = (text) => {
  const hints = [];
  const lower = text.toLowerCase();
  const words = text.split(/\s+/).length;

  if (words < 10) hints.push({ tag: 'Too short',    color: COLORS.danger,  bg: COLORS.dangerBg });
  if (words > 80) hints.push({ tag: 'Very long',     color: COLORS.amber,   bg: COLORS.amberBg });

  if (/\b(however|but|although|despite|contrary)\b/.test(lower))
    hints.push({ tag: 'Counter-arg',  color: COLORS.accent,   bg: COLORS.accentBg });

  if (/\b(study|research|data|evidence|statistics|%|percent)\b/.test(lower))
    hints.push({ tag: 'Evidence',     color: COLORS.primary,  bg: COLORS.primaryBg });

  if (/\b(therefore|thus|hence|in conclusion)\b/.test(lower))
    hints.push({ tag: 'Conclusion',   color: COLORS.primary,  bg: COLORS.primaryBg });

  if (/\b(always|never|everyone|nobody|all|none)\b/.test(lower))
    hints.push({ tag: 'Absolute',     color: COLORS.amber,    bg: COLORS.amberBg });

  if (/[!]{2,}|[?]{2,}/.test(text))
    hints.push({ tag: 'Too emotional', color: COLORS.danger,  bg: COLORS.dangerBg });

  const positive = /\b(improve|benefit|help|solve|advance|support)\b/.test(lower);
  hints.push({ tag: positive ? 'Positive tone' : 'Neutral/negative', color: COLORS.textSecondary, bg: COLORS.bgSurface });

  return hints.slice(0, 5);
};

export default function NLPHints({ text }) {
  const [hints, setHints] = useState([]);

  useEffect(() => {
    const t = setTimeout(() => setHints(analyzeLocally(text)), 300);
    return () => clearTimeout(t);
  }, [text]);

  if (!hints.length) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.container}
    >
      {hints.map((h, i) => (
        <View key={i} style={[styles.tag, { backgroundColor: h.bg, borderColor: h.color + '44' }]}>
          <Text style={[styles.tagText, { color: h.color }]}>{h.tag}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll:     { flexGrow: 0 },
  container:  { paddingHorizontal: 16, paddingBottom: 6, gap: 6, flexDirection: 'row' },
  tag:        { borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  tagText:    { fontSize: 11, fontWeight: '600' },
});
