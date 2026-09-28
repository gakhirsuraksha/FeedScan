import { Link } from 'react-router-dom';
import {
  ArrowRight,
  PackageCheck,
  Activity,
  Cpu,
  CheckCircle2,
} from 'lucide-react';

const WORKFLOW_STEPS = [
  {
    icon: PackageCheck,
    title: 'Place sample',
    desc: 'Load a small portion of feed or silage',
  },
  {
    icon: Activity,
    title: 'Sensors read',
    desc: 'Spectral, moisture, pH, and temp telemetry',
  },
  {
    icon: Cpu,
    title: 'AI analyses',
    desc: 'Rapid nutritional and spoilage screening',
  },
  {
    icon: CheckCircle2,
    title: 'Get advice',
    desc: 'Clear status and feeding recommendation',
  },
];

export function LandingPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-8 sm:py-12 space-y-10">
      {/* Hero section */}
      <section className="text-center space-y-4 pt-2">
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight leading-tight">
          Rapid Feed &amp; Silage Quality Testing
        </h1>

        <p className="text-gray-600 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
          Instant on-farm quality screening and decision support for dairy cattle feed.
        </p>

        <div className="pt-2">
          <Link
            to="/test"
            className="inline-flex items-center justify-center gap-2.5 bg-emerald-800 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-md active:scale-98"
          >
            Start Test
            <ArrowRight className="w-5 h-5" aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* How it works row */}
      <section className="space-y-4">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center">
          How It Works
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {WORKFLOW_STEPS.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className="bg-white border border-gray-200/80 rounded-2xl p-4 flex flex-col items-center text-center shadow-xs"
              >
                <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider mb-0.5">
                  Step {idx + 1}
                </div>
                <h3 className="font-bold text-sm text-gray-900 leading-snug">
                  {step.title}
                </h3>
                <p className="text-xs text-gray-500 mt-1 leading-normal">
                  {step.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
