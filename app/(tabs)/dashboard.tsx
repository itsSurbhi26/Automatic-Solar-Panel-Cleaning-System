/**
 * Dashboard Screen
 * - Circular gauge for power ratio
 * - Stat cards: power, dust, weather, last clean, next check
 * - Status chip
 * - Animated pump indicator while cleaning
 * - Sim controls at bottom
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSolarStore } from '../../src/store/useSolarStore';
import { getSimulatorInstance } from '../../src/data/SimulatorDataSource';
import { CircularGauge } from '../../src/components/CircularGauge';
import { SimControls } from '../../src/components/SimControls';
import { Card, StatusChip, SectionTitle } from '../../src/components/ui';
import { Colors, Spacing, Typography, Radius } from '../../src/theme';
import { useTheme } from '../../src/theme/useTheme';
import type { PlaySpeed } from '../../src/data/SimulatorDataSource';
import { TOTAL_STEPS } from '../../src/sim/engine';

const { width } = Dimensions.get('window');

function weatherIcon(w: string): keyof typeof Ionicons.glyphMap {
  if (w === 'Dust Storm') return 'warning';
  if (w === 'Cloudy') return 'cloud';
  return 'sunny';
}

function statusVariant(s: string) {
  if (s === 'Clean') return 'success' as const;
  if (s === 'Cleaning') return 'info' as const;
  if (s === 'Dusty') return 'warning' as const;
  return 'neutral' as const;
}

export default function DashboardScreen() {
  const theme = useTheme();
  const panelStatus = useSolarStore((s) => s.panelStatus);
  const simState = useSolarStore((s) => s.simState);
  const sim = getSimulatorInstance();

  // Pump animation
  const pumpRotate = useSharedValue(0);
  const pumpScale = useSharedValue(1);
  const dropY = useSharedValue(0);
  const dropOpacity = useSharedValue(0);

  useEffect(() => {
    if (panelStatus?.cleaning) {
      pumpRotate.value = withRepeat(
        withTiming(360, { duration: 800, easing: Easing.linear }),
        -1,
        false,
      );
      dropY.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 0 }),
          withTiming(24, { duration: 500, easing: Easing.out(Easing.quad) }),
        ),
        -1,
        false,
      );
      dropOpacity.value = withRepeat(
        withSequence(withTiming(1, { duration: 100 }), withTiming(0, { duration: 400 })),
        -1,
        false,
      );
    } else {
      pumpRotate.value = withTiming(0, { duration: 300 });
      dropY.value = 0;
      dropOpacity.value = 0;
    }
  }, [panelStatus?.cleaning]);

  const pumpStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${pumpRotate.value}deg` }],
  }));
  const dropStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: dropY.value }],
    opacity: dropOpacity.value,
  }));

  const sim_state = simState;
  const isPlaying = sim_state?.isPlaying ?? false;
  const speed = (sim_state?.speed ?? 1) as PlaySpeed;
  const currentStep = sim_state?.currentStep ?? 0;
  const currentDay = panelStatus?.day ?? 1;

  const ratio = panelStatus?.powerRatio ?? 1;
  const power = panelStatus?.power ?? 0;
  const dust = panelStatus?.dust ?? 0;
  const weather = panelStatus?.weather ?? 'Clear';
  const status = panelStatus?.status ?? 'Monitoring';
  const hour = panelStatus?.hour ?? 0;

  const formatHour = (h: number) => {
    const hh = Math.floor(h);
    const mm = Math.round((h - hh) * 60);
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.bg }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Dashboard</Text>
            <Text style={[styles.headerSub, { color: theme.textSecondary }]}>
              Day {currentDay} · {formatHour(hour)}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <StatusChip label={status} variant={statusVariant(status)} />
          </View>
        </View>

        {/* Main gauge card */}
        <Animated.View entering={FadeIn.duration(600)}>
          <Card style={styles.gaugeCard} padding={Spacing.xl}>
            {/* Cleaning animation overlay */}
            {panelStatus?.cleaning && (
              <View style={styles.cleaningBanner}>
                <Animated.View style={pumpStyle}>
                  <Ionicons name="sync" size={20} color={Colors.info} />
                </Animated.View>
                <Text style={styles.cleaningText}>Cleaning in progress…</Text>
                <Animated.View style={[styles.drop, dropStyle]}>
                  <Ionicons name="water" size={16} color={Colors.skyBlueLight} />
                </Animated.View>
              </View>
            )}

            <View style={styles.gaugeWrap}>
              <CircularGauge
                ratio={ratio}
                size={200}
                label="Power Ratio"
                sublabel="P / P_ideal"
              />
            </View>

            {/* Sub stats row */}
            <View style={styles.subStats}>
              <View style={styles.subStat}>
                <Ionicons name="flash" size={18} color={Colors.amber} />
                <Text style={[styles.subStatVal, { color: theme.text }]}>
                  {power.toFixed(1)} W
                </Text>
                <Text style={[styles.subStatLabel, { color: theme.textSecondary }]}>Power</Text>
              </View>
              <View style={[styles.subStatDivider, { backgroundColor: theme.border }]} />
              <View style={styles.subStat}>
                <Ionicons name="layers" size={18} color={Colors.warning} />
                <Text style={[styles.subStatVal, { color: theme.text }]}>
                  {(dust * 100).toFixed(1)}%
                </Text>
                <Text style={[styles.subStatLabel, { color: theme.textSecondary }]}>Dust</Text>
              </View>
              <View style={[styles.subStatDivider, { backgroundColor: theme.border }]} />
              <View style={styles.subStat}>
                <Ionicons name={weatherIcon(weather)} size={18} color={
                  weather === 'Dust Storm' ? Colors.danger :
                  weather === 'Cloudy' ? Colors.gray400 :
                  Colors.amber
                } />
                <Text style={[styles.subStatVal, { color: theme.text, fontSize: Typography.sm }]}>
                  {weather}
                </Text>
                <Text style={[styles.subStatLabel, { color: theme.textSecondary }]}>Weather</Text>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Info cards grid */}
        <Animated.View entering={FadeInDown.duration(500).delay(150)} style={styles.grid}>
          <InfoCard
            theme={theme}
            icon="time-outline"
            iconColor={Colors.skyBlue}
            label="Next Check"
            value="08:00"
            sub="Daily"
          />
          <InfoCard
            theme={theme}
            icon="sparkles-outline"
            iconColor={Colors.success}
            label="Last Cleaned"
            value={panelStatus?.lastCleanedDay != null ? `Day ${panelStatus.lastCleanedDay}` : 'Never'}
            sub={panelStatus?.lastCleanedDay != null ? '' : 'No cleanings yet'}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(250)} style={styles.grid}>
          <InfoCard
            theme={theme}
            icon="sunny-outline"
            iconColor={Colors.amber}
            label="Irradiance"
            value={`${(panelStatus?.G ?? 0).toFixed(0)} W/m²`}
            sub="Solar input"
          />
          <InfoCard
            theme={theme}
            icon="trending-up-outline"
            iconColor={Colors.info}
            label="Ideal Power"
            value={`${(87 * ((panelStatus?.G ?? 0) / 1000)).toFixed(1)} W`}
            sub="Without dust"
          />
        </Animated.View>

        {/* Spacer for sim controls */}
        <View style={{ height: Spacing.base }} />
      </ScrollView>

      {/* Sim Controls (pinned at bottom above tabs) */}
      <SimControls
        isPlaying={isPlaying}
        speed={speed}
        currentDay={currentDay}
        currentStep={currentStep}
        totalSteps={TOTAL_STEPS}
        onPlay={() => sim.play()}
        onPause={() => sim.pause()}
        onSetSpeed={(s) => sim.setSpeed(s)}
        onJumpToDay={(d) => sim.jumpToDay(d)}
        onReset={() => sim.reset()}
      />
    </SafeAreaView>
  );
}

function InfoCard({
  theme,
  icon,
  iconColor,
  label,
  value,
  sub,
}: {
  theme: ReturnType<typeof useTheme>;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <Card style={styles.infoCard} padding={Spacing.base}>
      <View style={[styles.infoCardIcon, { backgroundColor: `${iconColor}18` }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <Text style={[styles.infoCardVal, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.infoCardLabel, { color: theme.textSecondary }]}>{label}</Text>
      {sub ? <Text style={[styles.infoCardSub, { color: theme.textMuted }]}>{sub}</Text> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingTop: Spacing.base, paddingHorizontal: Spacing.base, paddingBottom: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.base,
  },
  headerTitle: { fontSize: Typography['2xl'], fontWeight: '800', letterSpacing: -0.5 },
  headerSub: { fontSize: Typography.sm, marginTop: 2 },
  gaugeCard: { alignItems: 'center', marginBottom: Spacing.md },
  gaugeWrap: { paddingVertical: Spacing.md },
  cleaningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10,132,255,0.12)',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    marginBottom: Spacing.sm,
    gap: 8,
    alignSelf: 'stretch',
  },
  cleaningText: { color: Colors.info, fontWeight: '600', fontSize: Typography.sm, flex: 1 },
  drop: { position: 'absolute', right: 16, top: 4 },
  subStats: { flexDirection: 'row', alignSelf: 'stretch', paddingTop: Spacing.sm },
  subStat: { flex: 1, alignItems: 'center', gap: 4 },
  subStatVal: { fontSize: Typography.md, fontWeight: '700' },
  subStatLabel: { fontSize: Typography.xs, fontWeight: '500' },
  subStatDivider: { width: 1, marginVertical: 4 },
  grid: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  infoCard: { flex: 1 },
  infoCardIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  infoCardVal: { fontSize: Typography.lg, fontWeight: '700' },
  infoCardLabel: { fontSize: Typography.xs, fontWeight: '600', marginTop: 2 },
  infoCardSub: { fontSize: Typography.xs, marginTop: 1 },
});
