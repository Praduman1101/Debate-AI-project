import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, TextInput, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth }      from '../context/AuthContext';
import useTopics        from '../hooks/useTopics';
import DailyChallenge   from '../components/DailyChallenge';
import { TopicCardSkeleton } from '../components/SkeletonLoader';
import { COLORS, RADIUS, SPACING } from '../utils/theme';

const CATEGORIES = [
  { id: 'All',        emoji: '🌐' }, { id: 'Technology', emoji: '🤖' },
  { id: 'Climate',    emoji: '🌍' }, { id: 'Politics',   emoji: '⚖️' },
  { id: 'Education',  emoji: '🏫' }, { id: 'Economy',    emoji: '💼' },
  { id: 'Science',    emoji: '🧬' }, { id: 'Health',     emoji: '❤️' },
];

const DIFF = {
  beginner:     { bg: COLORS.primaryBg, text: COLORS.primary },
  intermediate: { bg: COLORS.accentBg,  text: COLORS.accent },
  expert:       { bg: COLORS.amberBg,   text: COLORS.amber },
};
const CAT_COLORS = {
  technology: COLORS.accent, climate: '#3fbf6e', politics: '#b06ee0',
  education: COLORS.primary, economy: COLORS.amber, science: '#5bc0eb',
  health: '#e06e8a', society: '#b0b03f',
};

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [category, setCategory] = useState('All');
  const [search,   setSearch]   = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceRef = React.useRef(null);

  const { topics, loading, refreshing, refresh } = useTopics({
    category, search: debouncedSearch, limit: 30,
  });

  const handleSearchChange = useCallback((val) => {
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(val), 400);
  }, []);

  const renderTopic = useCallback(({ item }) => {
    const diff     = DIFF[item.difficulty] || DIFF.intermediate;
    const catColor = CAT_COLORS[item.category] || COLORS.textSecondary;
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('Mode', { topic: item })}
        onLongPress={() => navigation.navigate('Topics', { topicId: item._id })}
        activeOpacity={0.75}
      >
        <View style={styles.cardTop}>
          <View style={[styles.diffBadge, { backgroundColor: diff.bg }]}>
            <Text style={[styles.diffText, { color: diff.text }]}>{item.difficulty}</Text>
          </View>
          <View style={styles.flags}>
            {item.trending && <View style={styles.trendBadge}><Text style={styles.trendText}>🔥 Trending</Text></View>}
            {item.featured && <View style={styles.featBadge}><Text style={styles.featText}>⭐ Featured</Text></View>}
          </View>
        </View>
        <Text style={[styles.catLabel, { color: catColor }]}>{item.category?.toUpperCase()}</Text>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <View style={styles.cardFooter}>
          <Text style={styles.cardMeta}>💬 {item.totalDebates || 0} debates</Text>
          <Text style={styles.cardHint}>Hold to preview</Text>
        </View>
      </TouchableOpacity>
    );
  }, [navigation]);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Ready to argue? 👋</Text>
          <Text style={styles.username}>{user?.username || 'Debater'}</Text>
        </View>
        <TouchableOpacity style={styles.lvlBadge} onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.lvlText}>⚡ Lv {user?.level || 1}</Text>
        </TouchableOpacity>
      </View>

      {/* Stats strip */}
      <View style={styles.strip}>
        {[['🏆', user?.stats?.wins || 0, 'Wins'], ['📊', user?.stats?.avgScore || 0, 'Avg'], ['💬', user?.stats?.totalDebates || 0, 'Debates']].map(([icon, val, lbl]) => (
          <View key={lbl} style={styles.stripItem}>
            <Text style={styles.stripIcon}>{icon}</Text>
            <Text style={styles.stripVal}>{val}</Text>
            <Text style={styles.stripLbl}>{lbl}</Text>
          </View>
        ))}
      </View>

      {/* Daily Challenge */}
      <DailyChallenge navigation={navigation} />

      {/* Search */}
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search topics..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={handleSearchChange}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => { setSearch(''); setDebouncedSearch(''); }}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Category chips */}
      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={c => c.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.chip, category === item.id && styles.chipActive]}
            onPress={() => setCategory(item.id)}
          >
            <Text style={styles.chipEmoji}>{item.emoji}</Text>
            <Text style={[styles.chipText, category === item.id && { color: COLORS.primary }]}>{item.id}</Text>
          </TouchableOpacity>
        )}
      />

      {/* Topics */}
      {loading ? (
        <View style={styles.list}>
          {[0,1,2,3,4].map(i => <TopicCardSkeleton key={i} />)}
        </View>
      ) : (
        <FlatList
          data={topics}
          keyExtractor={item => item._id}
          renderItem={renderTopic}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={COLORS.primary} />}
          ListHeaderComponent={topics.length > 0 ? <Text style={styles.count}>{topics.length} topic{topics.length !== 1 ? 's' : ''}</Text> : null}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyTitle}>No topics found</Text>
              <Text style={styles.emptySub}>{search ? `No results for "${search}"` : 'Try a different category'}</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: COLORS.bg },
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.xl, paddingTop: SPACING.md, paddingBottom: SPACING.sm },
  greeting:    { fontSize: 12, color: COLORS.textMuted },
  username:    { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary, marginTop: 2 },
  lvlBadge:    { backgroundColor: COLORS.primaryBg, borderRadius: RADIUS.full, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: COLORS.primary },
  lvlText:     { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  strip:       { flexDirection: 'row', marginHorizontal: SPACING.xl, marginBottom: SPACING.md, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, paddingVertical: 12 },
  stripItem:   { flex: 1, alignItems: 'center' },
  stripIcon:   { fontSize: 16, marginBottom: 2 },
  stripVal:    { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  stripLbl:    { fontSize: 10, color: COLORS.textMuted, marginTop: 1 },
  searchWrap:  { flexDirection: 'row', alignItems: 'center', marginHorizontal: SPACING.xl, marginBottom: SPACING.sm, backgroundColor: COLORS.bgInput, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 12 },
  searchIcon:  { fontSize: 14, marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 14, color: COLORS.textPrimary },
  clearBtn:    { fontSize: 14, color: COLORS.textMuted, paddingLeft: 8 },
  chips:       { paddingHorizontal: SPACING.xl, paddingBottom: SPACING.md, gap: 8 },
  chip:        { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.full, paddingHorizontal: 13, paddingVertical: 8, borderWidth: 1, borderColor: COLORS.border },
  chipActive:  { backgroundColor: COLORS.primaryBg, borderColor: COLORS.primary },
  chipEmoji:   { fontSize: 13 },
  chipText:    { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
  count:       { fontSize: 11, color: COLORS.textMuted, marginBottom: 10 },
  list:        { paddingHorizontal: SPACING.xl, paddingBottom: 100, gap: 12 },
  card:        { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border },
  cardTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  diffBadge:   { borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 3 },
  diffText:    { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  flags:       { flexDirection: 'row', gap: 6 },
  trendBadge:  { backgroundColor: COLORS.amberBg, borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 3 },
  trendText:   { fontSize: 10, color: COLORS.amber },
  featBadge:   { backgroundColor: COLORS.accentBg, borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 3 },
  featText:    { fontSize: 10, color: COLORS.accent },
  catLabel:    { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, marginBottom: 5 },
  cardTitle:   { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary, lineHeight: 22 },
  cardFooter:  { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  cardMeta:    { fontSize: 12, color: COLORS.textMuted },
  cardHint:    { fontSize: 11, color: COLORS.textMuted, fontStyle: 'italic' },
  empty:       { alignItems: 'center', paddingTop: 60 },
  emptyIcon:   { fontSize: 40, marginBottom: 12 },
  emptyTitle:  { fontSize: 16, fontWeight: '600', color: COLORS.textSecondary },
  emptySub:    { fontSize: 13, color: COLORS.textMuted, marginTop: 6 },
});
