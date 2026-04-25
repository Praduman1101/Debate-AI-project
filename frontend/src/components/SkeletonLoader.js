import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { COLORS, RADIUS } from '../utils/theme';

const SkeletonBox = ({ width, height, borderRadius = RADIUS.md, style }) => {
  const anim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1,   duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        {
          width, height, borderRadius,
          backgroundColor: COLORS.bgSurface,
          opacity: anim,
        },
        style,
      ]}
    />
  );
};

/** Skeleton for a topic card */
export const TopicCardSkeleton = () => (
  <View style={styles.card}>
    <View style={styles.row}>
      <SkeletonBox width={70} height={18} />
      <SkeletonBox width={50} height={18} />
    </View>
    <SkeletonBox width="100%" height={16} style={{ marginTop: 10 }} />
    <SkeletonBox width="75%"  height={16} style={{ marginTop: 6 }} />
    <SkeletonBox width={90}   height={13} style={{ marginTop: 10 }} />
  </View>
);

/** Skeleton for a leaderboard row */
export const LeaderboardRowSkeleton = () => (
  <View style={styles.lbRow}>
    <SkeletonBox width={28} height={20} />
    <SkeletonBox width={40} height={40} borderRadius={20} />
    <View style={{ flex: 1, gap: 6 }}>
      <SkeletonBox width="55%" height={14} />
      <SkeletonBox width="40%" height={12} />
    </View>
    <SkeletonBox width={36} height={20} />
  </View>
);

/** Skeleton for a debate history row */
export const HistoryRowSkeleton = () => (
  <View style={styles.card}>
    <View style={styles.row}>
      <SkeletonBox width={60} height={16} />
      <SkeletonBox width={70} height={14} />
    </View>
    <SkeletonBox width="90%" height={15} style={{ marginTop: 8 }} />
    <SkeletonBox width="60%" height={15} style={{ marginTop: 5 }} />
    <View style={[styles.row, { marginTop: 10 }]}>
      <SkeletonBox width={80} height={13} />
      <SkeletonBox width={80} height={13} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  card:  { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  row:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lbRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: 12, borderWidth: 1, borderColor: COLORS.border },
});

export default SkeletonBox;
