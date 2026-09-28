import type { DataSource } from './DataSource';
import type { SensorReading, ScenarioName } from '../types';

/**
 * SimulatedSource – default sensor data source until hardware is connected.
 *
 * Generates realistic AS7341 spectral channel readings and ancillary sensor
 * values for five selectable quality scenarios. All data is SIMULATED.
 * No real hardware is required.
 *
 * Note: not from a real device.
 */

/**
 * Base spectral channel intensities for each scenario.
 * Index order: [F1_415, F2_445, F3_480, F4_515, F5_555, F6_590, F7_630, F8_680, Clear, NIR]
 */
const SPECTRAL_PROFILES: Record<ScenarioName, readonly number[]> = {
  // Healthy green-yellow feed – balanced spectrum
  good_feed:        [800,  950,  1100, 1350, 1600, 1450, 1200, 1000, 4200, 2800],
  // High moisture – dampened reflectance overall
  high_moisture:    [700,  820,   950, 1100, 1350, 1250, 1050,  900, 3600, 2400],
  // Suspicious adulterant – elevated blue/violet (F1, F2) channels
  suspicious:       [1400, 1500,  1100,  950, 1050, 1150, 1300, 1400, 4600, 3100],
  // Good silage – slightly dampened, green-biased
  good_silage:      [750,  900,  1050, 1280, 1500, 1380, 1150,  950, 3900, 2600],
  // Spoiling silage – high NIR, reduced green channels
  spoiling_silage:  [600,  700,   800,  900, 1000, 1100, 1300, 1500, 3200, 2100],
};

const SCENARIO_PARAMS: Record<ScenarioName, {
  moisture: [number, number];
  temp: [number, number];
  ph?: [number, number];
}> = {
  good_feed:        { moisture: [10, 14],  temp: [24, 28] },
  high_moisture:    { moisture: [22, 28],  temp: [26, 30] },
  suspicious:       { moisture: [12, 16],  temp: [25, 29] },
  good_silage:      { moisture: [55, 65],  temp: [18, 22], ph: [3.8, 4.2] },
  spoiling_silage:  { moisture: [68, 78],  temp: [28, 35], ph: [5.5, 7.0] },
};

/**
 * Return a float in [min, max] with slight Gaussian-shaped noise.
 */
function randRange(min: number, max: number): number {
  // Sum of 3 uniforms approximates a Gaussian (central limit theorem)
  const gauss = (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
  const mid  = (min + max) / 2;
  const half = (max - min) / 2;
  return Math.max(min, Math.min(max, mid + gauss * half));
}

export class SimulatedSource implements DataSource {
  readonly name = 'Simulated';
  private _isRunning = false;
  private _intervalId: ReturnType<typeof setInterval> | null = null;
  private _scenario: ScenarioName;

  constructor(scenario: ScenarioName = 'good_feed') {
    this._scenario = scenario;
  }

  get isRunning(): boolean { return this._isRunning; }

  setScenario(scenario: ScenarioName): void {
    this._scenario = scenario;
  }

  async start(onReading: (reading: SensorReading) => void): Promise<void> {
    if (this._isRunning) return;
    this._isRunning = true;

    const emit = () => {
      const profile = SPECTRAL_PROFILES[this._scenario];
      const params  = SCENARIO_PARAMS[this._scenario];

      const jitter = (base: number) =>
        Math.round(randRange(base * 0.9, base * 1.1));

      const reading: SensorReading = {
        f1_415nm:      jitter(profile[0]),
        f2_445nm:      jitter(profile[1]),
        f3_480nm:      jitter(profile[2]),
        f4_515nm:      jitter(profile[3]),
        f5_555nm:      jitter(profile[4]),
        f6_590nm:      jitter(profile[5]),
        f7_630nm:      jitter(profile[6]),
        f8_680nm:      jitter(profile[7]),
        clear:         jitter(profile[8]),
        nir:           jitter(profile[9]),
        moisture_pct:  parseFloat(randRange(...params.moisture).toFixed(1)),
        temperature_c: parseFloat(randRange(...params.temp).toFixed(1)),
        ph: params.ph ? parseFloat(randRange(...params.ph).toFixed(2)) : undefined,
        timestamp: Date.now(),
      };

      onReading(reading);
    };

    // Emit immediately, then every 800 ms
    emit();
    this._intervalId = setInterval(emit, 800);
  }

  stop(): void {
    if (this._intervalId) {
      clearInterval(this._intervalId);
      this._intervalId = null;
    }
    this._isRunning = false;
  }
}
