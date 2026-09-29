import { useEffect, useState } from 'react';

const KEY = 'feedscan-splash-seen';

function shouldShow(): boolean {
  try {
    if (sessionStorage.getItem(KEY)) return false;
  } catch { /* storage unavailable: show once per load */ }
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Grain positions along the stalk: [cx, cy, rotation] */
const GRAINS: Array<[number, number, number]> = [
  [50, 20, 0],
  [40, 38, -32], [60, 38, 32],
  [39, 54, -32], [61, 54, 32],
  [38, 70, -32], [62, 70, 32],
  [38, 86, -32], [62, 86, 32],
];

/**
 * Opening sequence: a wheat stalk draws itself, the wordmark fades in, then the
 * screen lifts like a curtain. Plays once per session, skippable, and skipped
 * entirely when the user prefers reduced motion.
 */
export function SplashScreen() {
  const [phase, setPhase] = useState<'show' | 'leave' | 'gone'>(() => (shouldShow() ? 'show' : 'gone'));

  useEffect(() => {
    if (phase !== 'show') return;
    document.documentElement.classList.add('splash-on');
    const t = setTimeout(() => setPhase('leave'), 2100);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'leave') return;
    document.documentElement.classList.remove('splash-on');
    try { sessionStorage.setItem(KEY, '1'); } catch { /* ignore */ }
    const t = setTimeout(() => setPhase('gone'), 700);
    return () => clearTimeout(t);
  }, [phase]);

  if (phase === 'gone') return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-b from-emerald-900 via-emerald-800 to-emerald-950 text-white ${phase === 'leave' ? 'splash-leave' : ''}`}
      aria-hidden={phase === 'leave'}
    >
      <div className="absolute w-80 h-80 rounded-full bg-butter/20 blur-3xl" aria-hidden="true" />
      <svg viewBox="0 0 100 140" className="relative w-24 h-32 sm:w-28 sm:h-40" fill="none" aria-hidden="true">
        <path
          className="splash-stem"
          pathLength={1}
          d="M50 136 V28"
          stroke="#e5a823"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {GRAINS.map(([cx, cy, rot], i) => (
          <g key={i} transform={`rotate(${rot} ${cx} ${cy})`}>
            <ellipse className="splash-grain" style={{ ['--i' as string]: i }} cx={cx} cy={cy} rx="5.5" ry="11" fill="#e5a823" />
          </g>
        ))}
      </svg>
      <div className="splash-word relative mt-6 text-center">
        <div className="font-display text-4xl sm:text-5xl font-bold tracking-tight">FeedScan</div>
        <div className="mt-2 text-sm sm:text-base text-emerald-100/80">Feed &amp; silage quality testing</div>
      </div>
      <button
        type="button"
        onClick={() => setPhase('leave')}
        className="absolute bottom-8 text-xs font-semibold text-emerald-100/70 hover:text-white underline underline-offset-4 min-h-11 px-4"
      >
        Skip intro
      </button>
    </div>
  );
}
