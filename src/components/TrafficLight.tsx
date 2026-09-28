import { CheckCircle2, AlertTriangle, AlertOctagon } from 'lucide-react';
import type { Classification } from '../types';

interface TrafficLightProps {
  classification: Classification;
  large?: boolean;
}

const STATUS_CONFIG: Record<
  Classification,
  {
    icon: typeof CheckCircle2;
    label: string;
    sub: string;
    containerClass: string;
    textClass: string;
    badgeClass: string;
    iconClass: string;
  }
> = {
  GOOD: {
    icon: CheckCircle2,
    label: 'GOOD',
    sub: 'Feed quality indicators meet standard nutritional guidelines',
    containerClass: 'bg-emerald-50/90 border-emerald-300 ring-4 ring-emerald-50',
    textClass: 'text-emerald-950',
    badgeClass: 'bg-emerald-700 text-white',
    iconClass: 'text-emerald-700',
  },
  CHECK: {
    icon: AlertTriangle,
    label: 'CHECK',
    sub: 'One or more parameters outside standard range — inspect before use',
    containerClass: 'bg-amber-50/90 border-amber-300 ring-4 ring-amber-50',
    textClass: 'text-amber-950',
    badgeClass: 'bg-amber-600 text-white',
    iconClass: 'text-amber-600',
  },
  ACTION_REQUIRED: {
    icon: AlertOctagon,
    label: 'ACTION REQUIRED',
    sub: 'Significant quality or spoilage risk detected — do not feed without laboratory clearance',
    containerClass: 'bg-rose-50/90 border-rose-300 ring-4 ring-rose-50',
    textClass: 'text-rose-950',
    badgeClass: 'bg-rose-700 text-white',
    iconClass: 'text-rose-700',
  },
};

/**
 * Large traffic-light header badge.
 * Provides accessible icon, high-contrast label, and clear advisory state.
 */
export function TrafficLight({ classification, large = true }: TrafficLightProps) {
  const cfg = STATUS_CONFIG[classification];
  const Icon = cfg.icon;

  return (
    <div
      role="status"
      aria-label={`Classification: ${cfg.label} — ${cfg.sub}`}
      className={`flex flex-col items-center justify-center text-center p-6 sm:p-8 rounded-3xl border-2 transition-all ${cfg.containerClass}`}
    >
      <div className="p-3 rounded-2xl bg-white shadow-xs mb-3">
        <Icon
          className={`${large ? 'w-16 h-16 sm:w-20 sm:h-20' : 'w-10 h-10'} ${cfg.iconClass}`}
          strokeWidth={2}
          aria-hidden="true"
        />
      </div>
      <span className={`text-xs font-black tracking-widest px-3 py-1 rounded-full uppercase mb-2 ${cfg.badgeClass}`}>
        Quality Status
      </span>
      <h2 className={`font-black tracking-tight ${large ? 'text-3xl sm:text-4xl' : 'text-xl'} ${cfg.textClass}`}>
        {cfg.label}
      </h2>
      <p className={`text-xs sm:text-sm font-medium mt-1.5 max-w-sm ${cfg.textClass} opacity-85 leading-snug`}>
        {cfg.sub}
      </p>
    </div>
  );
}
