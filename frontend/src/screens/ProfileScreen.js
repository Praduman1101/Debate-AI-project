import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, TextInput, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api              from '../services/api';
import { useAuth }      from '../context/AuthContext';
import { useToast }     from '../context/ToastContext';
import useUserActions   from '../hooks/useUserActions';
import StatsChart       from '../components/StatsChart';
import { COLORS, RADIUS, SPACING } from '../utils/theme';
import { calcWinRate, scoreToGrade, formatRelativeTime } from '../utils/helpers';

const BADGE_META = {
  first_win:  { icon: '🏆', label: 'First Win' },
  streak_5:   { icon: '🔥', label: '5-Win Streak' },
  expert:     { icon: '🎓', label: 'Expert Debater' },
  centurion:  { icon: '💯', label: '100 Debates' },
  ai_slayer:  { icon: '🤖', label: 'AI Slayer' },
};

const XPBar = ({ xp = 0, level = 1 }) => {
  const xpInLevel = xp % 500;
  const pct       = (xpInLevel / 500) * 100;
  const grade     = scoreToGrade(Math.round(pct));
  return (
    <View style={S.xpCard}>
      <View style={S.xpRow}>
        <View><Text style={S.xpLevel}>Level {level}</Text><Text style={S.xpSub}>{xpInLevel}/500 XP</Text></View>
        <View style={[S.xpGrade, { borderColor: grade.color + '66' }]}>
          <Text style={[S.xpGradeText, { color: grade.color }]}>{grade.grade}</Text>
        </View>
      </View>
      <View style={S.xpTrack}><View style={[S.xpFill, { width: `${pct}%` }]} /></View>
    </View>
  );
};

const StatCard = ({ icon, value, label, color }) => (
  <View style={S.statCard}>
    <Text style={S.statIcon}>{icon}</Text>
    <Text style={[S.statValue, color && { color }]}>{value ?? 0}</Text>
    <Text style={S.statLabel}>{label}</Text>
  </View>
);

const EditModal = ({ visible, current, onSave, onClose, loading }) => {
  const [val, setVal] = useState(current);
  useEffect(() => setVal(current), [current]);
  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <View style={S.overlay}>
        <View style={S.modalCard}>
          <Text style={S.modalTitle}>Edit Username</Text>
          <Text style={S.modalLabel}>New Username</Text>
          <TextInput style={S.modalInput} value={val} onChangeText={setVal} autoCapitalize="none" maxLength={30} autoFocus placeholderTextColor={COLORS.textMuted} />
          <View style={S.modalBtns}>
            <TouchableOpacity style={S.cancelBtn} onPress={onClose}><Text style={S.cancelText}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={S.saveBtn} onPress={() => onSave(val)} disabled={loading}><Text style={S.saveText}>{loading ? '...' : 'Save'}</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function ProfileScreen({ navigation }) {
  const { user, logout }                   = useAuth();
  const toast                              = useToast();
  const { updateProfile, loading: saving } = useUserActions();

  const [stats,         setStats]         = useState(null);
  const [recentDebates, setRecentDebates] = useState([]);
  const [scoreTrend,    setScoreTrend]    = useState([]);
  const [loadingStats,  setLoadingStats]  = useState(true);
  const [editModal,     setEditModal]     = useState(false);

  useEffect(() => {
    api.get('/scores/me')
      .then(res => {
        setStats(res.data.stats);
        const recent = res.data.recentDebates || [];
        setRecentDebates(recent);
        // Extract score trend from recent debates (oldest → newest)
        const trend = [...recent]
          .reverse()
          .map(d => d.scores?.user?.total ?? 0)
          .filter(s => s > 0);
        setScoreTrend(trend);
      })
      .catch(() => toast.error('Could not load stats'))
      .finally(() => setLoadingStats(false));
  }, []);

  const handleSaveUsername = async (newUsername) => {
    if (!newUsername.trim() || newUsername.length < 3) { toast.error('Username must be 3+ characters'); return; }
    const ok = await updateProfile({ username: newUsername.trim() });
    if (ok) { setEditModal(false); toast.success('Username updated!'); }
    else    { toast.error('Username already taken or invalid'); }
  };

  const winRate = calcWinRate(stats?.wins, stats?.totalDebates);

  return (
    <SafeAreaView style={S.safe}>
      <ScrollView contentContainerStyle={S.container} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={S.headerRow}>
          <Text style={S.title}>Profile</Text>
          <View style={S.actions}>
            <TouchableOpacity style={S.actionBtn} onPress={() => navigation.navigate('GenerateTopics')}><Text style={S.actionIcon}>✨</Text></TouchableOpacity>
            <TouchableOpacity style={S.actionBtn} onPress={() => navigation.navigate('Settings')}><Text style={S.actionIcon}>⚙️</Text></TouchableOpacity>
          </View>
        </View>

        {/* Avatar */}
        <View style={S.avatarSection}>
          <View style={S.avatarWrap}>
            <View style={S.avatar}><Text style={S.avatarText}>{user?.username?.[0]?.toUpperCase()}</Text></View>
            <View style={S.lvlDot}><Text style={S.lvlDotText}>{user?.level || 1}</Text></View>
          </View>
          <Text style={S.username}>{user?.username}</Text>
          <Text style={S.email}>{user?.email}</Text>
          <TouchableOpacity style={S.editBtn} onPress={() => setEditModal(true)}>
            <Text style={S.editBtnText}>✏️  Edit Username</Text>
          </TouchableOpacity>
        </View>

        {/* XP */}
        <XPBar xp={user?.xp || 0} level={user?.level || 1} />

        {loadingStats
          ? <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 20 }} />
          : (
          <>
            {/* Stats grid */}
            <View style={S.statsGrid}>
              <StatCard icon="💬" value={stats?.totalDebates} label="Debates" />
              <StatCard icon="🏆" value={stats?.wins}          label="Wins"   color={COLORS.primary} />
              <StatCard icon="📉" value={stats?.losses}        label="Losses" color={COLORS.danger} />
              <StatCard icon="📊" value={`${winRate}%`}        label="Win Rate" color={COLORS.amber} />
            </View>

            {/* Score trend chart */}
            {scoreTrend.length >= 2 && (
              <View style={S.section}>
                <Text style={S.sectionTitle}>Score Trend</Text>
                <StatsChart data={scoreTrend} label="Total Score" color={COLORS.primary} />
              </View>
            )}

            {/* Performance bars */}
            <View style={S.section}>
              <Text style={S.sectionTitle}>Avg Performance</Text>
              {[['🧠','Logic',stats?.avgLogic],['🎯','Relevance',stats?.avgScore],['🗣','Clarity',stats?.avgClarity],['💪','Confidence',stats?.avgConfidence]].map(([icon,lbl,val]) => (
                <View key={lbl} style={S.perfRow}>
                  <Text style={S.perfIcon}>{icon}</Text>
                  <Text style={S.perfLabel}>{lbl}</Text>
                  <View style={S.perfTrack}><View style={[S.perfFill, { width: `${val || 0}%` }]} /></View>
                  <Text style={S.perfVal}>{val || 0}</Text>
                </View>
              ))}
            </View>

            {/* Recent debates */}
            {recentDebates.length > 0 && (
              <View style={S.section}>
                <View style={S.sectionHeader}>
                  <Text style={S.sectionTitle}>Recent Debates</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('History')}><Text style={S.seeAll}>See all →</Text></TouchableOpacity>
                </View>
                {recentDebates.map(d => (
                  <TouchableOpacity key={d._id} style={S.recentRow} onPress={() => d.status === 'completed' && navigation.navigate('DebateReview', { debateId: d._id })}>
                    <Text style={S.recentIcon}>{d.winner === 'user' ? '🏆' : d.winner === 'draw' ? '🤝' : '📚'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={S.recentTopic} numberOfLines={1}>{d.topic?.title}</Text>
                      <Text style={S.recentMeta}>Score {d.scores?.user?.total ?? 0} · {formatRelativeTime(d.completedAt)}</Text>
                    </View>
                    {d.status === 'completed' && <Text style={S.reviewLink}>Review →</Text>}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Badges */}
            {user?.badges?.length > 0 && (
              <View style={S.section}>
                <Text style={S.sectionTitle}>Badges</Text>
                <View style={S.badgesRow}>
                  {user.badges.map(b => {
                    const m = BADGE_META[b] || { icon: '🎖', label: b };
                    return (
                      <View key={b} style={S.badge}>
                        <Text style={S.badgeIcon}>{m.icon}</Text>
                        <Text style={S.badgeLbl}>{m.label}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </>
        )}

        <TouchableOpacity style={S.logoutBtn} onPress={() => { logout(); toast.info('Signed out'); }}>
          <Text style={S.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      <EditModal visible={editModal} current={user?.username || ''} onSave={handleSaveUsername} onClose={() => setEditModal(false)} loading={saving} />
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: COLORS.bg },
  container:     { padding: SPACING.xl, paddingBottom: 60 },
  headerRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xl },
  title:         { fontSize: 26, fontWeight: '800', color: COLORS.textPrimary },
  actions:       { flexDirection: 'row', gap: 8 },
  actionBtn:     { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  actionIcon:    { fontSize: 18 },
  avatarSection: { alignItems: 'center', marginBottom: SPACING.lg },
  avatarWrap:    { position: 'relative', marginBottom: 12 },
  avatar:        { width: 84, height: 84, borderRadius: 42, backgroundColor: COLORS.primaryBg, borderWidth: 2, borderColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText:    { fontSize: 34, fontWeight: '800', color: COLORS.primary },
  lvlDot:        { position: 'absolute', bottom: -2, right: -2, width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.bg },
  lvlDotText:    { fontSize: 12, fontWeight: '800', color: '#fff' },
  username:      { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary },
  email:         { fontSize: 13, color: COLORS.textMuted, marginTop: 3 },
  editBtn:       { marginTop: 12, paddingHorizontal: 16, paddingVertical: 7, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bgCard },
  editBtnText:   { fontSize: 13, color: COLORS.textSecondary },
  xpCard:        { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  xpRow:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  xpLevel:       { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  xpSub:         { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  xpGrade:       { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.bgSurface, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  xpGradeText:   { fontSize: 13, fontWeight: '800' },
  xpTrack:       { height: 8, backgroundColor: COLORS.bgSurface, borderRadius: 4, overflow: 'hidden' },
  xpFill:        { height: '100%', backgroundColor: COLORS.primary, borderRadius: 4 },
  statsGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: SPACING.md },
  statCard:      { width: '47%', backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  statIcon:      { fontSize: 24, marginBottom: 6 },
  statValue:     { fontSize: 26, fontWeight: '800', color: COLORS.textPrimary },
  statLabel:     { fontSize: 11, color: COLORS.textMuted, marginTop: 3 },
  section:       { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle:  { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
  seeAll:        { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
  perfRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  perfIcon:      { fontSize: 15, width: 20 },
  perfLabel:     { fontSize: 13, color: COLORS.textSecondary, width: 82 },
  perfTrack:     { flex: 1, height: 6, backgroundColor: COLORS.bgSurface, borderRadius: 3, overflow: 'hidden' },
  perfFill:      { height: '100%', backgroundColor: COLORS.primary, borderRadius: 3 },
  perfVal:       { fontSize: 12, fontWeight: '700', color: COLORS.primary, width: 28, textAlign: 'right' },
  recentRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  recentIcon:    { fontSize: 20 },
  recentTopic:   { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  recentMeta:    { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  reviewLink:    { fontSize: 11, color: COLORS.primary, fontWeight: '600' },
  badgesRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badge:         { backgroundColor: COLORS.bgSurface, borderRadius: RADIUS.md, padding: 10, alignItems: 'center', minWidth: 72, borderWidth: 1, borderColor: COLORS.border },
  badgeIcon:     { fontSize: 22, marginBottom: 4 },
  badgeLbl:      { fontSize: 10, color: COLORS.textMuted, textAlign: 'center' },
  logoutBtn:     { marginTop: SPACING.lg, backgroundColor: COLORS.dangerBg, borderRadius: RADIUS.lg, padding: 15, alignItems: 'center', borderWidth: 1, borderColor: COLORS.danger },
  logoutText:    { fontSize: 15, fontWeight: '700', color: COLORS.danger },
  overlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modalCard:     { backgroundColor: COLORS.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.xl, paddingBottom: 40, borderTopWidth: 1, borderTopColor: COLORS.border },
  modalTitle:    { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary, marginBottom: SPACING.lg },
  modalLabel:    { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 },
  modalInput:    { backgroundColor: COLORS.bgInput, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: 13, fontSize: 15, color: COLORS.textPrimary, marginBottom: SPACING.lg },
  modalBtns:     { flexDirection: 'row', gap: 12 },
  cancelBtn:     { flex: 1, padding: 13, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  cancelText:    { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  saveBtn:       { flex: 1, padding: 13, borderRadius: RADIUS.md, backgroundColor: COLORS.primary, alignItems: 'center' },
  saveText:      { fontSize: 14, fontWeight: '700', color: '#fff' },
});
