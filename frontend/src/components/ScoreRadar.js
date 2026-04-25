import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polygon, Circle, Line, Text as SvgText } from 'react-native-svg';
import { COLORS } from '../utils/theme';

const SIZE   = 180;
const CENTER = SIZE / 2;
const RADIUS = 68;

const METRICS = ['Logic', 'Relevance', 'Clarity', 'Confidence'];

const polarToXY = (angle, r) => ({
  x: CENTER + r * Math.cos(angle - Math.PI / 2),
  y: CENTER + r * Math.sin(angle - Math.PI / 2),
});

const buildPolygon = (values, r = RADIUS) =>
  values
    .map((v, i) => {
      const angle = (2 * Math.PI * i) / values.length;
      const { x, y } = polarToXY(angle, (v / 100) * r);
      return `${x},${y}`;
    })
    .join(' ');

export default function ScoreRadar({ userScores, aiScores }) {
  const userVals = [
    userScores?.logic      || 0,
    userScores?.relevance  || 0,
    userScores?.clarity    || 0,
    userScores?.confidence || 0,
  ];
  const aiVals = [
    aiScores?.logic      || 0,
    aiScores?.relevance  || 0,
    aiScores?.clarity    || 0,
    aiScores?.confidence || 0,
  ];

  // Grid rings at 25%, 50%, 75%, 100%
  const rings = [0.25, 0.5, 0.75, 1].map(pct =>
    buildPolygon([pct * 100, pct * 100, pct * 100, pct * 100])
  );

  return (
    <View style={styles.wrap}>
      <Svg width={SIZE} height={SIZE}>
        {/* Grid rings */}
        {rings.map((pts, i) => (
          <Polygon
            key={i}
            points={pts}
            fill="none"
            stroke={COLORS.border}
            strokeWidth={1}
            opacity={0.5}
          />
        ))}

        {/* Axis lines */}
        {METRICS.map((_, i) => {
          const angle = (2 * Math.PI * i) / METRICS.length;
          const { x, y } = polarToXY(angle, RADIUS);
          return (
            <Line
              key={i}
              x1={CENTER} y1={CENTER}
              x2={x}      y2={y}
              stroke={COLORS.border}
              strokeWidth={1}
            />
          );
        })}

        {/* AI fill */}
        <Polygon
          points={buildPolygon(aiVals)}
          fill={COLORS.accent + '33'}
          stroke={COLORS.accent}
          strokeWidth={1.5}
        />

        {/* User fill */}
        <Polygon
          points={buildPolygon(userVals)}
          fill={COLORS.primary + '44'}
          stroke={COLORS.primary}
          strokeWidth={2}
        />

        {/* Center dot */}
        <Circle cx={CENTER} cy={CENTER} r={3} fill={COLORS.border} />

        {/* Labels */}
        {METRICS.map((label, i) => {
          const angle  = (2 * Math.PI * i) / METRICS.length;
          const offset = 14;
          const { x, y } = polarToXY(angle, RADIUS + offset);
          return (
            <SvgText
              key={label}
              x={x}
              y={y + 4}
              fontSize={10}
              fill={COLORS.textMuted}
              textAnchor="middle"
              fontWeight="600"
            >
              {label}
            </SvgText>
          );
        })}
      </Svg>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.primary }]} />
          <Text style={styles.legendText}>You</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.accent }]} />
          <Text style={styles.legendText}>AI</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:       { alignItems: 'center', paddingVertical: 8 },
  legend:     { flexDirection: 'row', gap: 20, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot:  { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, color: COLORS.textSecondary },
});
