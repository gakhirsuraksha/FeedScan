import type { SensorReading } from '../types';

/**
 * Abstract interface for all sensor data sources.
 *
 * Implementations:
 *  - SimulatedSource (demo mode — synthetic readings for a chosen scenario)
 *  - CloudSource (live mode — ESP32 readings relayed through Firebase Realtime Database)
 *
 * The active implementation is chosen in src/data-sources/sourceStore.ts based on the
 * mode selected on the Device page.
 */
export interface DataSource {
  /** Start streaming. Each new reading is delivered via the callback. */
  start(onReading: (reading: SensorReading) => void): Promise<void>;
  /** Stop streaming and release resources. */
  stop(): void;
  /** Human-readable name shown in the Device page. */
  readonly name: string;
  /** True while actively streaming readings. */
  readonly isRunning: boolean;
}
