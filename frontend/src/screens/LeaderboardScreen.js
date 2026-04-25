import React from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth }        from '../context/AuthContext';
import useLeaderboard     from '../hooks/useLeaderboard';
import { LeaderboardRowSkeleton } from '../components/SkeletonLoader';
import { COLORS, RADIUS, SPACING } from '../utils/theme';

const MEDALS = ['🥇', '🥈', '🥉'];

const RankRow = React.memo(({ item, index, isMe }) => (
  <View style={[styles.row, isMe && styles.rowMe]}>
    <Text style={styles.rank}>
      {index < 3 ? MEDALS[index] : `#${index + 1}`}
    </Text>
    <View style={[styles.avatar, { backgroundColor: isMe ? COLORS.primaryBg : COLORS.bgSurface, borderColor: isMe ? COLORS.primary : COLORS.border }]}>
      <Text style={[styles.avatarText, { color: isMe ? COLORS.primary : COLORS.textSecondary }]}>
        {item.username?.[0]?.toUpperCase()}
      </Text>
    </View>
    <View style={{ flex: 1 }}>
      <View style={styles.nameRow}>
        <Text style={[styles.name, isMe && { color: COLORS.primary }]}>{item.username}</Text>
        {isMe && <View style={styles.youBadge}><Text style={styles.youBadgeText}>You</Text></View>}
      </View>
      <Text style={styles.meta}>
        Lv {item.level} · {item.stats?.totalDebates || 0} debates · Avg {item.stats?.avgScore || 0}
      </Text>
    </View>
    <View style={styles.winsCol}>
      <Text style={styles.winsNum}>{item.stats?.wins || 0}</Text>
      <Text style={styles.winsLbl}>Wins</Text>
    </View>
  </View>
));

export default function LeaderboardScreen() {
  const { user }  = useAuth();
  const { leaders, loading, refreshing, error, myRank, refresh } =
    useLeaderboard({ currentUsername: user?.username });

  return (
    <SafeAreaView style={styles.safe}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🏆 Leaderboard</Text>
        <Text style={styles.subtitle}>Top debaters by total wins</Text>
      </View>

      {/* Your rank banner */}
      {myRank && (
        <View style={styles.myRankBanner}>
          <Text style={styles.myRankText}>Your rank: #{myRank}</Text>
          <Text style={styles.myRankSub}>{user?.stats?.wins || 0} wins · {user?.stats?.avgScore || 0} avg score</Text>
        </View>
      )}

      {/* Error */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>Could not load leaderboard · {error}</Text>
        </View>
      )}

      {/* List */}
      {loading ? (
        <View style={styles.list}>
          {[0,1,2,3,4,5].map(i => <LeaderboardRowSkeleton key={i} />)}
        </View>
      ) : (
        <FlatList
          data={leaders}
          keyExtractor={u => u._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={COLORS.primary}
            />
          }
          renderItem={({ item, index }) => (
            <RankRow
              item={item}
              index={index}
              isMe={item.username === user?.username}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🏆</Text>
              <Text style={styles.emptyTitle}>No debaters yet</Text>
              <Text style={styles.emptySub}>Complete 3+ debates to appear here</Text>
            </View>
          }
          ListFooterComponent={
            leaders.length >= 3 ? (
              <Text style={styles.footer}>Showing top {leaders.length} debaters with 3+ debates</Text>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: COLORS.bg },
  header:        { paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg, paddingBottom: SPACING.sm },
  title:         { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary },
  subtitle:      { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  myRankBanner:  { marginHorizontal: SPACING.xl, marginBottom: SPACING.md, backgroundColor: COLORS.primaryBg, borderRadius: RADIUS.lg, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: COLORS.primary + '55' },
  myRankText:    { fontSize: 15, fontWeight: '700', color: COLORS.primary },
  myRankSub:     { fontSize: 12, color: COLORS.textSecondary },
  errorBanner:   { marginHorizontal: SPACING.xl, marginBottom: SPACING.sm, backgroundColor: COLORS.dangerBg, borderRadius: RADIUS.md, padding: 10, borderWidth: 1, borderColor: COLORS.danger + '44' },
  errorText:     { fontSize: 12, color: COLORS.danger },
  list:          { paddingHorizontal: SPACING.xl, paddingBottom: 100, gap: 8 },
  row:           { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  rowMe:         { borderColor: COLORS.primary, backgroundColor: COLORS.primaryBg },
  rank:          { fontSize: 18, width: 32, textAlign: 'center' },
  avatar:        { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  avatarText:    { fontSize: 16, fontWeight: '700' },
  nameRow:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name:          { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  youBadge:      { backgroundColor: COLORS.primary, borderRadius: RADIUS.full, paddingHorizontal: 7, paddingVertical: 2 },
  youBadgeText:  { fontSize: 9, fontWeight: '800', color: '#fff' },
  meta:          { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  winsCol:       { alignItems: 'center', minWidth: 36 },
  winsNum:       { fontSize: 18, fontWeight: '700', color: COLORS.primary },
  winsLbl:       { fontSize: 10, color: COLORS.textMuted },
  empty:         { alignItems: 'center', paddingTop: 60 },
  emptyIcon:     { fontSize: 40, marginBottom: 12 },
  emptyTitle:    { fontSize: 16, fontWeight: '600', color: COLORS.textSecondary },
  emptySub:      { fontSize: 13, color: COLORS.textMuted, marginTop: 6 },
  footer:        { fontSize: 11, color: COLORS.textMuted, textAlign: 'center', paddingTop: 16, paddingBottom: 8 },
});
