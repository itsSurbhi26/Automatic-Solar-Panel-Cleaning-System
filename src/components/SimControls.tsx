/**
 * SimControls – playback controls for the demo simulator
 * (play/pause, speed, day jump, reset)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, Typography } from '../theme';
import { useTheme } from '../theme/useTheme';
import type { PlaySpeed } from '../data/SimulatorDataSource';

interface SimControlsProps {
  isPlaying: boolean;
  speed: PlaySpeed;
  currentDay: number;
  currentStep: number;
  totalSteps: number;
  onPlay: () => void;
  onPause: () => void;
  onSetSpeed: (s: PlaySpeed) => void;
  onJumpToDay: (day: number) => void;
  onReset: () => void;
}

const SPEEDS: PlaySpeed[] = [1, 10, 100];
const SPEED_LABELS: Record<PlaySpeed, string> = { 1: '1×', 10: '10×', 100: '100×' };

export function SimControls({
  isPlaying,
  speed,
  currentDay,
  currentStep,
  totalSteps,
  onPlay,
  onPause,
  onSetSpeed,
  onJumpToDay,
  onReset,
}: SimControlsProps) {
  const theme = useTheme();
  const [jumpInput, setJumpInput] = useState('');
  const progress = currentStep / Math.max(totalSteps - 1, 1);

  const handleJump = () => {
    const d = parseInt(jumpInput, 10);
    if (!isNaN(d) && d >= 1 && d <= 30) {
      onJumpToDay(d);
      setJumpInput('');
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
        },
      ]}
    >
      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${progress * 100}%`, backgroundColor: theme.accent },
          ]}
        />
      </View>

      <View style={styles.row}>
        {/* Play/Pause */}
        <TouchableOpacity
          onPress={isPlaying ? onPause : onPlay}
          style={[styles.playBtn, { backgroundColor: theme.primary }]}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={20}
            color={Colors.white}
          />
        </TouchableOpacity>

        {/* Speed buttons */}
        <View style={styles.speedRow}>
          {SPEEDS.map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => onSetSpeed(s)}
              style={[
                styles.speedBtn,
                {
                  backgroundColor:
                    speed === s
                      ? theme.primary
                      : 'transparent',
                  borderColor: speed === s ? theme.primary : theme.border,
                },
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={{
                  color: speed === s ? Colors.white : theme.textSecondary,
                  fontSize: Typography.xs,
                  fontWeight: '700',
                }}
              >
                {SPEED_LABELS[s]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Day jump */}
        <View style={styles.jumpRow}>
          <TextInput
            value={jumpInput}
            onChangeText={setJumpInput}
            placeholder="Day"
            placeholderTextColor={theme.textMuted}
            keyboardType="number-pad"
            style={[
              styles.jumpInput,
              { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface },
            ]}
            returnKeyType="go"
            onSubmitEditing={handleJump}
            maxLength={2}
          />
          <TouchableOpacity
            onPress={handleJump}
            style={[styles.jumpBtn, { backgroundColor: theme.accent }]}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-forward" size={14} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Reset */}
        <TouchableOpacity onPress={onReset} style={styles.resetBtn} activeOpacity={0.7}>
          <Ionicons name="refresh" size={18} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.dayLabel, { color: theme.textSecondary }]}>
        Day {currentDay} / 30
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.sm,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
  },
  progressTrack: {
    height: 3,
    backgroundColor: 'rgba(46,117,182,0.2)',
    borderRadius: 2,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedRow: {
    flexDirection: 'row',
    gap: 4,
    flex: 1,
  },
  speedBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  jumpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  jumpInput: {
    width: 44,
    height: 34,
    borderRadius: Radius.sm,
    borderWidth: 1,
    textAlign: 'center',
    fontSize: Typography.sm,
    fontWeight: '600',
    paddingHorizontal: 4,
  },
  jumpBtn: {
    width: 30,
    height: 30,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetBtn: {
    padding: 6,
  },
  dayLabel: {
    fontSize: Typography.xs,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
  },
});
