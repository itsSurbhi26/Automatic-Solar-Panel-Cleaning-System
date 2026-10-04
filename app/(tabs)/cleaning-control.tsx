/**
 * Cleaning Control Screen
 * - Auto/Manual switch
 * - "Clean Now" button with confirm dialog (storm/cloudy warning)
 * - Trigger-level slider
 * - Check-time picker
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  Modal,
  SafeAreaView,
  Platform,
} from 'react-native';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSolarStore } from '../../src/store/useSolarStore';
import { getSimulatorInstance } from '../../src/data/SimulatorDataSource';
import { Card, SectionTitle, PrimaryButton, InfoRow, Divider } from '../../src/components/ui';
import { Colors, Spacing, Typography, Radius } from '../../src/theme';
import { useTheme } from '../../src/theme/useTheme';

export default function CleaningControlScreen() {
  const theme = useTheme();
  const { settings, updateSettings, panelStatus, addAlert } = useSolarStore();
  const [showConfirm, setShowConfirm] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const sim = getSimulatorInstance();

  const isManual = !settings.autoClean;
  const weather = panelStatus?.weather ?? 'Clear';
  const isStormy = weather === 'Dust Storm';
  const isCloudy = weather === 'Cloudy';
  const isInclement = isStormy || isCloudy;
  const dust = panelStatus?.dust ?? 0;
  const ratio = panelStatus?.powerRatio ?? 1;

  // Slider for trigger ratio
  const [triggerDraft, setTriggerDraft] = useState(settings.triggerRatio);

  const handleCleanNow = () => {
    if (!settings.isAuthenticated || settings.username === 'guest') {
      Alert.alert('Permission Denied', 'Guest users cannot send commands. Please log in.');
      return;
    }
    setShowConfirm(true);
  };

  const confirmClean = async () => {
    setShowConfirm(false);
    setCleaning(true);
    await sim.sendCommand({ type: 'CLEAN_NOW' });
    addAlert({ type: 'cleaning_done', message: `Manual clean triggered on Day ${panelStatus?.day}` });
    setTimeout(() => setCleaning(false), 2000);
  };

  const applyTrigger = () => {
    updateSettings({ triggerRatio: triggerDraft });
    sim.sendCommand({ type: 'SET_TRIGGER', payload: { trigger: triggerDraft } });
  };

  // Thumb position for manual slider
  const SLIDER_W = 280;
  const thumbX = useSharedValue((settings.triggerRatio - 0.7) / 0.3 * SLIDER_W);
  const thumbStyle = useAnimatedStyle(() => ({ transform: [{ translateX: thumbX.value }] }));

  const renderSlider = () => {
    const pct = ((triggerDraft - 0.7) / 0.3) * 100;
    return (
      <View style={{ marginVertical: Spacing.md }}>
        <View style={styles.sliderTrack}>
          <View style={[styles.sliderFill, { width: `${pct}%`, backgroundColor: theme.primary }]} />
          <TouchableOpacity
            style={[styles.sliderThumb, { left: `${pct}%`, backgroundColor: theme.primary }]}
            // Increment/decrement on press since we can't do native slider in RN without extra lib
          />
        </View>
        <View style={styles.sliderRow}>
          {[0.70, 0.75, 0.80, 0.85, 0.90, 0.95, 1.00].map((v) => (
            <TouchableOpacity
              key={v}
              onPress={() => setTriggerDraft(v)}
              style={[
                styles.sliderPip,
                triggerDraft === v && { backgroundColor: theme.primary },
              ]}
            >
              <Text style={[styles.sliderPipLabel, { color: triggerDraft === v ? Colors.white : theme.textSecondary }]}>
                {(v * 100).toFixed(0)}%
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.bg }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: theme.text }]}>Cleaning Control</Text>

        {/* Status card */}
        <Animated.View entering={FadeInDown.duration(400)}>
          <Card style={{ marginBottom: Spacing.md }} padding={Spacing.base}>
            <SectionTitle text="Panel Status" />
            <InfoRow label="Dust Level" value={`${(dust * 100).toFixed(1)}%`}
              valueColor={dust > 0.1 ? Colors.danger : Colors.success} />
            <InfoRow label="Power Ratio" value={`${(ratio * 100).toFixed(1)}%`}
              valueColor={ratio < settings.triggerRatio ? Colors.warning : Colors.success} />
            <InfoRow label="Weather" value={weather}
              valueColor={isStormy ? Colors.danger : isCloudy ? Colors.gray400 : Colors.success} />
            <InfoRow label="Current Mode" value={settings.autoClean ? 'Auto' : 'Manual'} />
          </Card>
        </Animated.View>

        {/* Auto / Manual switch */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)}>
          <Card style={{ marginBottom: Spacing.md }} padding={Spacing.base}>
            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.switchLabel, { color: theme.text }]}>Automatic Cleaning</Text>
                <Text style={[styles.switchSub, { color: theme.textSecondary }]}>
                  {settings.autoClean
                    ? 'System cleans automatically at 08:00 when ratio < trigger'
                    : 'Manual mode: use "Clean Now" button'}
                </Text>
              </View>
              <Switch
                value={settings.autoClean}
                onValueChange={(v) => updateSettings({ autoClean: v })}
                trackColor={{ false: Colors.gray700, true: `${Colors.skyBlue}80` }}
                thumbColor={settings.autoClean ? Colors.skyBlue : Colors.gray500}
              />
            </View>
          </Card>
        </Animated.View>

        {/* Trigger level */}
        <Animated.View entering={FadeInDown.duration(400).delay(150)}>
          <Card style={{ marginBottom: Spacing.md }} padding={Spacing.base}>
            <SectionTitle text="Trigger Threshold" />
            <View style={styles.triggerHeader}>
              <Text style={[styles.triggerVal, { color: theme.text }]}>
                {(triggerDraft * 100).toFixed(0)}%
              </Text>
              <Text style={[styles.triggerSub, { color: theme.textSecondary }]}>
                Clean when ratio falls below this level
              </Text>
            </View>
            {renderSlider()}
            {triggerDraft !== settings.triggerRatio && (
              <PrimaryButton
                label="Apply Threshold"
                onPress={applyTrigger}
                variant="secondary"
                style={{ marginTop: Spacing.sm }}
              />
            )}
          </Card>
        </Animated.View>

        {/* Check time */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)}>
          <Card style={{ marginBottom: Spacing.md }} padding={Spacing.base}>
            <SectionTitle text="Daily Check Time" />
            <View style={styles.timeRow}>
              {[6, 7, 8, 9, 10].map((h) => (
                <TouchableOpacity
                  key={h}
                  onPress={() => updateSettings({ checkHour: h })}
                  style={[
                    styles.timePip,
                    {
                      backgroundColor: settings.checkHour === h ? theme.primary : theme.surface,
                      borderColor: settings.checkHour === h ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <Text style={{ color: settings.checkHour === h ? Colors.white : theme.textSecondary, fontWeight: '700', fontSize: Typography.sm }}>
                    {String(h).padStart(2, '0')}:00
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        </Animated.View>

        {/* Manual Clean Now button */}
        <Animated.View entering={FadeInDown.duration(400).delay(250)}>
          {isInclement && (
            <View style={styles.warningBanner}>
              <Ionicons name="warning" size={18} color={Colors.warning} />
              <Text style={styles.warningText}>
                {isStormy ? '⚠ Dust storm active – cleaning not recommended' : '⚠ Cloudy day – efficiency reduced'}
              </Text>
            </View>
          )}
          <PrimaryButton
            label={cleaning ? 'Cleaning…' : 'Clean Now'}
            onPress={handleCleanNow}
            loading={cleaning}
            variant={isInclement ? 'danger' : 'primary'}
            icon={<Ionicons name="water" size={18} color={Colors.white} />}
          />
        </Animated.View>
      </ScrollView>

      {/* Confirm dialog */}
      <Modal transparent visible={showConfirm} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Ionicons
              name={isInclement ? 'warning' : 'water'}
              size={36}
              color={isInclement ? Colors.warning : Colors.info}
            />
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {isInclement ? 'Proceed Despite Conditions?' : 'Confirm Cleaning'}
            </Text>
            <Text style={[styles.modalBody, { color: theme.textSecondary }]}>
              {isInclement
                ? `${weather} conditions detected. The system may not clean effectively. Are you sure?`
                : `This will run the pump and clean the panel (${(dust * 100).toFixed(1)}% dust). Confirm?`}
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setShowConfirm(false)}
                style={[styles.modalBtn, { backgroundColor: theme.surface }]}
              >
                <Text style={{ color: theme.textSecondary, fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmClean}
                style={[styles.modalBtn, { backgroundColor: isInclement ? Colors.warning : Colors.skyBlue }]}
              >
                <Text style={{ color: Colors.white, fontWeight: '700' }}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: Spacing.base, paddingBottom: 32 },
  title: { fontSize: Typography['2xl'], fontWeight: '800', marginBottom: Spacing.base },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  switchLabel: { fontSize: Typography.base, fontWeight: '700', marginBottom: 2 },
  switchSub: { fontSize: Typography.xs, lineHeight: 16 },
  triggerHeader: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm, marginBottom: 4 },
  triggerVal: { fontSize: Typography['3xl'], fontWeight: '800' },
  triggerSub: { fontSize: Typography.xs, flex: 1 },
  sliderTrack: {
    height: 6,
    backgroundColor: 'rgba(46,117,182,0.2)',
    borderRadius: 3,
    overflow: 'visible',
    position: 'relative',
  },
  sliderFill: { height: '100%', borderRadius: 3 },
  sliderThumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    top: -7,
    marginLeft: -10,
  },
  sliderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    flexWrap: 'wrap',
    gap: 4,
  },
  sliderPip: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(46,117,182,0.08)',
  },
  sliderPipLabel: { fontSize: 10, fontWeight: '700' },
  timeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: Spacing.sm },
  timePip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,159,10,0.1)',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,159,10,0.25)',
  },
  warningText: { color: Colors.warning, fontSize: Typography.sm, flex: 1 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  modalCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    gap: Spacing.sm,
  },
  modalTitle: { fontSize: Typography.lg, fontWeight: '700', textAlign: 'center' },
  modalBody: { fontSize: Typography.sm, textAlign: 'center', lineHeight: 20 },
  modalButtons: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm, width: '100%' },
  modalBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
});
