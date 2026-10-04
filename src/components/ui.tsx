/**
 * Shared UI components for SolarClean
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StyleProp,
  TouchableOpacity,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors, Radius, Shadows, Spacing, Typography } from '../theme';
import { useTheme } from '../theme/useTheme';
import type { Theme } from '../theme';

// ─────────────────────────────────────────────
// Card
// ─────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: number;
}

export function Card({ children, style, padding = Spacing.base }: CardProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
          padding,
        },
        Shadows.md,
        style,
      ]}
    >
      {children}
    </View>
  );
}

// ─────────────────────────────────────────────
// SectionTitle
// ─────────────────────────────────────────────
export function SectionTitle({ text, style }: { text: string; style?: TextStyle }) {
  const theme = useTheme();
  return (
    <Text style={[{ color: theme.textSecondary, fontSize: Typography.sm, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: Spacing.sm }, style]}>
      {text}
    </Text>
  );
}

// ─────────────────────────────────────────────
// StatusChip
// ─────────────────────────────────────────────
type ChipVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const chipColors: Record<ChipVariant, { bg: string; text: string }> = {
  success: { bg: 'rgba(52,199,89,0.15)', text: Colors.success },
  warning: { bg: 'rgba(255,159,10,0.15)', text: Colors.warning },
  danger: { bg: 'rgba(255,59,48,0.15)', text: Colors.danger },
  info: { bg: 'rgba(10,132,255,0.15)', text: Colors.info },
  neutral: { bg: 'rgba(173,181,189,0.15)', text: Colors.gray500 },
};

export function StatusChip({ label, variant = 'neutral' }: { label: string; variant?: ChipVariant }) {
  const { bg, text } = chipColors[variant];
  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      <View style={[styles.chipDot, { backgroundColor: text }]} />
      <Text style={[styles.chipText, { color: text }]}>{label}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────
// PrimaryButton
// ─────────────────────────────────────────────
interface ButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  style?: ViewStyle;
  icon?: React.ReactNode;
}

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  style,
  icon,
}: ButtonProps) {
  const theme = useTheme();

  const bgColor = {
    primary: theme.primary,
    secondary: theme.accent,
    danger: Colors.danger,
    ghost: 'transparent',
  }[variant];

  const textColor = variant === 'ghost' ? theme.primary : Colors.white;
  const borderStyle =
    variant === 'ghost' ? { borderWidth: 1, borderColor: theme.primary } : {};

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.button,
        { backgroundColor: disabled ? Colors.gray600 : bgColor },
        borderStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={Colors.white} size="small" />
      ) : (
        <>
          {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
          <Text style={[styles.buttonText, { color: textColor }]}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────
// InfoRow
// ─────────────────────────────────────────────
export function InfoRow({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  const theme = useTheme();
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: valueColor ?? theme.text }]}>{value}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────
// Divider
// ─────────────────────────────────────────────
export function Divider({ style }: { style?: ViewStyle }) {
  const theme = useTheme();
  return (
    <View style={[{ height: 1, backgroundColor: theme.border, marginVertical: Spacing.sm }, style]} />
  );
}

// ─────────────────────────────────────────────
// GradientCard (visual accent using nested Views)
// ─────────────────────────────────────────────
export function GlassCard({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return (
    <View
      style={[
        {
          backgroundColor: 'rgba(46,117,182,0.12)',
          borderRadius: Radius.lg,
          borderWidth: 1,
          borderColor: 'rgba(46,117,182,0.3)',
          padding: Spacing.base,
          overflow: 'hidden',
        },
        Shadows.md,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    gap: 6,
  },
  chipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  chipText: {
    fontSize: Typography.xs,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.lg,
    minHeight: 50,
  },
  buttonText: {
    fontSize: Typography.md,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: Typography.sm,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: Typography.sm,
    fontWeight: '700',
  },
});
