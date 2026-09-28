import type { SensorReading } from '../types';

/**
 * Abstract interface for all sensor data sources.
 *
 * Implementations:
 *  - SimulatedSource (default until hardware is connected)
 *  - BLESource (Web Bluetooth stub – TODO)
 *  - WiFiSource (WebSocket/HTTP stub – TODO)
 *
 * To add real hardware:
 * 1. Implement this interface in a new file
 * 2. Register it in src/pages/DevicePage.tsx
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
