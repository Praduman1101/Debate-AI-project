import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polyline, Circle, Line, Text as SvgText, Rect } from 'react-native-svg';
import { COLORS, RADIUS, SPACING } from '../utils/theme';

const CHART_W = 280;
const CHART_H = 100;
const PAD_L   = 28;
const PAD_R   = 12;
const PAD_T   = 10;
const PAD_B   = 22;

const plotW = CHART_W - PAD_L - PAD_R;
const plotH = CHART_H - PAD_T - PAD_B;

/**
 * StatsChart
 * Renders a sparkline of a user's score trend over recent debates.
 *
 * Props:
 *   data       — array of numbers (scores 0-100), latest last
 *   label      — y-axis label (e.g. "Total Score")
 *   color      — line color (default COLORS.primary)
 *   showPoints — show data point dots (default true)
 */
const StatsChart = ({
  data = [],
  label = 'Score',
  color = COLORS.primary,
  showPoints = true,
}) => {
  if (!data || data.length < 2) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Not enough data yet</Text>
        <Text style={styles.emptySubText}>Complete 2+ debates to see your trend</Text>
      </View>
    );
  }

  const values = data.slice(-10); // last 10 debates
  const min    = Math.max(0,   Math.min(...values) - 10);
  const max    = Math.min(100, Math.max(...values) + 10);
  const range  = max - min || 1;

  // Map value → pixel coords
  const xAt = (i) => PAD_L + (i / (values.length - 1)) * plotW;
  const yAt = (v) => PAD_T + plotH - ((v - min) / range) * plotH;

  const points = values.map((v, i) => `${xAt(i)},${yAt(v)}`).join(' ');

  // Y-axis gridlines at 25, 50, 75
  const gridLines = [25, 50, 75].filter(v => v > min && v < max);

  // Average
  const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.avgBadge}>
          <Text style={styles.avgText}>Avg: {avg}</Text>
        </View>
      </View>

      <Svg width={CHART_W} height={CHART_H}>
        {/* Grid lines */}
        {gridLines.map(v => (
          <React.Fragment key={v}>
            <Line
              x1={PAD_L} y1={yAt(v)} x2={CHART_W - PAD_R} y2={yAt(v)}
              stroke={COLORS.border} strokeWidth={0.5} strokeDasharray="3,3"
            />
            <SvgText
              x={PAD_L - 4} y={yAt(v) + 4}
              fontSize={8} fill={COLORS.textMuted} textAnchor="end"
            >{v}</SvgText>
          </React.Fragment>
        ))}

        {/* Average line */}
        <Line
          x1={PAD_L} y1={yAt(avg)} x2={CHART_W - PAD_R} y2={yAt(avg)}
          stroke={color + '44'} strokeWidth={1} strokeDasharray="4,3"
        />

        {/* Area fill */}
        <Polyline
          points={`${PAD_L},${PAD_T + plotH} ${points} ${CHART_W - PAD_R},${PAD_T + plotH}`}
          fill={color + '15'}
          stroke="none"
        />

        {/* Main line */}
        <Polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Data points */}
        {showPoints && values.map((v, i) => (
          <Circle
            key={i}
            cx={xAt(i)} cy={yAt(v)}
            r={3.5}
            fill={color}
            stroke={COLORS.bgCard}
            strokeWidth={1.5}
          />
        ))}

        {/* X-axis labels: first, middle, last */}
        {[0, Math.floor((values.length - 1) / 2), values.length - 1].map(i => (
          <SvgText
            key={i}
            x={xAt(i)} y={CHART_H - 4}
            fontSize={8} fill={COLORS.textMuted} textAnchor="middle"
          >
            {i === values.length - 1 ? 'Now' : `−${values.length - 1 - i}`}
          </SvgText>
        ))}
      </Svg>

      {/* Trend badge */}
      <View style={styles.trendRow}>
        {values.length >= 3 && (() => {
          const recent = values.slice(-3).reduce((a, b) => a + b, 0) / 3;
          const early  = values.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
          const delta  = Math.round(recent - early);
          const up     = delta >= 0;
          return (
            <Text style={[styles.trend, { color: up ? COLORS.primary : COLORS.danger }]}>
              {up ? '↗' : '↘'} {up ? '+' : ''}{delta} vs earlier
            </Text>
          );
        })()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper:     { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  label:       { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.7 },
  avgBadge:    { backgroundColor: COLORS.primaryBg, borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 2 },
  avgText:     { fontSize: 11, color: COLORS.primary, fontWeight: '700' },
  trendRow:    { alignItems: 'flex-end', marginTop: 2 },
  trend:       { fontSize: 11, fontWeight: '700' },
  empty:       { paddingVertical: 24, alignItems: 'center' },
  emptyText:   { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600' },
  emptySubText:{ fontSize: 11, color: COLORS.textMuted, marginTop: 4 },
});

export default StatsChart;
