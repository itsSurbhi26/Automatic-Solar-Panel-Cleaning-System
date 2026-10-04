/**
 * Alerts & Settings Screen
 * - Notification list (ratio < 0.95, cleaning done, skipped)
 * - Editable dust rate and storm jump
 * - Demo/Live mode toggle
 * - Dark mode toggle
 * - Logout
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
} from 'react-native';
import Animated, { FadeInDown, FadeOutRight, Layout } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSolarStore } from '../../src/store/useSolarStore';
import {
  getSimulatorInstance,
  resetSimulatorInstance,
} from '../../src/data/SimulatorDataSource';
import { getSimConfigFromSettings } from '../../src/store/useSolarStore';
import { Card, SectionTitle, PrimaryButton, Divider } from '../../src/components/ui';
import { Colors, Spacing, Typography, Radius } from '../../src/theme';
import { useTheme } from '../../src/theme/useTheme';
import type { Alert as AlertItem } from '../../src/store/useSolarStore';

const alertIcons: Record<AlertItem['type'], keyof typeof Ionicons.glyphMap> = {
  ratio_low: 'warning',
  cleaning_done: 'water',
  cleaning_skipped: 'alert-circle',
};
const alertColors: Record<AlertItem['type'], string> = {
  ratio_low: Colors.warning,
  cleaning_done: Colors.info,
  cleaning_skipped: Colors.danger,
};

export default function AlertsScreen() {
  const theme = useTheme();
  const { alerts, settings, updateSettings, markAlertsRead, clearAlerts, logout } = useSolarStore();

  const [dustRateDraft, setDustRateDraft] = useState(
    String((settings.dustRatePerDay * 100).toFixed(2)),
  );
  const [stormJumpDraft, setStormJumpDraft] = useState(
    String((settings.stormDustJump * 100).toFixed(1)),
  );

  const applySimSettings = () => {
    const dr = parseFloat(dustRateDraft) / 100;
    const sj = parseFloat(stormJumpDraft) / 100;
    if (isNaN(dr) || isNaN(sj) || dr <= 0 || sj <= 0) {
      Alert.alert('Invalid', 'Please enter valid positive numbers');
      return;
    }
    updateSettings({ dustRatePerDay: dr, stormDustJump: sj });
    const newConfig = getSimConfigFromSettings({ ...settings, dustRatePerDay: dr, stormDustJump: sj });
    resetSimulatorInstance(newConfig);
    Alert.alert('Applied', 'Simulation reset with new parameters');
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.bg }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Alerts & Settings</Text>
          {alerts.length > 0 && (
            <TouchableOpacity onPress={clearAlerts}>
              <Text style={{ color: Colors.danger, fontSize: Typography.sm, fontWeight: '600' }}>
                Clear all
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Alerts list */}
        <SectionTitle text={`Notifications (${alerts.filter((a) => !a.read).length} unread)`} />
        {alerts.length === 0 && (
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>
            No notifications yet. Start the simulation to see alerts.
          </Text>
        )}
        {alerts.slice(0, 20).map((alert, i) => (
          <Animated.View
            key={alert.id}
            entering={FadeInDown.duration(300).delay(i * 30)}
            exiting={FadeOutRight}
            layout={Layout.springify()}
          >
            <Card
              style={[
                styles.alertCard,
                !alert.read ? { borderLeftWidth: 3, borderLeftColor: alertColors[alert.type] } : undefined,
              ]}
              padding={Spacing.md}
            >
              <View style={styles.alertRow}>
                <View style={[styles.alertIcon, { backgroundColor: `${alertColors[alert.type]}18` }]}>
                  <Ionicons name={alertIcons[alert.type]} size={16} color={alertColors[alert.type]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.alertMsg, { color: theme.text }]}>{alert.message}</Text>
                  <Text style={[styles.alertTime, { color: theme.textMuted }]}>
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </Text>
                </View>
                {!alert.read && <View style={[styles.unreadDot, { backgroundColor: alertColors[alert.type] }]} />}
              </View>
            </Card>
          </Animated.View>
        ))}
        {alerts.length > 0 && (
          <TouchableOpacity onPress={markAlertsRead} style={{ marginBottom: Spacing.md }}>
            <Text style={{ color: theme.primary, fontSize: Typography.sm, textAlign: 'center' }}>
              Mark all as read
            </Text>
          </TouchableOpacity>
        )}

        <Divider style={{ marginVertical: Spacing.md }} />

        {/* Display Settings */}
        <SectionTitle text="Display" />
        <Card style={{ marginBottom: Spacing.md }} padding={Spacing.base}>
          <View style={styles.settingRow}>
            <View>
              <Text style={[styles.settingLabel, { color: theme.text }]}>Dark Mode</Text>
              <Text style={[styles.settingSub, { color: theme.textSecondary }]}>
                Toggle between light and dark themes
              </Text>
            </View>
            <Switch
              value={settings.darkMode}
              onValueChange={(v) => updateSettings({ darkMode: v })}
              trackColor={{ false: Colors.gray700, true: `${Colors.skyBlue}80` }}
              thumbColor={settings.darkMode ? Colors.skyBlue : Colors.gray500}
            />
          </View>
        </Card>

        {/* Mode toggle */}
        <SectionTitle text="Data Source" />
        <Card style={{ marginBottom: Spacing.md }} padding={Spacing.base}>
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>
                {settings.liveMode ? '🔴 Live Mode' : '🟢 Demo Mode'}
              </Text>
              <Text style={[styles.settingSub, { color: theme.textSecondary }]}>
                {settings.liveMode
                  ? 'Connected to Firebase/MQTT (not yet implemented)'
                  : 'Using built-in offline simulator'}
              </Text>
            </View>
            <Switch
              value={settings.liveMode}
              onValueChange={(v) => {
                if (v) {
                  Alert.alert(
                    'Live Mode',
                    'Firebase/MQTT integration is not yet configured. Staying in Demo mode.',
                  );
                  return;
                }
                updateSettings({ liveMode: v });
              }}
              trackColor={{ false: Colors.gray700, true: `${Colors.success}80` }}
              thumbColor={settings.liveMode ? Colors.success : Colors.gray500}
            />
          </View>
        </Card>

        {/* Demo simulation params */}
        {!settings.liveMode && (
          <Animated.View entering={FadeInDown.duration(400)}>
            <SectionTitle text="Demo Simulation Parameters" />
            <Card style={{ marginBottom: Spacing.md }} padding={Spacing.base}>
              <Text style={[styles.paramNote, { color: theme.textMuted }]}>
                Changes will reset the simulation
              </Text>

              <View style={styles.paramRow}>
                <Text style={[styles.paramLabel, { color: theme.text }]}>
                  Dust rate (%/day)
                </Text>
                <TextInput
                  value={dustRateDraft}
                  onChangeText={setDustRateDraft}
                  style={[styles.paramInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
                  keyboardType="decimal-pad"
                  returnKeyType="done"
                />
              </View>

              <View style={styles.paramRow}>
                <Text style={[styles.paramLabel, { color: theme.text }]}>
                  Storm dust jump (%)
                </Text>
                <TextInput
                  value={stormJumpDraft}
                  onChangeText={setStormJumpDraft}
                  style={[styles.paramInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
                  keyboardType="decimal-pad"
                  returnKeyType="done"
                />
              </View>

              <PrimaryButton
                label="Apply & Reset Simulation"
                onPress={applySimSettings}
                variant="secondary"
                style={{ marginTop: Spacing.sm }}
              />
            </Card>
          </Animated.View>
        )}

        {/* Account */}
        <SectionTitle text="Account" />
        <Card style={{ marginBottom: Spacing.xl }} padding={Spacing.base}>
          <View style={styles.settingRow}>
            <View>
              <Text style={[styles.settingLabel, { color: theme.text }]}>
                {settings.username || 'Guest'}
              </Text>
              <Text style={[styles.settingSub, { color: theme.textSecondary }]}>
                {settings.username === 'guest' ? 'View-only access' : 'Full control access'}
              </Text>
            </View>
            <Ionicons name="person-circle-outline" size={32} color={theme.primary} />
          </View>
          <Divider />
          <PrimaryButton
            label="Logout"
            onPress={handleLogout}
            variant="ghost"
            style={{ marginTop: Spacing.sm }}
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: Spacing.base, paddingBottom: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.base },
  title: { fontSize: Typography['2xl'], fontWeight: '800' },
  emptyText: { textAlign: 'center', padding: Spacing.xl, fontSize: Typography.sm },
  alertCard: { marginBottom: Spacing.sm, overflow: 'hidden' },
  alertRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  alertIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  alertMsg: { fontSize: Typography.sm, fontWeight: '600', lineHeight: 18 },
  alertTime: { fontSize: Typography.xs, marginTop: 2 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.md },
  settingLabel: { fontSize: Typography.base, fontWeight: '600' },
  settingSub: { fontSize: Typography.xs, marginTop: 2, lineHeight: 16, maxWidth: 240 },
  paramNote: { fontSize: Typography.xs, marginBottom: Spacing.sm, fontStyle: 'italic' },
  paramRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  paramLabel: { fontSize: Typography.sm, fontWeight: '500', flex: 1 },
  paramInput: {
    width: 80,
    height: 36,
    borderRadius: Radius.sm,
    borderWidth: 1,
    textAlign: 'center',
    fontSize: Typography.sm,
    fontWeight: '600',
    paddingHorizontal: 4,
  },
});
