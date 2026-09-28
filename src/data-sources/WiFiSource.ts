import type { DataSource } from './DataSource';
import type { SensorReading } from '../types';

/**
 * WiFiSource – ESP32 Wi-Fi connection stub.
 *
 * TODO (Phase 3): Implement using WebSocket or HTTP polling.
 *
 * Wi-Fi Configuration:
 *   ESP32 AP SSID:       "FeedScan-XXXX"  (AP mode, update with actual)
 *   WebSocket endpoint:  ws://192.168.4.1/ws   (preferred – push)
 *   HTTP endpoint:       GET http://192.168.4.1/reading  (polling fallback)
 *   Poll interval:       800ms
 *
 * WebSocket implementation steps:
 *   1. this._ws = new WebSocket(`ws://${this.espIp}/ws`)
 *   2. this._ws.onopen = () => { this._isRunning = true; }
 *   3. this._ws.onmessage = (e) => {
 *        const payload = JSON.parse(e.data) as Esp32Payload;
 *        onReading(mapPayloadToReading(payload));
 *      }
 *   4. this._ws.onerror = (e) => { console.error('WS error', e); }
 *
 * See docs/esp32-payload.md for the JSON schema and mapPayloadToReading().
 */
export class WiFiSource implements DataSource {
  readonly name = 'Wi-Fi (ESP32)';
  private _isRunning = false;
  private _ws: WebSocket | null = null;
  private _pollInterval: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly espIp: string = '192.168.4.1') {}

  get isRunning(): boolean { return this._isRunning; }

  async start(_onReading: (reading: SensorReading) => void): Promise<void> {
    throw new Error(
      `Wi-Fi source not yet implemented. ` +
      `Target: ws://${this.espIp}/ws. Use Simulated source.`
    );
  }

  stop(): void {
    this._ws?.close();
    this._ws = null;
    if (this._pollInterval) {
      clearInterval(this._pollInterval);
      this._pollInterval = null;
    }
    this._isRunning = false;
  }
}
