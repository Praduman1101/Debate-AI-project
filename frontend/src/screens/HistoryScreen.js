import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, Animated,
} from 'react-native';
import { SafeAreaView }  from 'react-native-safe-area-context';
import useDebateHistory  from '../hooks/useDebateHistory';
import { useToast }      from '../context/ToastContext';
import { HistoryRowSkeleton } from '../components/SkeletonLoader';
import { COLORS, RADIUS, SPACING } from '../utils/theme';
import { getResultConfig, formatDuration, formatRelativeTime } from '../utils/helpers';

const STATUS_FILTERS = [
  { id: 'all',       label: 'All' },
  { id: 'completed', label: 'Completed' },
  { id: 'abandoned', label: 'Abandoned' },
];

/* ─── History Card ─────────────────────────────────────────────────────── */
const HistoryCard = React.memo(({ item, onPress, onDelete }) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const result    = getResultConfig(item.winner);

  const pressIn  = () => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(scaleAnim, { toValue: 1,    useNativeDriver: true }).start();

  const uTotal = item.scores?.user?.total     ?? 0;
  const aTotal = item.scores?.opponent?.total ?? 0;
  const total  = (uTotal + aTotal) || 1;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        onLongPress={() => onDelete(item._id)}
        activeOpacity={1}
        delayLongPress={500}
      >
        {/* Top row */}
        <View style={styles.cardTop}>
          <View style={[styles.resultTag, {
            backgroundColor: result.color + '1a',
            borderColor:     result.color + '55',
          }]}>
            <Text style={styles.resultIcon}>{result.icon}</Text>
            <Text style={[styles.resultLabel, { color: result.color }]}>{result.label}</Text>
          </View>
          <View style={styles.topRight}>
            <Text style={styles.timeAgo}>{formatRelativeTime(item.completedAt || item.createdAt)}</Text>
            <Text style={styles.tapHint}>Tap to review →</Text>
          </View>
        </View>

        {/* Topic */}
        <Text style={styles.topicText} numberOfLines={2}>{item.topic?.title}</Text>

        {/* Meta chips */}
        <View style={styles.chips}>
          {[
            ['📊', `${uTotal} pts`],
            ['⏱',  formatDuration(item.duration || 0)],
            ['🎯',  item.difficulty || 'medium'],
            ['🤖',  item.mode === 'user_vs_user' ? 'PvP' : 'AI'],
          ].map(([icon, val]) => (
            <View key={val} style={styles.chip}>
              <Text style={styles.chipIcon}>{icon}</Text>
              <Text style={styles.chipText}>{val}</Text>
            </View>
          ))}
        </View>

        {/* Score bar */}
        <View style={styles.scoreBar}>
          <View style={styles.scoreBarTrack}>
            <View style={[styles.scoreBarUser, { flex: uTotal / total }]} />
            <View style={[styles.scoreBarAI,   { flex: aTotal / total }]} />
          </View>
          <View style={styles.scoreBarLabels}>
            <Text style={[styles.scoreBarVal, { color: COLORS.scoreUser }]}>You {uTotal}</Text>
            <Text style={[styles.scoreBarVal, { color: COLORS.scoreOpponent }]}>AI {aTotal}</Text>
          </View>
        </View>

        <Text style={styles.longPressHint}>Hold to delete</Text>
      </TouchableOpacity>
    </Animated.View>
  );
});

/* ─── Main Screen ──────────────────────────────────────────────────────── */
export default function HistoryScreen({ navigation }) {
  const [filter, setFilter] = useState('all');
  const toast = useToast();

  const {
    debates, loading, refreshing, loadingMore,
    hasMore, totalCount,
    load, refresh, loadMore, deleteDebate,
  } = useDebateHistory({ statusFilter: filter });

  useEffect(() => { load(); }, [filter]);

  const handlePress = useCallback((item) => {
    if (item.status !== 'completed') return;
    navigation.navigate('DebateReview', { debateId: item._id });
  }, [navigation]);

  const handleDelete = useCallback(async (id) => {
    try {
      await deleteDebate(id);
      toast.success('Debate removed');
    } catch {
      toast.error('Could not delete debate');
    }
  }, [deleteDebate, toast]);

  const renderItem = useCallback(({ item }) => (
    <HistoryCard
      item={item}
      onPress={() => handlePress(item)}
      onDelete={handleDelete}
    />
  ), [handlePress, handleDelete]);

  return (
    <SafeAreaView style={styles.safe}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>History</Text>
          {totalCount > 0 && (
            <Text style={styles.subtitle}>{totalCount} debate{totalCount !== 1 ? 's' : ''} total</Text>
          )}
        </View>
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {STATUS_FILTERS.map(f => (
          <TouchableOpacity
            key={f.id}
            style={[styles.filterTab, filter === f.id && styles.filterTabOn]}
            onPress={() => setFilter(f.id)}
          >
            <Text style={[styles.filterText, filter === f.id && styles.filterTextOn]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.list}>
          {[0,1,2,3].map(i => <HistoryRowSkeleton key={i} />)}
        </View>
      ) : (
        <FlatList
          data={debates}
          keyExtractor={d => d._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={COLORS.primary}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore
              ? <ActivityIndicator color={COLORS.primary} style={{ paddingVertical: 20 }} />
              : !hasMore && debates.length > 0
              ? <Text style={styles.endNote}>All caught up ✓</Text>
              : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>No debates yet</Text>
              <Text style={styles.emptySub}>
                {filter !== 'all'
                  ? `No ${filter} debates found`
                  : 'Start a debate to build your history'}
              </Text>
              <TouchableOpacity
                style={styles.startBtn}
                onPress={() => navigation.navigate('Home')}
              >
                <Text style={styles.startBtnText}>⚡ Start Debating</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: COLORS.bg },
  header:       { paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg, paddingBottom: SPACING.sm },
  title:        { fontSize: 26, fontWeight: '800', color: COLORS.textPrimary },
  subtitle:     { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },

  filterRow:    { flexDirection: 'row', paddingHorizontal: SPACING.xl, gap: 8, marginBottom: SPACING.md },
  filterTab:    { paddingHorizontal: 16, paddingVertical: 8, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bgCard },
  filterTabOn:  { backgroundColor: COLORS.primaryBg, borderColor: COLORS.primary },
  filterText:   { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  filterTextOn: { color: COLORS.primary },

  list:         { paddingHorizontal: SPACING.xl, paddingBottom: 100, gap: 12 },

  card:         { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border },
  cardTop:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  resultTag:    { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  resultIcon:   { fontSize: 14 },
  resultLabel:  { fontSize: 12, fontWeight: '700' },
  topRight:     { alignItems: 'flex-end', gap: 2 },
  timeAgo:      { fontSize: 12, color: COLORS.textMuted },
  tapHint:      { fontSize: 10, color: COLORS.primary, fontWeight: '600' },

  topicText:    { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, lineHeight: 20, marginBottom: 10 },

  chips:        { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  chip:         { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.bgSurface, borderRadius: RADIUS.full, paddingHorizontal: 9, paddingVertical: 4, borderWidth: 1, borderColor: COLORS.border },
  chipIcon:     { fontSize: 11 },
  chipText:     { fontSize: 11, color: COLORS.textSecondary, fontWeight: '500' },

  scoreBar:         { gap: 5 },
  scoreBarTrack:    { height: 5, flexDirection: 'row', borderRadius: 3, overflow: 'hidden', gap: 2 },
  scoreBarUser:     { backgroundColor: COLORS.scoreUser,     borderRadius: 3, minWidth: 4 },
  scoreBarAI:       { backgroundColor: COLORS.scoreOpponent, borderRadius: 3, minWidth: 4 },
  scoreBarLabels:   { flexDirection: 'row', justifyContent: 'space-between' },
  scoreBarVal:      { fontSize: 11, fontWeight: '600' },
  longPressHint:    { fontSize: 10, color: COLORS.textMuted, textAlign: 'right', marginTop: 5, fontStyle: 'italic' },

  endNote:      { fontSize: 12, color: COLORS.textMuted, textAlign: 'center', paddingVertical: 20 },
  empty:        { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyIcon:    { fontSize: 44 },
  emptyTitle:   { fontSize: 17, fontWeight: '700', color: COLORS.textSecondary },
  emptySub:     { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', maxWidth: 260 },
  startBtn:     { marginTop: 16, backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingVertical: 12, paddingHorizontal: 28 },
  startBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
