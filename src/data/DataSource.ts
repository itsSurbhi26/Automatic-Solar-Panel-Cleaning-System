/**
 * DataSource Interface – clean abstraction layer.
 * Swap SimulatorDataSource for FirebaseDataSource in Live mode.
 */

export type WeatherFlag = 'Clear' | 'Cloudy' | 'Dust Storm';
export type SystemStatus = 'Clean' | 'Dusty' | 'Cleaning' | 'Monitoring';

export interface PanelStatus {
  day: number;
  hour: number;
  power: number;          // W
  dust: number;           // 0..0.5
  powerRatio: number;     // 1 - dust
  G: number;              // W/m²
  weather: WeatherFlag;
  status: SystemStatus;
  cleaning: boolean;
  lastCleanedDay: number | null;
  nextCheckHour: number;  // always 8
}

export interface CleaningEvent {
  day: number;
  cleaned: boolean;
  skipped: boolean;
  skipReason: string;
}

export interface HistoryPoint {
  day: number;
  hour: number;
  power: number;
  dust: number;
  powerIdeal: number;
}

export interface FullHistory {
  hourly: HistoryPoint[];
  cleaningEvents: CleaningEvent[];
}

export type CommandType = 'CLEAN_NOW' | 'RESET' | 'SET_TRIGGER' | 'SET_AUTO';

export interface Command {
  type: CommandType;
  payload?: Record<string, unknown>;
}

/** The interface every data source must implement */
export interface DataSource {
  /** Subscribe to live panel status updates */
  subscribeStatus(callback: (status: PanelStatus) => void): () => void;

  /** Send a control command */
  sendCommand(cmd: Command): Promise<void>;

  /** Get full history (for graphs / reports) */
  getHistory(): Promise<FullHistory>;
}
