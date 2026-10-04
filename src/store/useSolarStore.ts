/**
 * SolarClean Global Store (Zustand)
 * Central state management for the entire app.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PanelStatus } from '../data/DataSource';
import type { SimState } from '../data/SimulatorDataSource';
import { DEFAULT_CONFIG, SimConfig } from '../sim/engine';

export interface Alert {
  id: string;
  type: 'ratio_low' | 'cleaning_done' | 'cleaning_skipped';
  message: string;
  timestamp: number;
  read: boolean;
}

export interface AppSettings {
  darkMode: boolean;
  liveMode: boolean;     // false = demo/simulator
  autoClean: boolean;
  triggerRatio: number;  // 0.0 – 1.0
  checkHour: number;     // 0–23
  dustRatePerDay: number;
  stormDustJump: number;
  isAuthenticated: boolean;
  username: string;
}

export interface SolarStore {
  // Live panel status (updated by DataSource subscription)
  panelStatus: PanelStatus | null;

  // Simulator playback state
  simState: SimState | null;

  // Alerts / notifications
  alerts: Alert[];
  unreadAlerts: number;

  // App settings (persisted)
  settings: AppSettings;

  // Full history (loaded once)
  historyLoaded: boolean;

  // Actions
  setPanelStatus: (status: PanelStatus) => void;
  setSimState: (state: SimState) => void;
  addAlert: (alert: Omit<Alert, 'id' | 'timestamp' | 'read'>) => void;
  markAlertsRead: () => void;
  clearAlerts: () => void;
  updateSettings: (partial: Partial<AppSettings>) => void;
  setHistoryLoaded: (loaded: boolean) => void;
  login: (username: string) => void;
  logout: () => void;
}

const defaultSettings: AppSettings = {
  darkMode: true,
  liveMode: false,
  autoClean: true,
  triggerRatio: DEFAULT_CONFIG.triggerRatio,
  checkHour: 8,
  dustRatePerDay: DEFAULT_CONFIG.dustRatePerDay,
  stormDustJump: DEFAULT_CONFIG.stormDustJump,
  isAuthenticated: false,
  username: '',
};

export const useSolarStore = create<SolarStore>()(
  persist(
    (set, get) => ({
      panelStatus: null,
      simState: null,
      alerts: [],
      unreadAlerts: 0,
      settings: defaultSettings,
      historyLoaded: false,

      setPanelStatus: (status) => {
        const prev = get().panelStatus;
        set({ panelStatus: status });

        // Auto-generate alerts on state changes
        const { alerts } = get();
        const addAlert = get().addAlert;

        // Ratio below trigger alert
        if (
          status.powerRatio < get().settings.triggerRatio &&
          prev &&
          prev.powerRatio >= get().settings.triggerRatio
        ) {
          addAlert({
            type: 'ratio_low',
            message: `Power ratio dropped to ${(status.powerRatio * 100).toFixed(1)}% (Day ${status.day})`,
          });
        }

        // Cleaning done alert
        if (status.cleaning && prev && !prev.cleaning) {
          addAlert({
            type: 'cleaning_done',
            message: `Panel cleaning completed on Day ${status.day}`,
          });
        }
      },

      setSimState: (state) => set({ simState: state }),

      addAlert: (alert) => {
        const newAlert: Alert = {
          ...alert,
          id: `alert-${Date.now()}-${Math.random()}`,
          timestamp: Date.now(),
          read: false,
        };
        set((s) => ({
          alerts: [newAlert, ...s.alerts].slice(0, 50), // keep last 50
          unreadAlerts: s.unreadAlerts + 1,
        }));
      },

      markAlertsRead: () =>
        set((s) => ({
          alerts: s.alerts.map((a) => ({ ...a, read: true })),
          unreadAlerts: 0,
        })),

      clearAlerts: () => set({ alerts: [], unreadAlerts: 0 }),

      updateSettings: (partial) =>
        set((s) => ({ settings: { ...s.settings, ...partial } })),

      setHistoryLoaded: (loaded) => set({ historyLoaded: loaded }),

      login: (username) =>
        set((s) => ({
          settings: { ...s.settings, isAuthenticated: true, username },
        })),

      logout: () =>
        set((s) => ({
          settings: {
            ...s.settings,
            isAuthenticated: false,
            username: '',
          },
        })),
    }),
    {
      name: 'solarclean-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ settings: state.settings, alerts: state.alerts }),
    },
  ),
);

/** Derived selector: current SimConfig from settings */
export function getSimConfigFromSettings(settings: AppSettings): SimConfig {
  return {
    ...DEFAULT_CONFIG,
    triggerRatio: settings.triggerRatio,
    dustRatePerDay: settings.dustRatePerDay,
    stormDustJump: settings.stormDustJump,
  };
}
