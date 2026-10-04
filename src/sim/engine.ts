/**
 * SolarClean Simulation Engine
 * Matches the Simulink model specification exactly.
 *
 * Panel model:  P = 100 × (G/1000) × 0.87 × (1 - s)
 * Sunlight:     G = 1000 × sin(π(h-6)/12)  for 6≤h≤18, else 0
 *               Cloudy day: G × 0.4
 * Dust:         s += 0.005/day (10-min step: 0.005/144)
 *               Dust-storm noon: +0.03
 *               s clamped [0, 0.5]
 * Controller:   08:00 daily. ratio = 1 - s.
 *               If ratio < threshold AND not stormy/cloudy → clean
 *               Else → "report only"
 * Cleaning:     s = s × (1 - 0.98) = s × 0.02
 *               Energy = 0.72 Wh
 * Scenario:     30 days, 10-min steps (144 steps/day)
 *               Cloudy days: 5, 12, 20, 26
 *               Storm days:  8, 18, 24
 */

export const PANEL_RATED_W = 100;
export const PR = 0.87;           // Performance ratio
export const STEPS_PER_DAY = 144; // 10-min steps
export const TOTAL_DAYS = 30;
export const CLEAN_ENERGY_WH = 0.72;
export const DUST_RATE_PER_DAY = 0.005;    // 0.5% per day
export const STORM_DUST_JUMP = 0.03;        // 3% at noon on storm days
export const CLEAN_EFFICIENCY = 0.98;       // removes 98% of dust
export const DEFAULT_TRIGGER = 0.95;        // ratio threshold

export const CLOUDY_DAYS: number[] = [5, 12, 20, 26];
export const STORM_DAYS: number[] = [8, 18, 24];

/** One simulation time step record */
export interface SimStep {
  day: number;          // 1-based day index
  stepOfDay: number;    // 0-based step within day (0..143)
  hour: number;         // decimal hour (e.g., 6.0 = 06:00)
  G: number;            // irradiance W/m²
  dust: number;         // dust level s [0, 0.5]
  power: number;        // actual power W
  powerIdeal: number;   // power if no dust
  isStormy: boolean;
  isCloudy: boolean;
  cleaning: boolean;    // pump active this step
}

/** Daily summary record */
export interface DayRecord {
  day: number;
  avgDustLoss: number;       // fraction, avg of (1-P/Pideal) over daylight
  totalPowerWh: number;      // Wh produced
  totalPowerIdealWh: number; // Wh produced if no dust
  cleaned: boolean;
  cleanSkipped: boolean;
  skipReason: string;
  dustAtMorning: number;     // dust level at 08:00
  ratio: number;             // P_ratio at 08:00
  isStormy: boolean;
  isCloudy: boolean;
}

/** Full simulation result */
export interface SimResult {
  steps: SimStep[];
  days: DayRecord[];
  cleanings: number;
  totalCleanEnergyWh: number;
  avgDustLossWithout: number;
  avgDustLossWith: number;
  energyGainPct: number;
}

/** Configuration overrides (from user settings) */
export interface SimConfig {
  triggerRatio: number;   // default 0.95
  dustRatePerDay: number; // default 0.005
  stormDustJump: number;  // default 0.03
  cloudyDays: number[];
  stormDays: number[];
}

export const DEFAULT_CONFIG: SimConfig = {
  triggerRatio: DEFAULT_TRIGGER,
  dustRatePerDay: DUST_RATE_PER_DAY,
  stormDustJump: STORM_DUST_JUMP,
  cloudyDays: [...CLOUDY_DAYS],
  stormDays: [...STORM_DAYS],
};

/**
 * Compute irradiance G for a given hour and weather.
 */
export function computeG(hour: number, isCloudy: boolean, isStormy: boolean): number {
  if (hour < 6 || hour > 18) return 0;
  const G = 1000 * Math.sin((Math.PI * (hour - 6)) / 12);
  const cloudy = isCloudy || isStormy; // storms also reduce irradiance
  return cloudy ? G * 0.4 : G;
}

/**
 * Compute panel power.
 */
export function computePower(G: number, dust: number): number {
  return PANEL_RATED_W * (G / 1000) * PR * (1 - dust);
}

/**
 * Run the full 30-day simulation.
 * Returns results for both "with cleaning" and "without cleaning" scenarios
 * by running two independent dust tracks.
 */
export function runFullSimulation(config: SimConfig = DEFAULT_CONFIG): SimResult {
  const steps: SimStep[] = [];
  const days: DayRecord[] = [];

  const dustPerStep = config.dustRatePerDay / STEPS_PER_DAY;
  let dust = 0;
  let dustNoClean = 0; // parallel track without cleaning
  let cleanings = 0;
  let totalCleanEnergyWh = 0;

  // For daily loss accumulation
  let dayPowerWh = 0;
  let dayPowerIdealWh = 0;
  let dayLossAccum = 0;
  let dayLightSteps = 0;
  let dayMorningDust = 0;
  let dayMorningRatio = 1;
  let dayMorningSet = false;
  let cleanedToday = false;
  let cleanSkipped = false;
  let skipReason = '';

  // "without cleaning" daily power accumulators
  const daysNoClean: { powerWh: number; powerIdealWh: number; dustLoss: number; steps: number }[] =
    Array.from({ length: TOTAL_DAYS }, () => ({ powerWh: 0, powerIdealWh: 0, dustLoss: 0, steps: 0 }));

  for (let day = 1; day <= TOTAL_DAYS; day++) {
    const isCloudy = config.cloudyDays.includes(day);
    const isStormy = config.stormDays.includes(day);

    // Reset per-day accumulators
    dayPowerWh = 0;
    dayPowerIdealWh = 0;
    dayLossAccum = 0;
    dayLightSteps = 0;
    dayMorningSet = false;
    cleanedToday = false;
    cleanSkipped = false;
    skipReason = '';

    for (let step = 0; step < STEPS_PER_DAY; step++) {
      const hour = 6 + (step / STEPS_PER_DAY) * 24 - 6; // 0..24 mapped to time
      // Actually: step 0 = 00:00, so hour = step * (24/144) = step/6
      const h = step / 6; // decimal hour 0..24
      const G = computeG(h, isCloudy, isStormy);
      const power = computePower(G, dust);
      const powerIdeal = PANEL_RATED_W * (G / 1000) * PR; // no dust

      // ── DUST ACCUMULATION ──
      // Noon storm: step 72 = 12:00
      const atNoon = step === 72;
      if (isStormy && atNoon) {
        dust = Math.min(0.5, dust + config.stormDustJump);
        dustNoClean = Math.min(0.5, dustNoClean + config.stormDustJump);
      }
      dust = Math.min(0.5, dust + dustPerStep);
      dustNoClean = Math.min(0.5, dustNoClean + dustPerStep);

      // ── CONTROLLER CHECK at 08:00 (step 48) ──
      const atCheckTime = step === 48; // 08:00 = 48 * 10min
      if (atCheckTime) {
        dayMorningDust = dust;
        dayMorningRatio = 1 - dust;
        dayMorningSet = true;

        const needsCleaning = dayMorningRatio < config.triggerRatio;
        if (needsCleaning) {
          if (isStormy || isCloudy) {
            cleanSkipped = true;
            skipReason = isStormy ? 'Dust storm – report only' : 'Cloudy day – report only';
          } else {
            // Cleaning: pump ON for 5s (modelled as instantaneous at this step)
            cleanedToday = true;
            cleanings++;
            totalCleanEnergyWh += CLEAN_ENERGY_WH;
            dust = dust * (1 - CLEAN_EFFICIENCY); // = dust * 0.02
          }
        }
      }

      // Track if cleaning is happening (show pump animation for 1 step)
      const cleaningActive = cleanedToday && step === 48;

      // ── POWER ACCUMULATION ──
      const stepH = 10 / 60; // 10-min step in hours
      dayPowerWh += power * stepH;
      dayPowerIdealWh += powerIdeal * stepH;
      if (G > 0) {
        dayLossAccum += power < powerIdeal ? 1 - power / (powerIdeal + 1e-9) : 0;
        dayLightSteps++;
      }

      // No-clean track
      const powerNC = computePower(G, dustNoClean);
      daysNoClean[day - 1].powerWh += powerNC * stepH;
      daysNoClean[day - 1].powerIdealWh += powerIdeal * stepH;
      if (G > 0) {
        daysNoClean[day - 1].dustLoss +=
          powerNC < powerIdeal ? 1 - powerNC / (powerIdeal + 1e-9) : 0;
        daysNoClean[day - 1].steps++;
      }

      steps.push({
        day,
        stepOfDay: step,
        hour: h,
        G,
        dust,
        power,
        powerIdeal,
        isStormy,
        isCloudy,
        cleaning: cleaningActive,
      });
    }

    // End-of-day summary
    const avgDustLoss = dayLightSteps > 0 ? dayLossAccum / dayLightSteps : 0;
    days.push({
      day,
      avgDustLoss,
      totalPowerWh: dayPowerWh,
      totalPowerIdealWh: dayPowerIdealWh,
      cleaned: cleanedToday,
      cleanSkipped,
      skipReason,
      dustAtMorning: dayMorningDust,
      ratio: dayMorningRatio,
      isStormy,
      isCloudy,
    });
  }

  // ── SUMMARY STATS ──
  const avgDustLossWith =
    days.reduce((acc, d) => acc + d.avgDustLoss, 0) / TOTAL_DAYS;

  const avgDustLossWithout =
    daysNoClean.reduce(
      (acc, d) => acc + (d.steps > 0 ? d.dustLoss / d.steps : 0),
      0,
    ) / TOTAL_DAYS;

  const totalPowerWith = days.reduce((a, d) => a + d.totalPowerWh, 0);
  const totalPowerWithout = daysNoClean.reduce((a, d) => a + d.powerWh, 0);
  const energyGainPct =
    totalPowerWithout > 0
      ? ((totalPowerWith - totalPowerWithout) / totalPowerWithout) * 100
      : 0;

  return {
    steps,
    days,
    cleanings,
    totalCleanEnergyWh,
    avgDustLossWithout,
    avgDustLossWith,
    energyGainPct,
  };
}

/**
 * Get the SimStep at a specific global step index.
 */
export function getStepAt(steps: SimStep[], globalStep: number): SimStep | null {
  return steps[globalStep] ?? null;
}

/** Total simulation steps */
export const TOTAL_STEPS = TOTAL_DAYS * STEPS_PER_DAY; // 4320
