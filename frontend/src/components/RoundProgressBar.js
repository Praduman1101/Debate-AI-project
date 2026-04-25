import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, RADIUS } from '../utils/theme';

/**
 * RoundProgressBar
 * Shows filled dots for completed rounds and a pulsing indicator for the current round.
 */
export default function RoundProgressBar({ currentRound, totalRounds, userWonRounds = [], aiWonRounds = [] }) {
  return (
    <View style={styles.wrap}>
      {Array.from({ length: totalRounds }, (_, i) => {
        const round     = i + 1;
        const completed = round < currentRound;
        const active    = round === currentRound;
        const userWon   = userWonRounds.includes(round);
        const aiWon     = aiWonRounds.includes(round);

        let bg     = COLORS.bgSurface;
        let border = COLORS.border;
        let emoji  = null;

        if (completed) {
          if (userWon)      { bg = COLORS.primaryBg; border = COLORS.primary; emoji = '✓'; }
          else if (aiWon)   { bg = COLORS.accentBg;  border = COLORS.accent;  emoji = '✗'; }
          else              { bg = COLORS.bgCard;     border = COLORS.border;  emoji = '='; }
        }
        if (active) { bg = COLORS.primaryBg; border = COLORS.primary; }

        return (
          <React.Fragment key={round}>
            <View style={[styles.dot, { backgroundColor: bg, borderColor: border }, active && styles.dotActive]}>
              {emoji ? (
                <Text style={[styles.emoji, { color: userWon ? COLORS.primary : aiWon ? COLORS.accent : COLORS.textMuted }]}>
                  {emoji}
                </Text>
              ) : (
                <Text style={[styles.number, active && { color: COLORS.primary }]}>{round}</Text>
              )}
            </View>
            {i < totalRounds - 1 && (
              <View style={[styles.connector, completed && styles.connectorDone]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 6 },
  dot:            { width: 30, height: 30, borderRadius: 15, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  dotActive:      { borderWidth: 2, shadowColor: COLORS.primary, shadowOpacity: 0.5, shadowRadius: 6, elevation: 4 },
  number:         { fontSize: 12, fontWeight: '700', color: COLORS.textMuted },
  emoji:          { fontSize: 12, fontWeight: '700' },
  connector:      { flex: 1, height: 2, backgroundColor: COLORS.border, maxWidth: 20 },
  connectorDone:  { backgroundColor: COLORS.primary + '55' },
});
