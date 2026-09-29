import type { DataSource } from './DataSource';
import type { SensorReading } from '../types';

/**
 * Live telemetry source: subscribes to a Firebase Realtime Database path that the
 * ESP32 writes to over HTTP. Uses the REST "event stream" (SSE) endpoint, so no
 * Firebase SDK is required.
 *
 * Expected node shape at /devices/{deviceId}/latest:
 * {
 *   spectral: { f1_415nm, f2_445nm, ..., clear, nir },
 *   moisture_pct, temperature_c, ph?,
 *   ts: <server timestamp, ms>
 * }
 */
export class CloudSource implements DataSource {
  readonly name = 'Live (ESP32 via Firebase)';

  private es: EventSource | null = null;
  private _isRunning = false;

  /** Timestamp (ms, client clock) of the last reading accepted. UI can show "last seen". */
  lastPacketAt = 0;
  /** Raw last payload received, for a debug/raw-JSON view. */
  lastRaw: unknown = null;

  private readonly dbUrl: string;

  constructor(
    dbUrl: string = import.meta.env.VITE_FIREBASE_DB_URL as string,
    private deviceId: string = 'feedscan-001',
    /** Ignore packets older than this (ms) — guards against a stale cached value. */
    private maxAgeMs = 5000,
  ) {
    if (!dbUrl) {
      throw new Error(
        'VITE_FIREBASE_DB_URL is not set. Add it to .env (and your host\'s env vars) — see docs/esp32-payload.md.',
      );
    }
    this.dbUrl = dbUrl.replace(/\/$/, '');
  }

  get isRunning() {
    return this._isRunning;
  }

  async start(onReading: (reading: SensorReading) => void): Promise<void> {
    const url = `${this.dbUrl}/devices/${this.deviceId}/latest.json`;

    return new Promise((resolve, reject) => {
      const es = new EventSource(url);
      this.es = es;
      let settled = false;

      es.addEventListener('put', (event) => {
        try {
          const { path, data } = JSON.parse((event as MessageEvent).data);
          if (path !== '/' || !data || !data.spectral) return;
          if (data.ts && Date.now() - data.ts > this.maxAgeMs) return; // stale

          this.lastPacketAt = Date.now();
          this.lastRaw = data;

          const reading: SensorReading = {
            ...data.spectral,
            moisture_pct: data.moisture_pct,
            temperature_c: data.temperature_c,
            ph: data.ph,
            timestamp: Date.now(),
          };
          onReading(reading);
        } catch (err) {
          console.warn('CloudSource: malformed payload', err);
        }
      });

      es.onopen = () => {
        this._isRunning = true;
        if (!settled) {
          settled = true;
          resolve();
        }
      };

      es.onerror = () => {
        if (!settled) {
          // Never connected at all — surface it so the caller can show "device offline".
          settled = true;
          this._isRunning = false;
          reject(new Error('Could not reach Firebase (check VITE_FIREBASE_DB_URL and network).'));
        }
        // If it errors after having connected once, EventSource retries on its own.
      };
    });
  }

  stop(): void {
    this.es?.close();
    this.es = null;
    this._isRunning = false;
  }
}
