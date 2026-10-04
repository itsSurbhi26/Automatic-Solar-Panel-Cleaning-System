/**
 * Reports Screen
 * - Energy gain %
 * - Number of cleanings
 * - Total cleaning energy (Wh)
 * - Avg dust loss comparison
 * - Bar charts (SVG)
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import Svg, { Rect, Text as SvgText, Line } from 'react-native-svg';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSolarStore } from '../../src/store/useSolarStore';
import { getSimulatorInstance } from '../../src/data/SimulatorDataSource';
import { Card, SectionTitle, Divider } from '../../src/components/ui';
import { Colors, Spacing, Typography, Radius } from '../../src/theme';
import { useTheme } from '../../src/theme/useTheme';
import { runFullSimulation, DEFAULT_CONFIG } from '../../src/sim/engine';

const { width } = Dimensions.get('window');
const BAR_CHART_W = width - Spacing.base * 4;
const BAR_H = 160;

export default function ReportsScreen() {
  const theme = useTheme();
  const simState = useSolarStore((s) => s.simState);
  const sim = getSimulatorInstance();
  const result = simState?.result ?? sim.getSimState().result;

  // No-clean baseline
  const baseline = React.useMemo(
    () => runFullSimulation({ ...DEFAULT_CONFIG, triggerRatio: 999 }),
    [],
  );

  const totalPowerWith = result.days.reduce((a, d) => a + d.totalPowerWh, 0);
  const totalPowerWithout = baseline.days.reduce((a, d) => a + d.totalPowerWh, 0);
  const energyGain = result.energyGainPct;
  const cleaningEnergyWh = result.totalCleanEnergyWh;
  const netGainWh = totalPowerWith - totalPowerWithout - cleaningEnergyWh;
  const roi = cleaningEnergyWh > 0 ? (netGainWh / cleaningEnergyWh).toFixed(0) : '∞';

  const stats = [
    {
      label: 'Energy Gain',
      value: `${energyGain.toFixed(1)}%`,
      icon: 'trending-up' as const,
      color: Colors.success,
      sub: `+${(totalPowerWith - totalPowerWithout).toFixed(1)} Wh over 30 days`,
    },
    {
      label: 'Cleanings',
      value: `${result.cleanings}`,
      icon: 'water' as const,
      color: Colors.info,
      sub: `${result.totalCleanEnergyWh.toFixed(2)} Wh consumed`,
    },
    {
      label: 'Avg Dust Loss (w/ clean)',
      value: `${(result.avgDustLossWith * 100).toFixed(1)}%`,
      icon: 'layers' as const,
      color: Colors.success,
      sub: `Expected ≈ 2.3%`,
    },
    {
      label: 'Avg Dust Loss (no clean)',
      value: `${(result.avgDustLossWithout * 100).toFixed(1)}%`,
      icon: 'alert-circle' as const,
      color: Colors.danger,
      sub: `Expected ≈ 11.7%`,
    },
    {
      label: 'Net Energy Gain',
      value: `${netGainWh.toFixed(1)} Wh`,
      icon: 'flash' as const,
      color: Colors.amber,
      sub: `ROI: ${roi}× cleaning energy`,
    },
    {
      label: 'Total Energy (with)',
      value: `${(totalPowerWith / 1000).toFixed(2)} kWh`,
      icon: 'sunny' as const,
      color: Colors.skyBlue,
      sub: `vs ${(totalPowerWithout / 1000).toFixed(2)} kWh without`,
    },
  ];

  // 30-day bar data: daily power
  const powerWithData = result.days.map((d) => d.totalPowerWh);
  const powerWithoutData = baseline.days.map((d) => d.totalPowerWh);
  const maxPower = Math.max(...powerWithData, ...powerWithoutData);

  const barW = (BAR_CHART_W - 40) / 30 - 2;
  const barH = BAR_H - 40;

  const renderBarChart = () => (
    <Svg width={BAR_CHART_W} height={BAR_H}>
      {/* Y axis labels */}
      {[0, 0.5, 1].map((frac) => {
        const y = 10 + (1 - frac) * barH;
        const val = (frac * maxPower).toFixed(0);
        return (
          <React.Fragment key={frac}>
            <Line x1={36} y1={y} x2={BAR_CHART_W} y2={y} stroke={theme.border} strokeWidth={1} strokeDasharray="3 3" />
            <SvgText x={32} y={y + 4} fontSize={8} fill={theme.textMuted} textAnchor="end">{val}</SvgText>
          </React.Fragment>
        );
      })}
      {/* Bars */}
      {result.days.map((d, i) => {
        const x = 38 + i * ((BAR_CHART_W - 40) / 30);
        const hWith = (powerWithData[i] / maxPower) * barH;
        const hWithout = (powerWithoutData[i] / maxPower) * barH;
        const cleaned = d.cleaned;
        const storm = d.isStormy;
        const cloudy = d.isCloudy;

        return (
          <React.Fragment key={i}>
            {/* Without cleaning (background) */}
            <Rect
              x={x}
              y={10 + barH - hWithout}
              width={barW}
              height={hWithout}
              fill={Colors.danger}
              opacity={0.25}
              rx={1}
            />
            {/* With cleaning (foreground) */}
            <Rect
              x={x + barW * 0.15}
              y={10 + barH - hWith}
              width={barW * 0.7}
              height={hWith}
              fill={cleaned ? Colors.info : storm ? Colors.danger : cloudy ? Colors.gray500 : Colors.amber}
              opacity={0.85}
              rx={1}
            />
            {/* Day label every 5 */}
            {(i + 1) % 5 === 0 && (
              <SvgText x={x + barW / 2} y={BAR_H - 2} fontSize={8} fill={theme.textMuted} textAnchor="middle">
                D{i + 1}
              </SvgText>
            )}
          </React.Fragment>
        );
      })}
    </Svg>
  );

  const renderDustBarChart = () => {
    const dustWith = result.days.map((d) => d.avgDustLoss * 100);
    const dustWithout = baseline.days.map((d) => d.avgDustLoss * 100);
    const maxDust = Math.max(...dustWith, ...dustWithout, 1);

    return (
      <Svg width={BAR_CHART_W} height={BAR_H}>
        {[0, 0.5, 1].map((frac) => {
          const y = 10 + (1 - frac) * (BAR_H - 40);
          return (
            <React.Fragment key={frac}>
              <Line x1={36} y1={y} x2={BAR_CHART_W} y2={y} stroke={theme.border} strokeWidth={1} strokeDasharray="3 3" />
              <SvgText x={32} y={y + 4} fontSize={8} fill={theme.textMuted} textAnchor="end">
                {(frac * maxDust).toFixed(1)}%
              </SvgText>
            </React.Fragment>
          );
        })}
        {result.days.map((_, i) => {
          const x = 38 + i * ((BAR_CHART_W - 40) / 30);
          const hWith = (dustWith[i] / maxDust) * (BAR_H - 40);
          const hWithout = (dustWithout[i] / maxDust) * (BAR_H - 40);
          return (
            <React.Fragment key={i}>
              <Rect x={x} y={10 + (BAR_H - 40) - hWithout} width={barW} height={hWithout} fill={Colors.danger} opacity={0.3} rx={1} />
              <Rect x={x + barW * 0.15} y={10 + (BAR_H - 40) - hWith} width={barW * 0.7} height={hWith} fill={Colors.success} opacity={0.85} rx={1} />
              {(i + 1) % 5 === 0 && (
                <SvgText x={x + barW / 2} y={BAR_H - 2} fontSize={8} fill={theme.textMuted} textAnchor="middle">D{i + 1}</SvgText>
              )}
            </React.Fragment>
          );
        })}
      </Svg>
    );
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.bg }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: theme.text }]}>Reports</Text>

        {/* Summary cards grid */}
        <View style={styles.grid}>
          {stats.map((s, i) => (
            <Animated.View
              key={s.label}
              entering={FadeInDown.duration(400).delay(i * 60)}
              style={styles.statCard}
            >
              <Card padding={Spacing.md} style={{ flex: 1 }}>
                <View style={[styles.statIcon, { backgroundColor: `${s.color}18` }]}>
                  <Ionicons name={s.icon} size={18} color={s.color} />
                </View>
                <Text style={[styles.statVal, { color: s.color }]}>{s.value}</Text>
                <Text style={[styles.statLabel, { color: theme.text }]}>{s.label}</Text>
                <Text style={[styles.statSub, { color: theme.textMuted }]}>{s.sub}</Text>
              </Card>
            </Animated.View>
          ))}
        </View>

        {/* Daily power bar chart */}
        <Animated.View entering={FadeInDown.duration(500).delay(300)}>
          <Card padding={Spacing.md} style={{ marginBottom: Spacing.md }}>
            <SectionTitle text="30-Day Power Output (Wh)" />
            <Text style={[{ color: theme.textMuted, fontSize: Typography.xs, marginBottom: Spacing.sm }]}>
              🟡 With cleaning · 🔴 Without cleaning (faded) · 🔵 Cleaned day
            </Text>
            {renderBarChart()}
          </Card>
        </Animated.View>

        {/* Dust loss bar chart */}
        <Animated.View entering={FadeInDown.duration(500).delay(400)}>
          <Card padding={Spacing.md}>
            <SectionTitle text="Daily Avg Dust Loss (%)" />
            <Text style={[{ color: theme.textMuted, fontSize: Typography.xs, marginBottom: Spacing.sm }]}>
              🟢 With cleaning · 🔴 Without cleaning
            </Text>
            {renderDustBarChart()}
          </Card>
        </Animated.View>

        {/* Sanity check note */}
        <View style={styles.sanityNote}>
          <Ionicons name="information-circle" size={16} color={Colors.info} />
          <Text style={[styles.sanityText, { color: theme.textMuted }]}>
            Expected: ~11.7% avg loss without cleaning, ~2.3% with cleaning, ~10.6% energy gain
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: Spacing.base, paddingBottom: 32 },
  title: { fontSize: Typography['2xl'], fontWeight: '800', marginBottom: Spacing.base },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  statCard: { width: '48%' },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  statVal: { fontSize: Typography.xl, fontWeight: '800' },
  statLabel: { fontSize: Typography.xs, fontWeight: '600', marginTop: 2 },
  statSub: { fontSize: 10, marginTop: 2, lineHeight: 14 },
  sanityNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: 'rgba(10,132,255,0.08)',
    borderRadius: Radius.md,
  },
  sanityText: { fontSize: Typography.xs, flex: 1, lineHeight: 16 },
});
