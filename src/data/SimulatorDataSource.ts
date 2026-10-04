/**
 * SimulatorDataSource – implements DataSource using the built-in simulation engine.
 * Fully offline, no network required.
 */

import {
  runFullSimulation,
  SimResult,
  SimConfig,
  DEFAULT_CONFIG,
  STEPS_PER_DAY,
  TOTAL_STEPS,
  CLEAN_EFFICIENCY,
  CLEAN_ENERGY_WH,
} from '../sim/engine';
import type {
  DataSource,
  PanelStatus,
  Command,
  FullHistory,
  WeatherFlag,
  SystemStatus,
  CleaningEvent,
} from './DataSource';

export type PlaySpeed = 1 | 10 | 100;

export interface SimState {
  currentStep: number;   // global step index 0..4319
  isPlaying: boolean;
  speed: PlaySpeed;
  result: SimResult;
  config: SimConfig;
  // Mutable overlay on top of pre-computed result (for manual cleaning)
  manualCleanDust: Map<number, number>; // step → overridden dust value
  lastCleanedDay: number | null;
}

const TICK_MS = 200; // real-time tick interval

export class SimulatorDataSource implements DataSource {
  private state: SimState;
  private subscribers: Set<(s: PanelStatus) => void> = new Set();
  private timer: ReturnType<typeof setInterval> | null = null;
  private onStateChange?: (s: SimState) => void;

  constructor(config: SimConfig = DEFAULT_CONFIG) {
    const result = runFullSimulation(config);
    this.state = {
      currentStep: 0,
      isPlaying: false,
      speed: 1,
      result,
      config,
      manualCleanDust: new Map(),
      lastCleanedDay: null,
    };
  }

  /** Register a callback fired on every simState update (for Zustand sync) */
  setStateChangeListener(cb: (s: SimState) => void) {
    this.onStateChange = cb;
  }

  // ── Playback controls ────────────────────────────────────────────────────

  play() {
    if (this.state.isPlaying) return;
    this.state.isPlaying = true;
    this._startTimer();
    this.onStateChange?.(this.state);
  }

  pause() {
    this.state.isPlaying = false;
    this._stopTimer();
    this.onStateChange?.(this.state);
  }

  setSpeed(speed: PlaySpeed) {
    this.state.speed = speed;
    if (this.state.isPlaying) {
      this._stopTimer();
      this._startTimer();
    }
    this.onStateChange?.(this.state);
  }

  jumpToDay(day: number) {
    const clamped = Math.max(1, Math.min(30, day));
    this.state.currentStep = (clamped - 1) * STEPS_PER_DAY;
    this._emit();
    this.onStateChange?.(this.state);
  }

  reset(config?: SimConfig) {
    this._stopTimer();
    const cfg = config ?? this.state.config;
    const result = runFullSimulation(cfg);
    this.state = {
      currentStep: 0,
      isPlaying: false,
      speed: this.state.speed,
      result,
      config: cfg,
      manualCleanDust: new Map(),
      lastCleanedDay: null,
    };
    this._emit();
    this.onStateChange?.(this.state);
  }

  rerunWithConfig(config: SimConfig) {
    this.reset(config);
  }

  getSimState(): Readonly<SimState> {
    return this.state;
  }

  // ── DataSource interface ────────────────────────────────────────────────

  subscribeStatus(callback: (s: PanelStatus) => void): () => void {
    this.subscribers.add(callback);
    // Emit immediately
    callback(this._buildStatus());
    return () => this.subscribers.delete(callback);
  }

  async sendCommand(cmd: Command): Promise<void> {
    const { result, currentStep } = this.state;
    const step = result.steps[currentStep];

    switch (cmd.type) {
      case 'CLEAN_NOW': {
        // Force a manual clean: override dust at current step
        const newDust = step.dust * (1 - CLEAN_EFFICIENCY);
        this.state.manualCleanDust.set(currentStep, newDust);
        this.state.lastCleanedDay = step.day;
        this._emit();
        break;
      }
      case 'RESET': {
        this.reset();
        break;
      }
      case 'SET_TRIGGER': {
        const trigger = cmd.payload?.trigger as number | undefined;
        if (trigger != null) {
          this.state.config = { ...this.state.config, triggerRatio: trigger };
          this.reset(this.state.config);
        }
        break;
      }
      case 'SET_AUTO': {
        // No-op in demo – auto mode runs automatically
        break;
      }
    }
    this.onStateChange?.(this.state);
  }

  async getHistory(): Promise<FullHistory> {
    const { steps, days } = this.state.result;
    const hourly = steps
      .filter((s) => s.stepOfDay % 6 === 0) // every 1 hour
      .map((s) => ({
        day: s.day,
        hour: s.hour,
        power: s.power,
        dust: s.dust,
        powerIdeal: s.powerIdeal,
      }));

    const cleaningEvents: CleaningEvent[] = days.map((d) => ({
      day: d.day,
      cleaned: d.cleaned,
      skipped: d.cleanSkipped,
      skipReason: d.skipReason,
    }));

    return { hourly, cleaningEvents };
  }

  // ── Private helpers ─────────────────────────────────────────────────────

  private _startTimer() {
    this.timer = setInterval(() => {
      if (!this.state.isPlaying) return;
      // Advance by `speed` steps per tick
      this.state.currentStep = Math.min(
        this.state.currentStep + this.state.speed,
        TOTAL_STEPS - 1,
      );
      if (this.state.currentStep >= TOTAL_STEPS - 1) {
        this.state.isPlaying = false;
        this._stopTimer();
      }
      this._emit();
      this.onStateChange?.(this.state);
    }, TICK_MS);
  }

  private _stopTimer() {
    if (this.timer != null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private _emit() {
    const status = this._buildStatus();
    this.subscribers.forEach((cb) => cb(status));
  }

  private _buildStatus(): PanelStatus {
    const { currentStep, result, manualCleanDust, lastCleanedDay } = this.state;
    const step = result.steps[currentStep] ?? result.steps[result.steps.length - 1];

    // Use overridden dust if manual clean was performed
    let dust = step.dust;
    // Walk back to find most recent override
    for (let i = currentStep; i >= 0; i--) {
      if (manualCleanDust.has(i)) {
        // Apply offset from override point
        const baseDust = manualCleanDust.get(i)!;
        const stepsDiff = currentStep - i;
        const dustGain = (this.state.config.dustRatePerDay / STEPS_PER_DAY) * stepsDiff;
        dust = Math.min(0.5, baseDust + dustGain);
        break;
      }
    }

    const weather: WeatherFlag = step.isStormy
      ? 'Dust Storm'
      : step.isCloudy
        ? 'Cloudy'
        : 'Clear';

    let status: SystemStatus;
    if (step.cleaning) {
      status = 'Cleaning';
    } else if (dust < 0.05) {
      status = 'Clean';
    } else if (dust >= 0.05) {
      status = 'Dusty';
    } else {
      status = 'Monitoring';
    }

    const powerRatio = 1 - dust;
    const G = step.G;
    const power = 100 * (G / 1000) * 0.87 * (1 - dust);

    return {
      day: step.day,
      hour: step.hour,
      power,
      dust,
      powerRatio,
      G,
      weather,
      status,
      cleaning: step.cleaning,
      lastCleanedDay,
      nextCheckHour: 8,
    };
  }
}

/** Singleton instance */
let _instance: SimulatorDataSource | null = null;

export function getSimulatorInstance(config?: SimConfig): SimulatorDataSource {
  if (!_instance) {
    _instance = new SimulatorDataSource(config);
  }
  return _instance;
}

export function resetSimulatorInstance(config?: SimConfig): SimulatorDataSource {
  _instance = new SimulatorDataSource(config);
  return _instance;
}
