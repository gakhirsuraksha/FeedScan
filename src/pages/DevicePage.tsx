import { useEffect, useRef, useState } from 'react';
import { Cpu, Cloud, CheckCircle2, Sliders, AlertTriangle } from 'lucide-react';
import { CloudSource } from '../data-sources/CloudSource';
import { getMode, setMode, type SourceMode } from '../data-sources/sourceStore';

export function DevicePage() {
  const [mode, setModeState] = useState<SourceMode>(getMode());
  const [liveStatus, setLiveStatus] = useState<'idle' | 'connecting' | 'connected' | 'offline'>('idle');
  const [lastRaw, setLastRaw] = useState<unknown>(null);
  const [lastSeenAgo, setLastSeenAgo] = useState<number | null>(null);
  const sourceRef = useRef<CloudSource | null>(null);

  const choose = (m: SourceMode) => {
    setMode(m);
    setModeState(m);
  };

  // While "Live" is selected, keep a background connection open just to show
  // status + raw JSON here — the Test page opens its own connection when scanning.
  useEffect(() => {
    if (mode !== 'live') {
      sourceRef.current?.stop();
      setLiveStatus('idle');
      return;
    }

    let cancelled = false;
    setLiveStatus('connecting');

    let source: CloudSource;
    try {
      source = new CloudSource();
    } catch (err) {
      setLiveStatus('offline');
      console.error(err);
      return;
    }
    sourceRef.current = source;

    source
      .start(() => {
        if (cancelled) return;
        setLiveStatus('connected');
        setLastRaw(source.lastRaw);
      })
      .catch(() => {
        if (!cancelled) setLiveStatus('offline');
      });

    const poll = setInterval(() => {
      if (!source.lastPacketAt) return;
      const ago = Date.now() - source.lastPacketAt;
      setLastSeenAgo(ago);
      if (ago > 5000) setLiveStatus('offline');
      setLastRaw(source.lastRaw);
    }, 500);

    return () => {
      cancelled = true;
      clearInterval(poll);
      source.stop();
    };
  }, [mode]);

  return (
    <main className="page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2.5">
            <Sliders className="w-6 h-6 text-emerald-800" />
            Device &amp; Telemetry
          </h1>
          <p className="page-sub">
            {mode === 'live'
              ? liveStatus === 'connected' ? 'Sensor connected' : liveStatus === 'offline' ? 'No sensor data received' : 'Connecting…'
              : 'Running demo data'}
          </p>
        </div>
      </div>

      <p className="text-sm font-medium text-gray-600 leading-relaxed">
        Choose the telemetry source used for new tests. This choice applies immediately on the
        New Test page.
      </p>

      <div className="space-y-3.5">
        {/* Live via Firebase */}
        <div
          onClick={() => choose('live')}
          className={`p-5 rounded-3xl border-2 cursor-pointer transition-all ${
            mode === 'live'
              ? 'border-emerald-800 bg-emerald-50/60 shadow-sm'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-800">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-base">Live Sensor (ESP32 via Firebase)</p>
                <p className="page-sub">Reads the device's latest reading from Firebase Realtime Database</p>
              </div>
            </div>
            {mode === 'live' && (
              <span
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border shrink-0 ${
                  liveStatus === 'connected'
                    ? 'text-emerald-800 bg-emerald-100 border-emerald-200'
                    : liveStatus === 'offline'
                    ? 'text-rose-800 bg-rose-100 border-rose-200'
                    : 'text-gray-600 bg-gray-100 border-gray-200'
                }`}
              >
                {liveStatus === 'connected' && <><CheckCircle2 className="w-3.5 h-3.5" /> Connected</>}
                {liveStatus === 'offline' && <><AlertTriangle className="w-3.5 h-3.5" /> Offline</>}
                {liveStatus === 'connecting' && 'Connecting…'}
              </span>
            )}
          </div>

          {mode === 'live' && (
            <div className="mt-3.5 p-3.5 bg-white/70 border border-emerald-200 rounded-2xl text-xs text-emerald-950 space-y-1.5">
              {liveStatus === 'connected' && lastSeenAgo !== null && (
                <p className="font-semibold">Last packet: {(lastSeenAgo / 1000).toFixed(1)}s ago</p>
              )}
              {liveStatus === 'offline' && (
                <p className="text-rose-800 font-semibold">
                  No data received. Check the ESP32 is powered, connected to Wi-Fi, and posting to
                  the same Firebase database as VITE_FIREBASE_DB_URL.
                </p>
              )}
              <p className="font-bold pt-1">Raw payload</p>
              <pre className="whitespace-pre-wrap break-all bg-emerald-950/5 rounded-lg p-2 max-h-40 overflow-auto">
                {lastRaw ? JSON.stringify(lastRaw, null, 2) : 'No payload received yet.'}
              </pre>
            </div>
          )}
        </div>

        {/* Demo */}
        <div
          onClick={() => choose('demo')}
          className={`p-5 rounded-3xl border-2 cursor-pointer transition-all ${
            mode === 'demo'
              ? 'border-amber-700 bg-amber-50/50 shadow-sm'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-800">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-base">Demo Simulation</p>
                <p className="page-sub">Generates synthetic readings for a chosen sample condition — no hardware needed</p>
              </div>
            </div>
            {mode === 'demo' && (
              <span className="flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full border border-amber-200 shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" /> Active
              </span>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
