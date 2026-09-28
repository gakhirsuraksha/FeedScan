import type { DataSource } from './DataSource';
import type { SensorReading } from '../types';

/**
 * BLESource – Web Bluetooth API stub for ESP32 BLE connection.
 *
 * TODO (Phase 3): Implement using the Web Bluetooth API.
 *
 * BLE Configuration (update with actual UUIDs from firmware):
 *   Service UUID:        "12345678-1234-1234-1234-123456789abc"
 *   Characteristic UUID: "87654321-4321-4321-4321-cba987654321"
 *   Notification interval: ~800ms
 *   Max payload: 512 bytes (JSON)
 *
 * Implementation steps:
 *   1. navigator.bluetooth.requestDevice({ filters: [{ services: [SERVICE_UUID] }] })
 *   2. device.gatt!.connect()  → get GATT server
 *   3. server.getPrimaryService(SERVICE_UUID) → get service
 *   4. service.getCharacteristic(CHAR_UUID) → get characteristic
 *   5. char.startNotifications()
 *   6. char.addEventListener('characteristicvaluechanged', handler)
 *   7. In handler: decode ArrayBuffer as UTF-8, JSON.parse → Esp32Payload
 *   8. Map Esp32Payload → SensorReading (see docs/esp32-payload.md)
 *
 * See docs/esp32-payload.md for the JSON schema.
 */
export class BLESource implements DataSource {
  readonly name = 'Bluetooth (BLE)';
  private _isRunning = false;

  get isRunning(): boolean { return this._isRunning; }

  async start(_onReading: (reading: SensorReading) => void): Promise<void> {
    throw new Error(
      'BLE source is not yet implemented. ' +
      'Use the Simulation source, or connect via Wi-Fi.'
    );
  }

  stop(): void {
    // TODO: device.gatt?.disconnect(); char.removeEventListener(...)
    this._isRunning = false;
  }
}
