/**
 * Tab navigator layout with solar theme styling.
 * Initializes the SimulatorDataSource and wires it to Zustand.
 */

import React, { useEffect, useRef } from 'react';
import { Tabs, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, View, Text, StyleSheet } from 'react-native';
import { useSolarStore, getSimConfigFromSettings } from '../../src/store/useSolarStore';
import { getSimulatorInstance } from '../../src/data/SimulatorDataSource';
import { Colors, Typography } from '../../src/theme';
import { useTheme } from '../../src/theme/useTheme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface TabConfig {
  name: string;
  title: string;
  icon: IoniconsName;
  iconFocused: IoniconsName;
}

const TABS: TabConfig[] = [
  { name: 'dashboard', title: 'Dashboard', icon: 'grid-outline', iconFocused: 'grid' },
  { name: 'power-graph', title: 'Power', icon: 'bar-chart-outline', iconFocused: 'bar-chart' },
  { name: 'cleaning-control', title: 'Clean', icon: 'water-outline', iconFocused: 'water' },
  { name: 'weather', title: 'Weather', icon: 'partly-sunny-outline', iconFocused: 'partly-sunny' },
  { name: 'reports', title: 'Reports', icon: 'document-text-outline', iconFocused: 'document-text' },
  { name: 'alerts', title: 'Alerts', icon: 'notifications-outline', iconFocused: 'notifications' },
];

export default function TabLayout() {
  const theme = useTheme();
  const { settings, setPanelStatus, setSimState, unreadAlerts } = useSolarStore();
  const initialized = useRef(false);
  const isAuthenticated = settings.isAuthenticated;

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated]);

  // Wire simulator to Zustand store on mount
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const config = getSimConfigFromSettings(settings);
    const sim = getSimulatorInstance(config);

    // Listen for playback state changes
    sim.setStateChangeListener((simState) => {
      setSimState(simState);
    });

    // Subscribe to panel status updates
    const unsub = sim.subscribeStatus((status) => {
      setPanelStatus(status);
    });

    // Sync initial state
    setSimState(sim.getSimState() as any);

    return () => {
      unsub();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.tabBar,
          borderTopColor: theme.tabBarBorder,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarLabelStyle: {
          fontSize: Typography.xs,
          fontWeight: '600',
        },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ focused, color, size }) => {
              const isAlerts = tab.name === 'alerts';
              return (
                <View>
                  <Ionicons
                    name={focused ? tab.iconFocused : tab.icon}
                    size={size}
                    color={color}
                  />
                  {isAlerts && unreadAlerts > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {unreadAlerts > 9 ? '9+' : unreadAlerts}
                      </Text>
                    </View>
                  )}
                </View>
              );
            },
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: Colors.danger,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: '800',
  },
});
