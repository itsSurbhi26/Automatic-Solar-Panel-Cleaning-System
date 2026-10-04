# SolarClean 🌞💧

**A polished mobile app for monitoring and controlling an Automatic Solar Panel Cleaning System.**

Built with React Native + Expo (TypeScript, expo-router), fully offline in **Demo Mode** using a built-in Simulink-matched simulator.

---

## 📱 Screens

| Tab | Description |
|-----|-------------|
| **Dashboard** | Circular power-ratio gauge, live stats, weather, animated pump |
| **Power Graph** | Daily power curve + 30-day dust trend, with/without cleaning |
| **Cleaning Control** | Auto/Manual mode, trigger slider, manual "Clean Now" |
| **Weather Status** | 30-day calendar strip, skip log, cleaning events |
| **Reports** | Energy gain, dust loss comparison, bar charts |
| **Alerts & Settings** | Notifications, dark mode, demo params, logout |

---

## 🚀 Setup

### Prerequisites
- Node.js ≥ 18
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (macOS) or Android Emulator, **or** the Expo Go app on your phone

### Install & Run

```bash
cd Solar
npm install
npx expo start
```

Then:
- Press **`i`** to open in iOS Simulator
- Press **`a`** to open in Android Emulator  
- Scan the QR code with **Expo Go** on your phone

---

## 🎮 Demo Script

> **"Open app → play at 100× → watch dust build up → auto-clean at 08:00 → storm-day skip → Reports"**

1. **Login**: Enter `demo` / `demo` and tap Sign In
2. **Dashboard**: You'll see the power ratio gauge at ~100%
3. **Press ▶ Play** on the sim controls bar, then tap **100×** speed
4. **Watch**: Dust level climbs, power ratio drops (gauge turns amber/red)
5. **Day 3**: Ratio crosses 95% threshold → Auto-clean fires at 08:00 → gauge recovers
6. **Day 8**: 🌪 Storm day → cleaning is **skipped**, "Dust storm – report only" logged
7. **Day 12**: ☁️ Cloudy day → cleaning skipped with cloudy reason
8. **Open Weather tab**: See the 30-day calendar with storm/cloudy markers and skip log
9. **Open Reports tab**: See energy gain ~10.6%, dust loss comparison ~11.7% vs ~2.3%

---

## 🔬 Simulation Engine (matches Simulink model)

| Parameter | Value |
|-----------|-------|
| Panel rated power | 100 W |
| Performance ratio (PR) | 0.87 |
| Power formula | `P = 100 × (G/1000) × 0.87 × (1 - s)` |
| Irradiance | `G = 1000 × sin(π(h-6)/12)` for 6≤h≤18, else 0 |
| Cloudy day | `G × 0.4` |
| Dust accumulation | 0.5%/day (0.005/day) |
| Storm dust jump | +3% at noon |
| Dust clamp | [0, 0.5] |
| Trigger threshold | 95% ratio (user-editable) |
| Check time | 08:00 daily |
| Clean condition | `ratio < threshold` AND not stormy/cloudy |
| Cleaning efficiency | 98% dust removal (`s = s × 0.02`) |
| Cleaning energy | 0.72 Wh |
| Simulation duration | 30 days, 10-min steps |
| Cloudy days | 5, 12, 20, 26 |
| Storm days | 8, 18, 24 |

### Expected Sanity-Check Results
- Avg dust loss **without** cleaning ≈ **11.7%**
- Avg dust loss **with** cleaning ≈ **2.3%**
- Energy gain ≈ **10.6%**

---

## 🏗 Architecture

```
Solar/
├── app/
│   ├── _layout.tsx          # Root layout (GestureHandler + notifications)
│   ├── index.tsx            # Login screen
│   └── (tabs)/
│       ├── _layout.tsx      # Tab navigator (wires simulator → Zustand)
│       ├── dashboard.tsx    # Main dashboard
│       ├── power-graph.tsx  # Charts
│       ├── cleaning-control.tsx
│       ├── weather.tsx
│       ├── reports.tsx
│       └── alerts.tsx
├── src/
│   ├── sim/
│   │   └── engine.ts        # Simulink-matched simulation engine
│   ├── data/
│   │   ├── DataSource.ts    # Interface (clean abstraction layer)
│   │   ├── SimulatorDataSource.ts  # Offline demo implementation
│   │   └── FirebaseDataSource.ts   # Live mode stub (TODOs)
│   ├── store/
│   │   └── useSolarStore.ts # Zustand global store (AsyncStorage persist)
│   ├── theme/
│   │   ├── index.ts         # Design tokens, themes, typography
│   │   └── useTheme.ts      # Theme hook
│   └── components/
│       ├── ui.tsx           # Shared UI components
│       ├── CircularGauge.tsx # Animated SVG gauge
│       └── SimControls.tsx  # Playback controls
└── assets/                  # App icon + splash screen
```

---

## 🔌 Plugging in a Real Backend (Firebase/MQTT)

1. Implement `FirebaseDataSource.ts` (TODOs already marked)
2. In `app/(tabs)/_layout.tsx`, import `FirebaseDataSource` and use it instead of `SimulatorDataSource` when `settings.liveMode === true`
3. Toggle **Live Mode** in Alerts & Settings screen

---

## 🎨 Design System

- **Colors**: Deep navy `#1f3864`, sky blue `#2e75b6`, amber accent `#f5a623`
- **Typography**: System font, 5-level size scale
- **Animations**: react-native-reanimated (gauge, pump, fade-in transitions)
- **Light + Dark mode**: Toggled from Settings, persisted to AsyncStorage
- **Charts**: react-native-svg (no Victory dependency issues)

---

## Demo Credentials

| Username | Password | Access |
|----------|----------|--------|
| `admin` | `solar123` | Full control |
| `demo` | `demo` | Full control |
| `guest` | `guest` | View-only |
