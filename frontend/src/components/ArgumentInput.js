import React, { useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Platform, ActivityIndicator,
} from 'react-native';
import useVoiceInput  from '../hooks/useVoiceInput';
import NLPHints       from './NLPHints';
import { COLORS, RADIUS, SPACING } from '../utils/theme';

/**
 * ArgumentInput
 * Reusable debate argument input with voice, NLP hints, char counter.
 *
 * Props:
 *   value           {string}   — controlled input value
 *   onChange        {fn}       — (text) => void
 *   onSubmit        {fn}       — () => void — called when send tapped
 *   disabled        {boolean}  — disables input & buttons
 *   placeholder     {string}   — custom placeholder
 *   isMyTurn        {boolean}  — shows "Your turn" banner + pulse
 *   isUrgent        {boolean}  — shows red timer warning
 *   formattedTime   {string}   — e.g. "0:18"
 *   maxLength       {number}   — default 500
 *   showNLPHints    {boolean}  — default true
 */
const ArgumentInput = ({
  value       = '',
  onChange,
  onSubmit,
  disabled    = false,
  placeholder,
  isMyTurn    = false,
  isUrgent    = false,
  formattedTime = '',
  maxLength   = 500,
  showNLPHints = true,
}) => {
  const resolvedPlaceholder = placeholder || (
    disabled ? 'Waiting...' : 'Type your argument...'
  );

  const { isRecording, isProcessing, startRecording, stopRecording } = useVoiceInput({
    onTranscript: (text) => {
      if (text && onChange) {
        onChange(value ? `${value} ${text}` : text);
      }
    },
  });

  const handleVoice = useCallback(async () => {
    if (isRecording) await stopRecording();
    else             await startRecording();
  }, [isRecording, startRecording, stopRecording]);

  const canSend = !disabled && value.trim().length > 0;

  return (
    <View style={styles.container}>
      {/* Turn banner */}
      {isMyTurn && (
        <View style={styles.turnBanner}>
          <Text style={styles.turnText}>⚡ Your turn · {formattedTime}</Text>
          {isUrgent && <Text style={styles.urgentText}>⚠ Hurry!</Text>}
        </View>
      )}

      {/* NLP hints */}
      {showNLPHints && value.length > 8 && <NLPHints text={value} />}

      {/* Input row */}
      <View style={styles.row}>
        {/* Mic button */}
        <TouchableOpacity
          style={[
            styles.micBtn,
            isRecording  && styles.micRecording,
            isProcessing && styles.micProcessing,
            disabled     && styles.btnDisabled,
          ]}
          onPress={handleVoice}
          disabled={disabled || isProcessing}
          activeOpacity={0.75}
        >
          {isProcessing
            ? <ActivityIndicator size="small" color={COLORS.amber} />
            : <Text style={styles.micIcon}>{isRecording ? '⏹' : '🎤'}</Text>
          }
        </TouchableOpacity>

        {/* Text field */}
        <TextInput
          style={[styles.input, disabled && styles.inputDisabled]}
          value={value}
          onChangeText={onChange}
          placeholder={resolvedPlaceholder}
          placeholderTextColor={COLORS.textMuted}
          multiline
          maxLength={maxLength}
          editable={!disabled}
          returnKeyType="default"
          blurOnSubmit={false}
        />

        {/* Send button */}
        <TouchableOpacity
          style={[styles.sendBtn, !canSend && styles.sendBtnOff]}
          onPress={onSubmit}
          disabled={!canSend}
          activeOpacity={0.85}
        >
          <Text style={styles.sendIcon}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Char counter */}
      {value.length > 0 && (
        <Text style={[
          styles.charCount,
          value.length > maxLength * 0.9 && { color: COLORS.danger },
        ]}>
          {value.length}/{maxLength}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container:      { backgroundColor: COLORS.bgCard, borderTopWidth: 1, borderTopColor: COLORS.border, padding: SPACING.md, paddingBottom: Platform.OS === 'ios' ? SPACING.lg : SPACING.md },

  turnBanner:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  turnText:       { fontSize: 11, fontWeight: '700', color: COLORS.primary, letterSpacing: 0.3 },
  urgentText:     { fontSize: 11, fontWeight: '700', color: COLORS.danger },

  row:            { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },

  micBtn:         { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.bgSurface, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  micRecording:   { borderColor: COLORS.danger,  backgroundColor: COLORS.dangerBg },
  micProcessing:  { borderColor: COLORS.amber,   backgroundColor: COLORS.amberBg  },
  btnDisabled:    { opacity: 0.4 },
  micIcon:        { fontSize: 18 },

  input:          { flex: 1, backgroundColor: COLORS.bgInput, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: 10, paddingTop: 10, fontSize: 14, color: COLORS.textPrimary, maxHeight: 100, lineHeight: 20 },
  inputDisabled:  { opacity: 0.4 },

  sendBtn:        { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  sendBtnOff:     { backgroundColor: COLORS.bgSurface },
  sendIcon:       { fontSize: 18, color: '#fff', fontWeight: '700' },

  charCount:      { fontSize: 11, color: COLORS.textMuted, textAlign: 'right', marginTop: 5 },
});

export default ArgumentInput;
