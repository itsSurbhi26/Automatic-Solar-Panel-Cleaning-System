/**
 * CircularGauge – animated power ratio gauge using react-native-svg
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Colors, Typography } from '../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CircularGaugeProps {
  ratio: number;       // 0.0 – 1.0
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
}

export function CircularGauge({
  ratio,
  size = 220,
  strokeWidth = 16,
  label,
  sublabel,
}: CircularGaugeProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = useSharedValue(ratio);

  useEffect(() => {
    progress.value = withTiming(ratio, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [ratio]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  // Color based on ratio
  const gaugeColor =
    ratio >= 0.95
      ? Colors.success
      : ratio >= 0.85
        ? Colors.warning
        : Colors.danger;

  const pct = Math.round(ratio * 100);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={gaugeColor} stopOpacity="0.7" />
            <Stop offset="1" stopColor={gaugeColor} stopOpacity="1" />
          </LinearGradient>
        </Defs>
        {/* Background track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(46,117,182,0.2)"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
          transform={`rotate(-90, ${size / 2}, ${size / 2})`}
        />
      </Svg>

      {/* Center content */}
      <View style={styles.center}>
        <Text style={[styles.pctText, { color: gaugeColor }]}>{pct}%</Text>
        {label && <Text style={styles.label}>{label}</Text>}
        {sublabel && <Text style={styles.sublabel}>{sublabel}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pctText: {
    fontSize: Typography['4xl'],
    fontWeight: '800',
    letterSpacing: -1,
  },
  label: {
    fontSize: Typography.sm,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    marginTop: 2,
  },
  sublabel: {
    fontSize: Typography.xs,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 1,
  },
});
