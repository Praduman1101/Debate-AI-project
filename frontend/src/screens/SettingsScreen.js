import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, Alert, TextInput, Modal, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth }      from '../context/AuthContext';
import { useToast }     from '../context/ToastContext';
import useUserActions   from '../hooks/useUserActions';
import useSound         from '../hooks/useSound';
import useHaptics       from '../hooks/useHaptics';
import { COLORS, RADIUS, SPACING } from '../utils/theme';

/* ─── Setting Row ──────────────────────────────────────────────────────── */
const SettingRow = ({ icon, label, subtitle, right, onPress, danger }) => (
  <TouchableOpacity
    style={styles.row}
    onPress={onPress}
    disabled={!onPress && !right}
    activeOpacity={onPress ? 0.7 : 1}
  >
    <View style={[styles.rowIcon, danger && styles.rowIconDanger]}>
      <Text style={styles.rowIconText}>{icon}</Text>
    </View>
    <View style={{ flex: 1 }}>
      <Text style={[styles.rowLabel, danger && { color: COLORS.danger }]}>{label}</Text>
      {subtitle ? <Text style={styles.rowSub}>{subtitle}</Text> : null}
    </View>
    {right ?? (onPress ? <Text style={styles.rowArrow}>›</Text> : null)}
  </TouchableOpacity>
);

const Section = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionCard}>{children}</View>
  </View>
);

/* ─── Password Modal ───────────────────────────────────────────────────── */
const PasswordModal = ({ visible, onClose, onSave, loading }) => {
  const [current, setCurrent] = useState('');
  const [next,    setNext]    = useState('');
  const [confirm, setConfirm] = useState('');
  const reset = () => { setCurrent(''); setNext(''); setConfirm(''); };

  const handleSave = () => {
    if (next.length < 6) { Alert.alert('Error', 'New password must be 6+ characters'); return; }
    if (next !== confirm) { Alert.alert('Error', 'New passwords do not match'); return; }
    onSave(current, next, reset);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Change Password</Text>
          {[
            ['Current Password', current, setCurrent],
            ['New Password',     next,    setNext],
            ['Confirm New',      confirm, setConfirm],
          ].map(([lbl, val, setter]) => (
            <View key={lbl} style={{ marginBottom: SPACING.md }}>
              <Text style={styles.modalLabel}>{lbl}</Text>
              <TextInput
                style={styles.modalInput}
                value={val}
                onChangeText={setter}
                secureTextEntry
                placeholder="••••••••"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
          ))}
          <View style={styles.modalBtns}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => { reset(); onClose(); }}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
              <Text style={styles.saveText}>{loading ? 'Saving...' : 'Save'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

/* ─── Main Screen ──────────────────────────────────────────────────────── */
export default function SettingsScreen({ navigation }) {
  const { user, logout }                           = useAuth();
  const toast                                      = useToast();
  const { changePassword, deleteAccount, loading } = useUserActions();
  const { enabled: soundEnabled, toggle: toggleSound }     = useSound();
  const { enabled: hapticsEnabled, toggle: toggleHaptics } = useHaptics();

  const [notifDebate, setNotifDebate] = useState(true);
  const [notifMatch,  setNotifMatch]  = useState(true);
  const [pwModal,     setPwModal]     = useState(false);

  const handleChangePassword = async (current, next, reset) => {
    const ok = await changePassword(current, next);
    if (ok) { toast.success('Password changed successfully'); setPwModal(false); reset(); }
    else    { toast.error('Incorrect current password'); }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      '⚠️ Delete Account',
      'This permanently deletes your account and all debates. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account', style: 'destructive',
          onPress: () => Alert.prompt(
            'Confirm Password',
            'Enter your password to confirm',
            async (password) => {
              if (!password) return;
              const ok = await deleteAccount(password);
              if (ok) { toast.info('Account deleted'); logout(); }
              else    { toast.error('Incorrect password'); }
            },
            'secure-text'
          ),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Settings</Text>
          <View style={{ width: 50 }} />
        </View>

        {/* Account */}
        <Section title="Account">
          <SettingRow icon="👤" label={user?.username} subtitle={user?.email} />
          <View style={styles.divider} />
          <SettingRow icon="🔐" label="Change Password" subtitle="Update your login password" onPress={() => setPwModal(true)} />
        </Section>

        {/* Notifications */}
        <Section title="Notifications">
          <SettingRow
            icon="🔔"
            label="Debate Reminders"
            subtitle="Daily nudge to practice"
            right={<Switch value={notifDebate} onValueChange={setNotifDebate} trackColor={{ false: COLORS.bgSurface, true: COLORS.primary }} thumbColor={notifDebate ? '#fff' : COLORS.textMuted} />}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="⚔️"
            label="Match Found"
            subtitle="Alert when a PvP opponent is found"
            right={<Switch value={notifMatch} onValueChange={setNotifMatch} trackColor={{ false: COLORS.bgSurface, true: COLORS.primary }} thumbColor={notifMatch ? '#fff' : COLORS.textMuted} />}
          />
        </Section>

        {/* Preferences — wired to real hooks */}
        <Section title="Preferences">
          <SettingRow
            icon="🔊"
            label="Sound Effects"
            subtitle={soundEnabled ? 'On — sounds during debates' : 'Off'}
            right={
              <Switch
                value={soundEnabled}
                onValueChange={toggleSound}
                trackColor={{ false: COLORS.bgSurface, true: COLORS.primary }}
                thumbColor={soundEnabled ? '#fff' : COLORS.textMuted}
              />
            }
          />
          <View style={styles.divider} />
          <SettingRow
            icon="📳"
            label="Haptic Feedback"
            subtitle={hapticsEnabled ? 'On — vibrations on key events' : 'Off'}
            right={
              <Switch
                value={hapticsEnabled}
                onValueChange={toggleHaptics}
                trackColor={{ false: COLORS.bgSurface, true: COLORS.primary }}
                thumbColor={hapticsEnabled ? '#fff' : COLORS.textMuted}
              />
            }
          />
        </Section>

        {/* Support */}
        <Section title="Support">
          <SettingRow icon="📖" label="How to Debate"    subtitle="Tips and strategy guide"          onPress={() => {}} />
          <View style={styles.divider} />
          <SettingRow icon="🐛" label="Report a Bug"     subtitle="Help us improve DebateAI"         onPress={() => Linking.openURL('mailto:support@debateai.app')} />
          <View style={styles.divider} />
          <SettingRow icon="⭐" label="Rate the App"     subtitle="Leave a review"                   onPress={() => {}} />
          <View style={styles.divider} />
          <SettingRow icon="🔒" label="Privacy Policy"   subtitle="How we handle your data"          onPress={() => Linking.openURL('https://debateai.app/privacy')} />
        </Section>

        {/* App info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>DebateAI v1.0.0</Text>
          <Text style={styles.appInfoText}>Powered by Anthropic Claude</Text>
        </View>

        {/* Danger zone */}
        <Section title="Danger Zone">
          <SettingRow icon="🚪" label="Sign Out" onPress={() =>
            Alert.alert('Sign Out?', '', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Sign Out', style: 'destructive', onPress: logout },
            ])
          } />
          <View style={styles.divider} />
          <SettingRow icon="🗑️" label="Delete Account" subtitle="Permanently remove all data" onPress={handleDeleteAccount} danger />
        </Section>

      </ScrollView>

      <PasswordModal visible={pwModal} onClose={() => setPwModal(false)} onSave={handleChangePassword} loading={loading} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: COLORS.bg },
  container:    { padding: SPACING.xl, paddingBottom: 60 },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.xl },
  back:         { fontSize: 14, color: COLORS.textSecondary },
  title:        { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary },
  section:      { marginBottom: SPACING.lg },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  sectionCard:  { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  row:          { flexDirection: 'row', alignItems: 'center', gap: 14, padding: SPACING.md },
  rowIcon:      { width: 36, height: 36, borderRadius: RADIUS.md, backgroundColor: COLORS.bgSurface, alignItems: 'center', justifyContent: 'center' },
  rowIconDanger:{ backgroundColor: COLORS.dangerBg },
  rowIconText:  { fontSize: 18 },
  rowLabel:     { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  rowSub:       { fontSize: 12, color: COLORS.textMuted, marginTop: 1 },
  rowArrow:     { fontSize: 20, color: COLORS.textMuted },
  divider:      { height: 1, backgroundColor: COLORS.border, marginLeft: 64 },
  appInfo:      { alignItems: 'center', marginBottom: SPACING.lg, gap: 4 },
  appInfoText:  { fontSize: 12, color: COLORS.textMuted },
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modalCard:    { backgroundColor: COLORS.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.xl, paddingBottom: 40, borderTopWidth: 1, borderTopColor: COLORS.border },
  modalTitle:   { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary, marginBottom: SPACING.lg },
  modalLabel:   { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 },
  modalInput:   { backgroundColor: COLORS.bgInput, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: 13, fontSize: 15, color: COLORS.textPrimary },
  modalBtns:    { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn:    { flex: 1, padding: 13, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  cancelText:   { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  saveBtn:      { flex: 1, padding: 13, borderRadius: RADIUS.md, backgroundColor: COLORS.primary, alignItems: 'center' },
  saveText:     { fontSize: 14, fontWeight: '700', color: '#fff' },
});
