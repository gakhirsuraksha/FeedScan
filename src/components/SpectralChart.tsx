import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { SensorReading } from '../types';

interface SpectralChartProps {
  reading: SensorReading;
}

/** AS7341 channel definitions with wavelength labels and display colours */
const CHANNELS: { key: keyof SensorReading; label: string; color: string }[] = [
  { key: 'f1_415nm', label: '415nm', color: '#7b2d8b' },
  { key: 'f2_445nm', label: '445nm', color: '#4361ee' },
  { key: 'f3_480nm', label: '480nm', color: '#4cc9f0' },
  { key: 'f4_515nm', label: '515nm', color: '#06d6a0' },
  { key: 'f5_555nm', label: '555nm', color: '#84cc16' },
  { key: 'f6_590nm', label: '590nm', color: '#f59e0b' },
  { key: 'f7_630nm', label: '630nm', color: '#ef4444' },
  { key: 'f8_680nm', label: '680nm', color: '#b91c1c' },
];

/**
 * Live spectral bar chart for the AS7341 visible channels.
 * NIR and Clear are shown separately as they're broadband.
 */
export function SpectralChart({ reading }: SpectralChartProps) {
  const data = CHANNELS.map((ch) => ({
    label: ch.label,
    value: reading[ch.key] as number,
    color: ch.color,
  }));

  return (
    <div className="w-full space-y-1">
      <p className="text-xs font-medium text-gray-500">
        AS7341 Spectral Response (raw counts)
      </p>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip
            formatter={(v: number) => [v.toLocaleString(), 'Counts']}
            labelFormatter={(l: string) => `Channel: ${l}`}
          />
          <Bar dataKey="value" radius={[3, 3, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Clear and NIR channels shown as tiles */}
      <div className="grid grid-cols-2 gap-2 mt-2">
        <div className="p-3 bg-gray-50 rounded-xl">
          <p className="text-[11px] font-bold text-gray-500">Clear (broadband)</p>
          <p className="font-mono font-bold text-lg text-gray-900">{reading.clear.toLocaleString()}</p>
        </div>
        <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
          <p className="text-[11px] font-bold text-rose-700">Near-infrared (~910 nm)</p>
          <p className="font-mono font-bold text-lg text-rose-900">{reading.nir.toLocaleString()}</p>
        </div>
      </div>
      <p className="text-[11px] text-gray-400 pt-1">
        NIR and spectral values are captured by the sensor unit. Raw counts, not nutrient values.
      </p>
    </div>
  );
}
