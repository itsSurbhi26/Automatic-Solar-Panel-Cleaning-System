/**
 * Power Graph Screen
 * - Daily power curve (SVG line chart)
 * - 30-day dust level trend
 * - With/Without cleaning toggle
 * - Cleaning events marked as vertical lines
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import Svg, {
  Path,
  Line,
  Circle as SvgCircle,
  Text as SvgText,
  Rect,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSolarStore } from '../../src/store/useSolarStore';
import { getSimulatorInstance } from '../../src/data/SimulatorDataSource';
import { Card, SectionTitle } from '../../src/components/ui';
import { Colors, Spacing, Typography, Radius } from '../../src/theme';
import { useTheme } from '../../src/theme/useTheme';
import { runFullSimulation, DEFAULT_CONFIG, STEPS_PER_DAY } from '../../src/sim/engine';

const { width } = Dimensions.get('window');
const CHART_W = width - Spacing.base * 2 - Spacing.base * 2;
const CHART_H = 180;
const PAD = { l: 40, r: 16, t: 16, b: 32 };

function buildPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  return points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');
}

function normalizePoints(
  data: number[],
  minV: number,
  maxV: number,
  chartW: number,
  chartH: number,
): { x: number; y: number }[] {
  const range = maxV - minV || 1;
  return data.map((v, i) => ({
    x: PAD.l + (i / Math.max(data.length - 1, 1)) * (chartW - PAD.l - PAD.r),
    y: PAD.t + (1 - (v - minV) / range) * (chartH - PAD.t - PAD.b),
  }));
}

export default function PowerGraphScreen() {
  const theme = useTheme();
  const simState = useSolarStore((s) => s.simState);
  const [showWithCleaning, setShowWithCleaning] = useState(true);
  const [activeTab, setActiveTab] = useState<'power' | 'dust'>('power');

  const sim = getSimulatorInstance();
  const result = simState?.result ?? sim.getSimState().result;

  // Pre-compute no-clean scenario
  const resultNoClean = useMemo(() => {
    return runFullSimulation({
      ...DEFAULT_CONFIG,
      triggerRatio: 999, // never triggers
    });
  }, []);

  // Today's power curve (current day or day 1)
  const currentDay = useSolarStore((s) => s.panelStatus?.day ?? 1);

  const todaySteps = useMemo(() => {
    return result.steps.filter((s) => s.day === currentDay);
  }, [result, currentDay]);

  const todayStepsNC = useMemo(() => {
    return resultNoClean.steps.filter((s) => s.day === currentDay);
  }, [resultNoClean, currentDay]);

  // 30-day daily dust averages
  const dustWithCleaning = result.days.map((d) => d.dustAtMorning * 100);
  const dustNoClean = resultNoClean.days.map((d) => d.dustAtMorning * 100);

  // Daily power (Wh)
  const powerWith = result.days.map((d) => d.totalPowerWh);
  const powerWithout = resultNoClean.days.map((d) => d.totalPowerWh);

  // Cleaning event days
  const cleaningDays = result.days.filter((d) => d.cleaned).map((d) => d.day);

  const renderPowerChart = () => {
    const primaryData = todaySteps.map((s) => s.power);
    const secondaryData = todayStepsNC.map((s) => s.power);
    const allData = [...primaryData, ...secondaryData];
    const minV = 0;
    const maxV = Math.max(...allData, 90);

    const pts1 = normalizePoints(primaryData, minV, maxV, CHART_W, CHART_H);
    const pts2 = normalizePoints(secondaryData, minV, maxV, CHART_W, CHART_H);

    const fillPath1 = pts1.length
      ? `${buildPath(pts1)} L ${pts1[pts1.length - 1].x} ${CHART_H - PAD.b} L ${pts1[0].x} ${CHART_H - PAD.b} Z`
      : '';

    // Y-axis labels
    const yLabels = [0, maxV * 0.5, maxV].map((v) => ({
      val: v.toFixed(0),
      y: PAD.t + (1 - v / maxV) * (CHART_H - PAD.t - PAD.b),
    }));

    // X-axis labels (hours 6, 10, 14, 18)
    const xHours = [6, 10, 14, 18];
    const xLabels = xHours.map((h) => ({
      label: `${h}h`,
      x: PAD.l + ((h / 24) * todaySteps.length / Math.max(todaySteps.length - 1, 1)) * (CHART_W - PAD.l - PAD.r),
    }));

    return (
      <Svg width={CHART_W} height={CHART_H}>
        <Defs>
          <LinearGradient id="fill1" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={Colors.amber} stopOpacity="0.35" />
            <Stop offset="1" stopColor={Colors.amber} stopOpacity="0.02" />
          </LinearGradient>
        </Defs>
        {/* Grid lines */}
        {yLabels.map((l) => (
          <React.Fragment key={l.val}>
            <Line
              x1={PAD.l}
              y1={l.y}
              x2={CHART_W - PAD.r}
              y2={l.y}
              stroke={theme.border}
              strokeWidth={1}
              strokeDasharray="4 4"
            />
            <SvgText x={PAD.l - 4} y={l.y + 4} fontSize={9} fill={theme.textMuted} textAnchor="end">
              {l.val}W
            </SvgText>
          </React.Fragment>
        ))}
        {/* X labels */}
        {xLabels.map((l) => (
          <SvgText key={l.label} x={l.x} y={CHART_H - 4} fontSize={9} fill={theme.textMuted} textAnchor="middle">
            {l.label}
          </SvgText>
        ))}
        {/* Fill area */}
        {pts1.length > 0 && <Path d={fillPath1} fill="url(#fill1)" />}
        {/* Without cleaning line */}
        {showWithCleaning && pts2.length > 0 && (
          <Path d={buildPath(pts2)} stroke={Colors.gray500} strokeWidth={1.5} fill="none" strokeDasharray="5 3" />
        )}
        {/* With cleaning line */}
        {pts1.length > 0 && (
          <Path d={buildPath(pts1)} stroke={Colors.amber} strokeWidth={2.5} fill="none" strokeLinecap="round" />
        )}
      </Svg>
    );
  };

  const renderDustChart = () => {
    const data1 = dustWithCleaning;
    const data2 = dustNoClean;
    const allData = [...data1, ...data2];
    const minV = 0;
    const maxV = Math.max(...allData, 5);
    const days = data1.length;

    const pts1 = normalizePoints(data1, minV, maxV, CHART_W, CHART_H);
    const pts2 = normalizePoints(data2, minV, maxV, CHART_W, CHART_H);

    const xScale = (day: number) =>
      PAD.l + ((day - 1) / Math.max(days - 1, 1)) * (CHART_W - PAD.l - PAD.r);

    const yLabels = [0, maxV * 0.5, maxV].map((v) => ({
      val: v.toFixed(1),
      y: PAD.t + (1 - v / maxV) * (CHART_H - PAD.t - PAD.b),
    }));

    return (
      <Svg width={CHART_W} height={CHART_H}>
        <Defs>
          <LinearGradient id="fill2" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={Colors.danger} stopOpacity="0.3" />
            <Stop offset="1" stopColor={Colors.danger} stopOpacity="0.02" />
          </LinearGradient>
          <LinearGradient id="fill3" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={Colors.success} stopOpacity="0.3" />
            <Stop offset="1" stopColor={Colors.success} stopOpacity="0.02" />
          </LinearGradient>
        </Defs>
        {/* Grid */}
        {yLabels.map((l) => (
          <React.Fragment key={l.val}>
            <Line x1={PAD.l} y1={l.y} x2={CHART_W - PAD.r} y2={l.y} stroke={theme.border} strokeWidth={1} strokeDasharray="4 4" />
            <SvgText x={PAD.l - 4} y={l.y + 4} fontSize={9} fill={theme.textMuted} textAnchor="end">{l.val}%</SvgText>
          </React.Fragment>
        ))}
        {/* Cleaning event vertical lines */}
        {cleaningDays.map((d) => (
          <React.Fragment key={d}>
            <Line
              x1={xScale(d)}
              y1={PAD.t}
              x2={xScale(d)}
              y2={CHART_H - PAD.b}
              stroke={Colors.success}
              strokeWidth={1}
              strokeOpacity={0.6}
              strokeDasharray="3 3"
            />
            <SvgCircle cx={xScale(d)} cy={PAD.t} r={3} fill={Colors.success} />
          </React.Fragment>
        ))}
        {/* No-clean area + line */}
        {showWithCleaning && pts2.length > 0 && (
          <>
            <Path
              d={`${buildPath(pts2)} L ${pts2[pts2.length - 1].x} ${CHART_H - PAD.b} L ${pts2[0].x} ${CHART_H - PAD.b} Z`}
              fill="url(#fill2)"
            />
            <Path d={buildPath(pts2)} stroke={Colors.danger} strokeWidth={2} fill="none" strokeDasharray="5 3" />
          </>
        )}
        {/* With-clean area + line */}
        {pts1.length > 0 && (
          <>
            <Path
              d={`${buildPath(pts1)} L ${pts1[pts1.length - 1].x} ${CHART_H - PAD.b} L ${pts1[0].x} ${CHART_H - PAD.b} Z`}
              fill="url(#fill3)"
            />
            <Path d={buildPath(pts1)} stroke={Colors.success} strokeWidth={2} fill="none" />
          </>
        )}
        {/* X labels: days 1, 10, 20, 30 */}
        {[1, 10, 20, 30].map((d) => (
          <SvgText key={d} x={xScale(d)} y={CHART_H - 4} fontSize={9} fill={theme.textMuted} textAnchor="middle">
            D{d}
          </SvgText>
        ))}
      </Svg>
    );
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.bg }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: theme.text }]}>Power Graph</Text>

        {/* Tab switcher */}
        <View style={[styles.tabRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {(['power', 'dust'] as const).map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setActiveTab(t)}
              style={[
                styles.tabBtn,
                activeTab === t && { backgroundColor: theme.primary },
              ]}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.tabBtnText,
                { color: activeTab === t ? Colors.white : theme.textSecondary },
              ]}>
                {t === 'power' ? 'Power Curve' : 'Dust Level'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Toggle */}
        <TouchableOpacity
          onPress={() => setShowWithCleaning(!showWithCleaning)}
          style={[styles.toggleRow, { borderColor: theme.border }]}
          activeOpacity={0.8}
        >
          <View style={[styles.toggleDot, { backgroundColor: showWithCleaning ? theme.primary : theme.border }]} />
          <Text style={[styles.toggleText, { color: theme.textSecondary }]}>
            Show comparison (without cleaning)
          </Text>
        </TouchableOpacity>

        {/* Chart */}
        <Animated.View entering={FadeIn.duration(400)}>
          <Card style={styles.chartCard} padding={Spacing.md}>
            <Text style={[styles.chartTitle, { color: theme.text }]}>
              {activeTab === 'power' ? `Day ${currentDay} Power Output` : '30-Day Dust Trend'}
            </Text>
            <Text style={[styles.chartSub, { color: theme.textSecondary }]}>
              {activeTab === 'power' ? 'Watts (W)' : 'Dust level %'}
              {showWithCleaning ? ' · Dashed = without cleaning' : ''}
            </Text>
            <View style={{ marginTop: Spacing.sm }}>
              {activeTab === 'power' ? renderPowerChart() : renderDustChart()}
            </View>
          </Card>
        </Animated.View>

        {/* Legend */}
        <View style={styles.legend}>
          <LegendItem color={activeTab === 'power' ? Colors.amber : Colors.success} label="With Cleaning" />
          {showWithCleaning && (
            <LegendItem
              color={activeTab === 'power' ? Colors.gray500 : Colors.danger}
              label="Without Cleaning"
              dashed
            />
          )}
          {activeTab === 'dust' && (
            <LegendItem color={Colors.success} label="Cleaning event" dot />
          )}
        </View>

        {/* Stats summary */}
        <Card style={{ marginTop: Spacing.sm }} padding={Spacing.base}>
          <SectionTitle text="Scenario Summary" />
          <InfoRow label="Cleanings performed" value={`${result.cleanings}`} theme={theme} />
          <InfoRow
            label="Avg dust loss (with)"
            value={`${(result.avgDustLossWith * 100).toFixed(1)}%`}
            valueColor={Colors.success}
            theme={theme}
          />
          <InfoRow
            label="Avg dust loss (without)"
            value={`${(result.avgDustLossWithout * 100).toFixed(1)}%`}
            valueColor={Colors.danger}
            theme={theme}
          />
          <InfoRow
            label="Energy gain"
            value={`${result.energyGainPct.toFixed(1)}%`}
            valueColor={Colors.amber}
            theme={theme}
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function LegendItem({
  color,
  label,
  dashed,
  dot,
}: { color: string; label: string; dashed?: boolean; dot?: boolean }) {
  return (
    <View style={styles.legendItem}>
      {dot ? (
        <View style={[styles.legendDot, { backgroundColor: color }]} />
      ) : (
        <View style={[styles.legendLine, { borderColor: color, borderStyle: dashed ? 'dashed' : 'solid' }]} />
      )}
      <Text style={{ color: Colors.gray400, fontSize: Typography.xs }}>{label}</Text>
    </View>
  );
}

function InfoRow({ label, value, valueColor, theme }: { label: string; value: string; valueColor?: string; theme: any }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 }}>
      <Text style={{ color: theme.textSecondary, fontSize: Typography.sm }}>{label}</Text>
      <Text style={{ color: valueColor ?? theme.text, fontSize: Typography.sm, fontWeight: '700' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: Spacing.base, paddingBottom: 24 },
  title: { fontSize: Typography['2xl'], fontWeight: '800', marginBottom: Spacing.base },
  tabRow: {
    flexDirection: 'row',
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tabBtnText: { fontSize: Typography.sm, fontWeight: '700' },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  toggleDot: { width: 14, height: 14, borderRadius: 7 },
  toggleText: { fontSize: Typography.sm },
  chartCard: {},
  chartTitle: { fontSize: Typography.base, fontWeight: '700' },
  chartSub: { fontSize: Typography.xs, marginTop: 2, marginBottom: 4 },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendLine: { width: 24, height: 0, borderTopWidth: 2 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
});
