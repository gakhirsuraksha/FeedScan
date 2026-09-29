import { CheckCircle2, AlertTriangle, AlertOctagon } from 'lucide-react';
import type { Classification } from '../types';

interface TrafficLightProps {
  classification: Classification;
  large?: boolean;
  /** Renders a small inline pill (icon + label only) instead of the full card. */
  compact?: boolean;
}

const STATUS_CONFIG: Record<
  Classification,
  { icon: typeof CheckCircle2; label: string; sub: string; bar: string; tint: string; text: string; badgeClass: string }
> = {
  GOOD: {
    icon: CheckCircle2,
    label: 'GOOD',
    sub: 'Feed quality indicators meet standard nutritional guidelines',
    bar: 'bg-green-600', tint: 'bg-green-100 text-green-700', text: 'text-green-800',
    badgeClass: 'bg-green-100 text-green-800 ring-1 ring-green-200',
  },
  CHECK: {
    icon: AlertTriangle,
    label: 'CHECK',
    sub: 'One or more parameters outside standard range — inspect before use',
    bar: 'bg-amber-500', tint: 'bg-amber-100 text-amber-700', text: 'text-amber-800',
    badgeClass: 'bg-amber-100 text-amber-900 ring-1 ring-amber-200',
  },
  ACTION_REQUIRED: {
    icon: AlertOctagon,
    label: 'ACTION REQUIRED',
    sub: 'Significant quality or spoilage risk detected — do not feed without laboratory clearance',
    bar: 'bg-red-600', tint: 'bg-red-100 text-red-700', text: 'text-red-800',
    badgeClass: 'bg-red-100 text-red-800 ring-1 ring-red-200',
  },
};

/** Report-style verdict: coloured edge, tinted icon, large label. */
export function TrafficLight({ classification, large = true, compact = false }: TrafficLightProps) {
  const cfg = STATUS_CONFIG[classification];
  const Icon = cfg.icon;

  if (compact) {
    return (
      <span
        role="status"
        aria-label={`Classification: ${cfg.label}`}
        className={`inline-flex items-center gap-1.5 shrink-0 px-2.5 py-1 rounded-full text-xs font-bold ${cfg.badgeClass}`}
      >
        <Icon className="w-3.5 h-3.5" aria-hidden="true" />
        {cfg.label}
      </span>
    );
  }

  return (
    <div
      role="status"
      aria-label={`Classification: ${cfg.label} — ${cfg.sub}`}
      className="card relative overflow-hidden flex items-center gap-4 sm:gap-6 pl-6 pr-5 py-5 sm:py-7 shadow-sm"
    >
      <span className={`absolute inset-y-0 left-0 w-2 ${cfg.bar}`} aria-hidden="true" />
      <span className={`shrink-0 rounded-2xl flex items-center justify-center ${cfg.tint} ${large ? 'w-16 h-16 sm:w-20 sm:h-20' : 'w-12 h-12'}`}>
        <Icon className={large ? 'w-9 h-9 sm:w-11 sm:h-11' : 'w-7 h-7'} strokeWidth={1.9} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-gray-500">Quality status</p>
        <h2 className={`font-extrabold tracking-tight leading-none mt-1.5 ${cfg.text} ${large ? 'text-3xl sm:text-4xl' : 'text-xl'}`}>
          {cfg.label}
        </h2>
        <p className="text-sm sm:text-[15px] text-gray-600 mt-2 leading-snug">{cfg.sub}</p>
      </div>
    </div>
  );
}
