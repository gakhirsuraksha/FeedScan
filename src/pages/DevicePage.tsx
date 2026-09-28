import { useState } from 'react';
import { Bluetooth, Wifi, Cpu, CheckCircle2, Sliders } from 'lucide-react';

export function DevicePage() {
  const [selectedSource, setSelectedSource] = useState<'simulated' | 'ble' | 'wifi'>('simulated');
  const [wifiIp, setWifiIp] = useState('192.168.4.1');

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 space-y-6 pb-14">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
            <Sliders className="w-6 h-6 text-emerald-800" />
            Device &amp; Telemetry
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">No device connected</p>
        </div>
      </div>

      <p className="text-sm font-medium text-gray-600 leading-relaxed">
        Select a sensor telemetry source. Readings currently run in <strong>simulation mode</strong>. Live sensor input will be available once the FeedScan device is connected.
      </p>

      <div className="space-y-3.5">
        {/* Simulated */}
        <div
          onClick={() => setSelectedSource('simulated')}
          className={`p-5 rounded-3xl border-2 cursor-pointer transition-all ${
            selectedSource === 'simulated'
              ? 'border-emerald-800 bg-emerald-50/60 shadow-sm'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-800">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-base">Simulation Engine</p>
                <p className="text-xs text-gray-500 mt-0.5">AS7341 10-channel spectral + moisture + pH + temp driver</p>
              </div>
            </div>
            {selectedSource === 'simulated' && (
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200 shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" /> Active
              </span>
            )}
          </div>
        </div>

        {/* BLE */}
        <div
          onClick={() => setSelectedSource('ble')}
          className={`p-5 rounded-3xl border-2 cursor-pointer transition-all ${
            selectedSource === 'ble'
              ? 'border-blue-700 bg-blue-50/50 shadow-sm'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-800">
                <Bluetooth className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-base">Bluetooth Low Energy (ESP32)</p>
                <p className="text-xs text-gray-500 mt-0.5">Web Bluetooth GATT stream from portable hardware</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full shrink-0">
              Coming soon
            </span>
          </div>

          {selectedSource === 'ble' && (
            <div className="mt-3.5 p-3.5 bg-blue-50/80 border border-blue-200 rounded-2xl text-xs text-blue-950 space-y-1">
              <p className="font-bold">Bluetooth connection: coming soon</p>
              <p className="text-blue-900/80">
                Live Bluetooth input will be enabled when the sensor device is connected. Until then, readings run in simulation mode.
              </p>
            </div>
          )}
        </div>

        {/* Wi-Fi */}
        <div
          onClick={() => setSelectedSource('wifi')}
          className={`p-5 rounded-3xl border-2 cursor-pointer transition-all ${
            selectedSource === 'wifi'
              ? 'border-purple-700 bg-purple-50/50 shadow-sm'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-800">
                <Wifi className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-base">Local Wi-Fi / AP (ESP32)</p>
                <p className="text-xs text-gray-500 mt-0.5">Direct WebSocket or REST telemetry stream</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full shrink-0">
              Coming soon
            </span>
          </div>

          {selectedSource === 'wifi' && (
            <div className="mt-3.5 p-3.5 bg-purple-50/80 border border-purple-200 rounded-2xl text-xs text-purple-950 space-y-2.5">
              <p className="font-bold">Wi-Fi connection: coming soon</p>
              <label className="block font-bold">Device IP address:</label>
              <input
                type="text"
                value={wifiIp}
                onChange={(e) => setWifiIp(e.target.value)}
                className="w-full p-2.5 border border-purple-300 rounded-xl text-xs font-mono bg-white focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
                placeholder="192.168.4.1"
              />
              <p className="text-purple-900/70">
                Live Wi-Fi input will be enabled when the sensor device is connected. No device is connected.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
