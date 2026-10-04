/**
 * Weather Status Screen
 * - 30-day calendar strip showing cloudy/storm days
 * - Cleaning events and skip reasons
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
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSolarStore } from '../../src/store/useSolarStore';
import { getSimulatorInstance } from '../../src/data/SimulatorDataSource';
import { Card, SectionTitle } from '../../src/components/ui';
import { Colors, Spacing, Typography, Radius } from '../../src/theme';
import { useTheme } from '../../src/theme/useTheme';

const { width } = Dimensions.get('window');
const CELL_W = (width - Spacing.base * 2 - 2) / 7;

type DayType = 'clear' | 'cloudy' | 'storm';

function getDayType(day: number): DayType {
  const storms = [8, 18, 24];
  const clouds = [5, 12, 20, 26];
  if (storms.includes(day)) return 'storm';
  if (clouds.includes(day)) return 'cloudy';
  return 'clear';
}

const dayColors: Record<DayType, { bg: string; text: string; icon: string }> = {
  clear: {
    bg: 'rgba(52,199,89,0.12)',
    text: Colors.success,
    icon: 'sunny',
  },
  cloudy: {
    bg: 'rgba(173,181,189,0.15)',
    text: Colors.gray400,
    icon: 'cloud',
  },
  storm: {
    bg: 'rgba(255,59,48,0.12)',
    text: Colors.danger,
    icon: 'thunderstorm',
  },
};

export default function WeatherScreen() {
  const theme = useTheme();
  const simState = useSolarStore((s) => s.simState);
  const panelStatus = useSolarStore((s) => s.panelStatus);
  const currentDay = panelStatus?.day ?? 1;
  const sim = getSimulatorInstance();
  const result = simState?.result ?? sim.getSimState().result;

  const days = result.days;

  const weekRows: number[][] = [];
  for (let i = 0; i < 30; i += 7) {
    weekRows.push(Array.from({ length: Math.min(7, 30 - i) }, (_, j) => i + j + 1));
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.bg }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: theme.text }]}>Weather Status</Text>

        {/* Legend */}
        <View style={styles.legendRow}>
          {(['clear', 'cloudy', 'storm'] as DayType[]).map((t) => (
            <View key={t} style={styles.legendItem}>
              <Ionicons name={dayColors[t].icon as any} size={14} color={dayColors[t].text} />
              <Text style={[styles.legendLabel, { color: theme.textSecondary }]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </View>
          ))}
          <View style={styles.legendItem}>
            <View style={[styles.cleanedDot, { backgroundColor: Colors.info }]} />
            <Text style={[styles.legendLabel, { color: theme.textSecondary }]}>Cleaned</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.cleanedDot, { backgroundColor: Colors.warning }]} />
            <Text style={[styles.legendLabel, { color: theme.textSecondary }]}>Skipped</Text>
          </View>
        </View>

        {/* Calendar grid */}
        <Animated.View entering={FadeInDown.duration(500)}>
          <Card padding={Spacing.sm} style={{ marginBottom: Spacing.md }}>
            {/* Day headers */}
            <View style={styles.weekHeader}>
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                <View key={i} style={[styles.cell, { width: CELL_W }]}>
                  <Text style={[styles.weekDay, { color: theme.textMuted }]}>{d}</Text>
                </View>
              ))}
            </View>
            {/* Weeks */}
            {weekRows.map((week, wi) => (
              <View key={wi} style={styles.week}>
                {week.map((day) => {
                  const dayType = getDayType(day);
                  const { bg, text, icon } = dayColors[dayType];
                  const dayRecord = days[day - 1];
                  const isCurrent = day === currentDay;
                  const cleaned = dayRecord?.cleaned;
                  const skipped = dayRecord?.cleanSkipped;

                  return (
                    <View
                      key={day}
                      style={[
                        styles.cell,
                        styles.dayCell,
                        { width: CELL_W, backgroundColor: bg },
                        isCurrent && {
                          borderWidth: 2,
                          borderColor: Colors.amber,
                        },
                      ]}
                    >
                      <Text style={[styles.dayNum, { color: text }]}>{day}</Text>
                      <Ionicons name={icon as any} size={12} color={text} />
                      {cleaned && (
                        <View style={[styles.indicator, { backgroundColor: Colors.info }]} />
                      )}
                      {skipped && (
                        <View style={[styles.indicator, { backgroundColor: Colors.warning }]} />
                      )}
                    </View>
                  );
                })}
                {/* Fill empty cells in last row */}
                {week.length < 7 &&
                  Array.from({ length: 7 - week.length }).map((_, i) => (
                    <View key={`empty-${i}`} style={[styles.cell, { width: CELL_W }]} />
                  ))}
              </View>
            ))}
          </Card>
        </Animated.View>

        {/* Skip log */}
        <SectionTitle text="Cleaning Skip Log" style={{ color: theme.textSecondary, marginBottom: Spacing.sm }} />
        {days
          .filter((d) => d.cleanSkipped)
          .map((d) => (
            <Animated.View
              key={d.day}
              entering={FadeInDown.duration(400).delay(d.day * 20)}
            >
              <Card style={styles.skipCard} padding={Spacing.md}>
                <View style={styles.skipRow}>
                  <View style={[styles.skipIcon, { backgroundColor: 'rgba(255,159,10,0.12)' }]}>
                    <Ionicons name="warning" size={16} color={Colors.warning} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.skipTitle, { color: theme.text }]}>Day {d.day}</Text>
                    <Text style={[styles.skipReason, { color: theme.textSecondary }]}>
                      {d.skipReason}
                    </Text>
                    <Text style={[styles.skipDust, { color: theme.textMuted }]}>
                      Dust at 08:00: {(d.dustAtMorning * 100).toFixed(1)}%
                    </Text>
                  </View>
                  <Text style={[styles.skipType, { color: getDayType(d.day) === 'storm' ? Colors.danger : Colors.gray400 }]}>
                    {d.isStormy ? '🌪 Storm' : '☁️ Cloudy'}
                  </Text>
                </View>
              </Card>
            </Animated.View>
          ))}

        {days.filter((d) => d.cleanSkipped).length === 0 && (
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>No skipped cleanings</Text>
        )}

        {/* Successful cleans */}
        <SectionTitle text="Cleaning Events" style={{ color: theme.textSecondary, marginTop: Spacing.md, marginBottom: Spacing.sm }} />
        {days
          .filter((d) => d.cleaned)
          .map((d) => (
            <Card key={d.day} style={styles.skipCard} padding={Spacing.md}>
              <View style={styles.skipRow}>
                <View style={[styles.skipIcon, { backgroundColor: 'rgba(10,132,255,0.12)' }]}>
                  <Ionicons name="water" size={16} color={Colors.info} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.skipTitle, { color: theme.text }]}>Day {d.day} – Cleaned ✓</Text>
                  <Text style={[styles.skipDust, { color: theme.textSecondary }]}>
                    Dust before: {(d.dustAtMorning * 100).toFixed(1)}% → after: {(d.dustAtMorning * 0.02 * 100).toFixed(2)}%
                  </Text>
                </View>
                <Text style={{ color: Colors.success, fontSize: Typography.xs, fontWeight: '700' }}>
                  ✓ Done
                </Text>
              </View>
            </Card>
          ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: Spacing.base, paddingBottom: 24 },
  title: { fontSize: Typography['2xl'], fontWeight: '800', marginBottom: Spacing.base },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: Spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendLabel: { fontSize: Typography.xs, fontWeight: '500' },
  cleanedDot: { width: 8, height: 8, borderRadius: 4 },
  weekHeader: { flexDirection: 'row', marginBottom: 4 },
  week: { flexDirection: 'row', marginBottom: 3 },
  weekDay: { fontSize: 10, fontWeight: '700', textAlign: 'center' },
  cell: { alignItems: 'center', justifyContent: 'center', height: 46 },
  dayCell: {
    borderRadius: Radius.sm,
    paddingVertical: 4,
    position: 'relative',
  },
  dayNum: { fontSize: 11, fontWeight: '700' },
  indicator: {
    position: 'absolute',
    bottom: 3,
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  skipCard: { marginBottom: Spacing.sm },
  skipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  skipIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  skipTitle: { fontSize: Typography.sm, fontWeight: '700', marginBottom: 2 },
  skipReason: { fontSize: Typography.xs },
  skipDust: { fontSize: Typography.xs, marginTop: 2 },
  skipType: { fontSize: Typography.xs, fontWeight: '600' },
  emptyText: { textAlign: 'center', padding: Spacing.xl, fontSize: Typography.sm },
});
