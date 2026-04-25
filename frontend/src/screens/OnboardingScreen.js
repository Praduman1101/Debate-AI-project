import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, Dimensions, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, RADIUS, SPACING } from '../utils/theme';
import { STORAGE_KEYS } from '../utils/constants';

const { width: W } = Dimensions.get('window');

const SLIDES = [
  {
    key:     'welcome',
    icon:    '⚡',
    title:   'Welcome to DebateAI',
    subtitle:'Sharpen your critical thinking by debating real topics against a powerful AI opponent.',
    accent:  COLORS.primary,
  },
  {
    key:     'how',
    icon:    '🎯',
    title:   'How It Works',
    subtitle:'Pick a topic, choose your stance, then argue turn-by-turn. The AI responds with real counter-arguments.',
    accent:  COLORS.accent,
    bullets: ['30 seconds per turn', 'Scored on logic, clarity & confidence', 'AI Judge gives final feedback'],
  },
  {
    key:     'modes',
    icon:    '⚔️',
    title:   'Three Ways to Debate',
    subtitle:'',
    accent:  COLORS.amber,
    bullets: ['🤖 AI vs You — debate Claude directly', '👥 User vs User — match with a real opponent', '📚 Practice — no pressure, just explore'],
  },
  {
    key:     'score',
    icon:    '📊',
    title:   'Level Up Your Skills',
    subtitle:'Every debate earns XP. Build your streak, unlock badges, and climb the leaderboard.',
    accent:  COLORS.primary,
    bullets: ['Win → +100 XP', 'AI coaching after every debate', 'Track logic, relevance, clarity over time'],
  },
  {
    key:     'ready',
    icon:    '🏆',
    title:   "You're Ready!",
    subtitle:'Your first debate is waiting. Pick a topic and start arguing.',
    accent:  COLORS.primary,
    cta:     "Let's Debate →",
  },
];

export default function OnboardingScreen({ navigation }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const flatRef  = useRef(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const goTo = (idx) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
    flatRef.current?.scrollToIndex({ index: idx, animated: true });
    setActiveIdx(idx);
  };

  const handleNext = () => {
    if (activeIdx < SLIDES.length - 1) {
      goTo(activeIdx + 1);
    } else {
      finish();
    }
  };

  const finish = async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_DONE, 'true');
    navigation.replace('Main');
  };

  const renderSlide = ({ item }) => (
    <Animated.View style={[styles.slide, { opacity: fadeAnim }]}>
      <View style={[styles.iconCircle, { backgroundColor: item.accent + '22', borderColor: item.accent + '55' }]}>
        <Text style={styles.slideIcon}>{item.icon}</Text>
      </View>
      <Text style={styles.slideTitle}>{item.title}</Text>
      {item.subtitle ? (
        <Text style={styles.slideSub}>{item.subtitle}</Text>
      ) : null}
      {item.bullets && (
        <View style={styles.bullets}>
          {item.bullets.map((b, i) => (
            <View key={i} style={[styles.bullet, { borderLeftColor: item.accent }]}>
              <Text style={styles.bulletText}>{b}</Text>
            </View>
          ))}
        </View>
      )}
    </Animated.View>
  );

  const current = SLIDES[activeIdx];

  return (
    <SafeAreaView style={styles.safe}>

      {/* Skip */}
      <TouchableOpacity style={styles.skipBtn} onPress={finish}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Slides */}
      <FlatList
        ref={flatRef}
        data={SLIDES}
        keyExtractor={s => s.key}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        renderItem={renderSlide}
        getItemLayout={(_, index) => ({ length: W, offset: W * index, index })}
        style={{ flex: 1 }}
      />

      {/* Dot indicators */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <TouchableOpacity key={i} onPress={() => goTo(i)}>
            <View style={[
              styles.dot,
              i === activeIdx && { backgroundColor: current.accent, width: 20 },
            ]} />
          </TouchableOpacity>
        ))}
      </View>

      {/* CTA button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextBtn, { backgroundColor: current.accent }]}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={styles.nextBtnText}>
            {current.cta || (activeIdx < SLIDES.length - 1 ? 'Next →' : "Let's Go →")}
          </Text>
        </TouchableOpacity>

        {activeIdx > 0 && (
          <TouchableOpacity style={styles.prevBtn} onPress={() => goTo(activeIdx - 1)}>
            <Text style={styles.prevBtnText}>← Back</Text>
          </TouchableOpacity>
        )}
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: COLORS.bg },
  skipBtn:    { position: 'absolute', top: 56, right: SPACING.xl, zIndex: 10 },
  skipText:   { fontSize: 14, color: COLORS.textMuted },

  slide:      { width: W, flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.xxl, paddingBottom: 60 },
  iconCircle: { width: 110, height: 110, borderRadius: 55, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  slideIcon:  { fontSize: 52 },
  slideTitle: { fontSize: 26, fontWeight: '800', color: COLORS.textPrimary, textAlign: 'center', lineHeight: 34, marginBottom: 14 },
  slideSub:   { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: 24 },
  bullets:    { gap: 10, width: '100%' },
  bullet:     { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, padding: SPACING.md, borderLeftWidth: 3 },
  bulletText: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },

  dots:       { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: SPACING.xl },
  dot:        { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.bgSurface },

  footer:     { paddingHorizontal: SPACING.xl, paddingBottom: SPACING.xl, gap: 10 },
  nextBtn:    { borderRadius: RADIUS.lg, padding: 16, alignItems: 'center' },
  nextBtnText:{ fontSize: 16, fontWeight: '800', color: '#fff' },
  prevBtn:    { alignItems: 'center', paddingVertical: 8 },
  prevBtnText:{ fontSize: 14, color: COLORS.textSecondary },
});
