import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, ScrollView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth }  from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { COLORS, RADIUS, SPACING } from '../utils/theme';

export default function AuthScreen() {
  const [tab,      setTab]      = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [busy,     setBusy]     = useState(false);

  const { login, register } = useAuth();
  const toast = useToast();

  const validate = () => {
    if (!email.trim())    { toast.error('Email is required');    return false; }
    if (!email.includes('@')) { toast.error('Enter a valid email'); return false; }
    if (!password)        { toast.error('Password is required'); return false; }
    if (password.length < 6) { toast.error('Password must be 6+ characters'); return false; }
    if (tab === 'register' && !username.trim()) {
      toast.error('Username is required');
      return false;
    }
    if (tab === 'register' && username.length < 3) {
      toast.error('Username must be at least 3 characters');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setBusy(true);

    const result = tab === 'login'
      ? await login(email.trim(), password)
      : await register(username.trim(), email.trim(), password);

    setBusy(false);

    if (!result.success) {
      toast.error(result.error || 'Something went wrong');
    }
    // On success AuthContext updates user → AppNavigator auto-navigates
  };

  const handleTabSwitch = (newTab) => {
    setTab(newTab);
    setUsername('');
    setEmail('');
    setPassword('');
  };

  return (
    <SafeAreaView style={S.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={S.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={S.logoWrap}>
            <Text style={S.logoEmoji}>⚡</Text>
            <Text style={S.logoTitle}>DebateAI</Text>
            <Text style={S.logoSub}>Sharpen your arguments with AI</Text>
          </View>

          {/* Tab toggle */}
          <View style={S.tabs}>
            {['login', 'register'].map(t => (
              <TouchableOpacity
                key={t}
                style={[S.tab, tab === t && S.tabActive]}
                onPress={() => handleTabSwitch(t)}
              >
                <Text style={[S.tabText, tab === t && S.tabTextActive]}>
                  {t === 'login' ? 'Sign In' : 'Register'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Form */}
          <View style={S.form}>
            {tab === 'register' && (
              <View style={S.field}>
                <Text style={S.label}>Username</Text>
                <TextInput
                  style={S.input}
                  placeholder="Your debate handle"
                  placeholderTextColor={COLORS.textMuted}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  maxLength={30}
                  returnKeyType="next"
                />
              </View>
            )}

            <View style={S.field}>
              <Text style={S.label}>Email</Text>
              <TextInput
                style={S.input}
                placeholder="you@example.com"
                placeholderTextColor={COLORS.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                returnKeyType="next"
              />
            </View>

            <View style={S.field}>
              <Text style={S.label}>Password</Text>
              <View style={S.passWrap}>
                <TextInput
                  style={[S.input, { flex: 1, marginBottom: 0 }]}
                  placeholder="••••••••"
                  placeholderTextColor={COLORS.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPass}
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                />
                <TouchableOpacity
                  style={S.eyeBtn}
                  onPress={() => setShowPass(v => !v)}
                >
                  <Text style={S.eyeIcon}>{showPass ? '🙈' : '👁'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[S.submitBtn, busy && S.submitBtnBusy]}
              onPress={handleSubmit}
              disabled={busy}
              activeOpacity={0.85}
            >
              {busy
                ? <ActivityIndicator color="#fff" />
                : <Text style={S.submitBtnText}>
                    {tab === 'login' ? 'Sign In →' : 'Create Account →'}
                  </Text>
              }
            </TouchableOpacity>
          </View>

          {/* Stats row */}
          <View style={S.statsRow}>
            {[['⚡', '1.2k', 'Debates'], ['🏆', '340+', 'Topics'], ['🤖', 'Claude', 'AI']].map(([icon, val, lbl]) => (
              <View key={lbl} style={S.statItem}>
                <Text style={S.statIcon}>{icon}</Text>
                <Text style={S.statVal}>{val}</Text>
                <Text style={S.statLbl}>{lbl}</Text>
              </View>
            ))}
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: COLORS.bg },
  container:    { flexGrow: 1, padding: SPACING.xl, justifyContent: 'center' },

  logoWrap:     { alignItems: 'center', marginBottom: 32 },
  logoEmoji:    { fontSize: 52, marginBottom: 8 },
  logoTitle:    { fontSize: 34, fontWeight: '800', color: COLORS.primary, letterSpacing: 1 },
  logoSub:      { fontSize: 14, color: COLORS.textSecondary, marginTop: 6 },

  tabs:         { flexDirection: 'row', backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: 4, marginBottom: SPACING.xl, borderWidth: 1, borderColor: COLORS.border },
  tab:          { flex: 1, paddingVertical: 11, alignItems: 'center', borderRadius: RADIUS.md },
  tabActive:    { backgroundColor: COLORS.primary },
  tabText:      { fontSize: 14, fontWeight: '700', color: COLORS.textMuted },
  tabTextActive:{ color: '#fff' },

  form:         { gap: SPACING.md },
  field:        { gap: 6 },
  label:        { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6 },
  input:        { backgroundColor: COLORS.bgInput, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: 14, fontSize: 15, color: COLORS.textPrimary },
  passWrap:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyeBtn:       { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bgInput, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md },
  eyeIcon:      { fontSize: 18 },

  submitBtn:    { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, padding: 15, alignItems: 'center', marginTop: 8 },
  submitBtnBusy:{ opacity: 0.7 },
  submitBtnText:{ fontSize: 16, fontWeight: '700', color: '#fff' },

  statsRow:     { flexDirection: 'row', justifyContent: 'space-around', marginTop: 40, paddingTop: SPACING.xl, borderTopWidth: 1, borderTopColor: COLORS.border },
  statItem:     { alignItems: 'center' },
  statIcon:     { fontSize: 20, marginBottom: 4 },
  statVal:      { fontSize: 18, fontWeight: '700', color: COLORS.primary },
  statLbl:      { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
});
