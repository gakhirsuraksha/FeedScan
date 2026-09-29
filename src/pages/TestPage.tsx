import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  Square,
  Leaf,
  FlaskConical,
  Camera,
} from 'lucide-react';
import { createSource, getMode } from '../data-sources/sourceStore';
import type { DataSource } from '../data-sources/DataSource';
import { predict } from '../model/predict';
import { extractImageFeatures } from '../utils/imageFeatures';
import { generateSessionId } from '../utils/sessionId';
import { SpectralChart } from '../components/SpectralChart';
import { SensorReadingCard } from '../components/SensorReadingCard';
import type {
  SensorReading,
  ScenarioName,
  TestSession,
  ImageFeatures,
} from '../types';

const PROFILES: {
  name: ScenarioName;
  label: string;
  type: 'feed' | 'silage';
  desc: string;
}[] = [
  {
    name: 'good_feed',
    label: 'Standard Dry Feed (Normal)',
    type: 'feed',
    desc: 'Balanced spectral curve and standard moisture',
  },
  {
    name: 'high_moisture',
    label: 'High Moisture Feed',
    type: 'feed',
    desc: 'Excess dampness flagged for storage risk',
  },
  {
    name: 'suspicious',
    label: 'Screening Anomaly (Adulteration Risk)',
    type: 'feed',
    desc: 'Unusual blue/violet spectral reflectance ratio',
  },
  {
    name: 'good_silage',
    label: 'Optimal Fermented Silage',
    type: 'silage',
    desc: 'Low pH (anaerobic stability) and normal moisture',
  },
  {
    name: 'spoiling_silage',
    label: 'Spoiling Silage (High pH / Temp)',
    type: 'silage',
    desc: 'Elevated pH, high temperature and moisture',
  },
];

const SCAN_DURATION_MS = 5000;
/** In live mode, how long to wait for a first packet before giving up. */
const LIVE_CONNECT_TIMEOUT_MS = 4000;

type Phase = 'setup' | 'scanning' | 'done';

/** Averages a batch of readings into one. Live sensor noise and the demo
 *  simulator both produce several samples per scan; a single reading (e.g.
 *  the last one) is noisier and easier to spoof than the average. */
function averageReadings(rs: SensorReading[]): SensorReading {
  const numKeys = [
    'f1_415nm', 'f2_445nm', 'f3_480nm', 'f4_515nm', 'f5_555nm',
    'f6_590nm', 'f7_630nm', 'f8_680nm', 'clear', 'nir',
    'moisture_pct', 'temperature_c',
  ] as const;

  const out = {} as Record<(typeof numKeys)[number], number>;
  for (const k of numKeys) {
    out[k] = rs.reduce((sum, r) => sum + ((r[k] as number) ?? 0), 0) / rs.length;
  }

  const phVals = rs.map((r) => r.ph).filter((v): v is number => v !== undefined);
  const ph = phVals.length ? phVals.reduce((s, v) => s + v, 0) / phVals.length : undefined;

  return { ...out, ph, timestamp: Date.now() } as SensorReading;
}

export function TestPage() {
  const navigate = useNavigate();

  // Form state
  const [sampleType, setSampleType] = useState<'feed' | 'silage'>('feed');
  const [sampleId, setSampleId]     = useState('');
  const [feedType, setFeedType]     = useState('Maize Silage');
  const [batchId, setBatchId]       = useState('');

  // Telemetry mode (set on the Device page) and, only for demo mode, which
  // scenario to run. This replaces the old auto-cycling counter — the demo
  // scenario is now an explicit, visible choice, not hidden state.
  const mode = getMode();
  const [demoScenario, setDemoScenario] = useState<ScenarioName>('good_feed');
  const [deviceOffline, setDeviceOffline] = useState(false);

  // Test state
  const [phase, setPhase]                       = useState<Phase>('setup');
  const [readings, setReadings]                 = useState<SensorReading[]>([]);
  const [currentReading, setCurrentReading]     = useState<SensorReading | null>(null);
  const [scanProgress, setScanProgress]         = useState(0);
  const [imagePreview, setImagePreview]         = useState<string | null>(null);
  const [imageFeatures, setImageFeatures]       = useState<ImageFeatures | undefined>();

  // Refs for cleanup
  const sourceRef        = useRef<DataSource | null>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scanTimerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      sourceRef.current?.stop();
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      if (scanTimerRef.current)    clearTimeout(scanTimerRef.current);
    };
  }, []);

  const handleImageChange = useCallback(async (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target!.result as string;
      setImagePreview(dataUrl);
      extractImageFeatures(dataUrl)
        .then((f) => setImageFeatures({ ...f, imageDataUrl: dataUrl }))
        .catch((err) => console.warn('Image feature extraction error:', err));
    };
    reader.readAsDataURL(file);
  }, []);

  const startTest = useCallback(async () => {
    setPhase('scanning');
    setScanProgress(0);
    setReadings([]);
    setDeviceOffline(false);

    const scenario: ScenarioName = demoScenario;
    const source = createSource(mode, scenario);
    sourceRef.current = source;
    const collectedReadings: SensorReading[] = [];

    try {
      await Promise.race([
        source.start((reading) => {
          collectedReadings.push(reading);
          setCurrentReading(reading);
          setReadings((prev) => [...prev, reading]);
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), LIVE_CONNECT_TIMEOUT_MS),
        ),
      ]);
    } catch {
      // Live mode couldn't reach the device in time — don't fabricate a result.
      source.stop();
      setDeviceOffline(true);
      setPhase('setup');
      return;
    }

    const startTime = Date.now();
    progressTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setScanProgress(Math.min(100, (elapsed / SCAN_DURATION_MS) * 100));
    }, 50);

    scanTimerRef.current = setTimeout(async () => {
      source.stop();
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      setScanProgress(100);

      if (collectedReadings.length === 0) {
        // Connected, but no packets arrived during the scan window.
        setDeviceOffline(mode === 'live');
        setPhase('setup');
        return;
      }
      const finalReading = averageReadings(collectedReadings);

      const modelOutput = predict(finalReading, sampleType, imageFeatures);

      const session: TestSession = {
        sessionId:    generateSessionId(),
        sampleId:     sampleId.trim() || `SMP-${Date.now().toString(36).toUpperCase()}`,
        sampleType,
        feedType:     feedType.trim() || 'General Feed',
        batchId:      batchId.trim() || `BAT-${Date.now().toString(36).toUpperCase()}`,
        scenario:     mode === 'live' ? 'live' : scenario,
        reading:      finalReading,
        imageFeatures,
        modelOutput,
        createdAt:    Date.now(),
      };

      setPhase('done');
      navigate('/result', { state: { session } });
    }, SCAN_DURATION_MS);
  }, [sampleType, sampleId, feedType, batchId, imageFeatures, navigate, mode, demoScenario]);

  const stopTest = useCallback(() => {
    sourceRef.current?.stop();
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    if (scanTimerRef.current)    clearTimeout(scanTimerRef.current);
    setPhase('setup');
    setScanProgress(0);
  }, []);

  const isScanning = phase === 'scanning';

  return (
    <main className="page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">New Quality Test</h1>
          <p className="page-sub">Choose the sample type and start the scan</p>
        </div>
        <span
          className={`text-xs font-bold px-2.5 py-1 rounded-full border shrink-0 ${
            mode === 'live'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}
        >
          {mode === 'live' ? 'LIVE SENSOR' : 'DEMO'}
        </span>
      </div>

      {deviceOffline && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-sm text-rose-800 font-medium">
          Device offline — no packets received from the sensor. Check the ESP32's power and
          Wi-Fi, or switch to Demo mode on the Device page.
        </div>
      )}

      {mode === 'demo' && (
        <section className="space-y-2">
          <label className="label">
            Demo Sample Condition
          </label>
          <select
            value={demoScenario}
            onChange={(e) => setDemoScenario(e.target.value as ScenarioName)}
            disabled={isScanning}
            className="field w-full disabled:opacity-50"
          >
            {PROFILES.filter((p) => p.type === sampleType).map((p) => (
              <option key={p.name} value={p.name}>{p.label}</option>
            ))}
          </select>
        </section>
      )}

      {/* ── Sample Type ─────────────────────────────────────── */}
      <section className="space-y-2">
        <label className="label">
          Sample Category
        </label>
        <div className="grid grid-cols-2 gap-3">
          {(['feed', 'silage'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setSampleType(type)}
              disabled={isScanning}
              aria-pressed={sampleType === type}
              className={`flex items-center justify-center gap-2.5 p-4 rounded-xl border-2 font-bold text-base transition-all ${
                sampleType === type
                  ? 'border-emerald-800 bg-emerald-50 text-emerald-900'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-emerald-300'
              } disabled:opacity-50`}
            >
              {type === 'feed'
                ? <Leaf className="w-5 h-5" aria-hidden="true" />
                : <FlaskConical className="w-5 h-5" aria-hidden="true" />}
              {type === 'feed' ? 'Dry Feed' : 'Silage'}
            </button>
          ))}
        </div>
      </section>

      {/* ── Sample Details ───────────────────────────────────── */}
      <section className="card space-y-3 p-4">
        <label className="text-xs font-bold text-gray-500 block">
          Sample Details
        </label>
        <div className="space-y-2.5">
          <input
            type="text"
            placeholder="Sample ID (e.g. SMP-0412)"
            value={sampleId}
            onChange={(e) => setSampleId(e.target.value)}
            disabled={isScanning}
            className="field w-full disabled:opacity-50"
          />
          <input
            type="text"
            placeholder="Feed variety (e.g. Maize Silage, Sorghum, Mixed Hay)"
            value={feedType}
            onChange={(e) => setFeedType(e.target.value)}
            disabled={isScanning}
            className="field w-full disabled:opacity-50"
          />
          <input
            type="text"
            placeholder="Batch / Silo ID (optional)"
            value={batchId}
            onChange={(e) => setBatchId(e.target.value)}
            disabled={isScanning}
            className="field w-full disabled:opacity-50"
          />
        </div>
      </section>

      {/* ── Automatic sensor readings note ───────────────────── */}
      <p className="note note-brand text-xs">
        Spectral, near-infrared (NIR), moisture and temperature readings are captured automatically{mode === 'live' ? ' from the connected sensor unit' : ' (demo data)'}{sampleType === 'silage' ? ', along with pH' : ''}. You only need to add the sample details.
      </p>

      {/* ── Photo capture ────────────────────────────────────── */}
      <section className="space-y-2">
        <label className="text-xs font-bold text-gray-500 block">
          Sample Photo <span className="font-normal text-gray-400 lowercase">(optional)</span>
        </label>
        <label
          className={`relative flex items-center justify-center w-full h-24 border-2 border-dashed rounded-2xl cursor-pointer transition-colors ${
            imagePreview
              ? 'border-emerald-400 bg-emerald-50/50'
              : 'border-gray-200 hover:border-emerald-400 bg-white'
          } ${isScanning ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(e) => e.target.files?.[0] && handleImageChange(e.target.files[0])}
            disabled={isScanning}
            aria-label="Upload or capture sample photo"
          />
          {imagePreview ? (
            <img
              src={imagePreview}
              alt="Sample preview"
              className="h-full w-full object-contain rounded-xl p-1.5"
            />
          ) : (
            <div className="flex items-center gap-2 text-gray-500">
              <Camera className="w-5 h-5 text-emerald-700" aria-hidden="true" />
              <span className="text-sm font-medium">Add photo for colour analysis</span>
            </div>
          )}
        </label>
        {imageFeatures && (
          <p className="text-xs text-emerald-800 font-medium px-1">
            ✓ Colour features extracted (Brightness: {imageFeatures.brightness.toFixed(0)})
          </p>
        )}
      </section>

      {/* ── Primary Action Button ────────────────────────────── */}
      <div>
        {!isScanning ? (
          <button
            type="button"
            onClick={startTest}
            className="btn btn-primary w-full flex items-center justify-center gap-2.5"
          >
            <Play className="w-5 h-5 fill-current" aria-hidden="true" />
            Start Test
          </button>
        ) : (
          <button
            type="button"
            onClick={stopTest}
            className="w-full flex items-center justify-center gap-2.5 bg-rose-600 text-white p-4 rounded-xl font-bold text-lg hover:bg-rose-500 transition shadow-md"
          >
            <Square className="w-5 h-5 fill-current" aria-hidden="true" />
            Stop Test
          </button>
        )}
      </div>

      {/* ── Scanning UI ──────────────────────────────────────── */}
      {isScanning && (
        <section
          className="space-y-4 pt-2 fade-in-up"
          aria-live="polite"
          aria-label="Scanning active"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-emerald-900 scan-pulse flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping" />
              {mode === 'live' ? 'Streaming Live Sensor Readings…' : 'Streaming Demo Readings…'}
            </span>
            <span className="text-sm text-gray-600 font-mono font-bold">
              {Math.round(scanProgress)}%
            </span>
          </div>

          <div
            className="w-full bg-gray-200 rounded-full h-3 overflow-hidden"
            role="progressbar"
            aria-valuenow={Math.round(scanProgress)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="bg-emerald-700 h-3 rounded-full transition-all duration-150"
              style={{ width: `${scanProgress}%` }}
            />
          </div>

          {currentReading && (
            <div className="space-y-3 pt-1">
              <SensorReadingCard reading={currentReading} sampleType={sampleType} />
              <div className="card p-4">
                <SpectralChart reading={currentReading} />
              </div>
              <p className="text-xs text-gray-500 text-center font-medium">
                {readings.length} data frames acquired · 800ms telemetry interval
              </p>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
