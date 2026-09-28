import { Thermometer, Droplets } from 'lucide-react';
import type { SensorReading } from '../types';

interface SensorReadingCardProps {
  reading: SensorReading;
  sampleType: 'feed' | 'silage';
}

/** Live sensor reading tiles – moisture, temperature, optional pH */
export function SensorReadingCard({ reading, sampleType }: SensorReadingCardProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Moisture */}
      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
        <Droplets className="w-6 h-6 text-blue-500 shrink-0" aria-hidden="true" />
        <div>
          <p className="text-xs text-gray-500">Moisture</p>
          <p className="text-xl font-black text-blue-700">
            {reading.moisture_pct.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Temperature */}
      <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl">
        <Thermometer className="w-6 h-6 text-orange-500 shrink-0" aria-hidden="true" />
        <div>
          <p className="text-xs text-gray-500">Temperature</p>
          <p className="text-xl font-black text-orange-700">
            {reading.temperature_c.toFixed(1)}°C
          </p>
        </div>
      </div>

      {/* pH – silage only */}
      {sampleType === 'silage' && reading.ph !== undefined && (
        <div className="col-span-2 flex items-center gap-3 p-3 bg-purple-50 rounded-xl">
          <span
            className="text-purple-700 font-black text-lg w-6 text-center"
            aria-label="pH"
          >
            pH
          </span>
          <div>
            <p className="text-xs text-gray-500">Silage pH (anaerobic indicator)</p>
            <p className="text-xl font-black text-purple-700">
              {reading.ph.toFixed(2)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
