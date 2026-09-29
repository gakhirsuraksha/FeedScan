import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight, PackageCheck, Activity, Cpu, CheckCircle2, History,
  Droplets, Wheat, FlaskConical, ShieldAlert, Waves, Languages, WifiOff,
} from 'lucide-react';

const MEASURES = [
  { icon: Droplets, title: 'Moisture', desc: 'Find wet or heating pockets before they spoil a lot.', tone: 'bg-sky-100 text-sky-700' },
  { icon: Wheat, title: 'Protein and fibre', desc: 'Estimated from the spectral scan of dry feed.', tone: 'bg-amber-100 text-amber-700' },
  { icon: FlaskConical, title: 'Silage pH', desc: 'Check that fermentation is on track.', tone: 'bg-lime-100 text-lime-700' },
  { icon: ShieldAlert, title: 'Adulteration flag', desc: 'Unusual response? Confirm with a laboratory.', tone: 'bg-orange-100 text-orange-700' },
];

const FACTS = [
  { icon: Waves, big: '10', small: 'spectral channels' },
  { icon: Languages, big: '3', small: 'languages: English, Tamil, Hindi' },
  { icon: WifiOff, big: 'Offline', small: 'tests save on the device' },
];

/** Illustration only: shows the shape of a result, not a real reading. */
const SAMPLE = [
  { label: 'Moisture', value: '11.8%' },
  { label: 'Protein', value: '17.2%' },
  { label: 'Fibre', value: '22.4%' },
];

const step = (n: number) => ({ animationDelay: `${n * 110}ms` });

export function LandingPage() {
  const { t } = useTranslation();

  const WORKFLOW_STEPS = [
    { icon: PackageCheck, title: t('home.step1Title'), desc: t('home.step1Desc') },
    { icon: Activity,     title: t('home.step2Title'), desc: t('home.step2Desc') },
    { icon: Cpu,          title: t('home.step3Title'), desc: t('home.step3Desc') },
    { icon: CheckCircle2, title: t('home.step4Title'), desc: t('home.step4Desc') },
  ];

  return (
    <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-5 sm:py-8 space-y-14 sm:space-y-20">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-800 via-emerald-900 to-emerald-950 text-white shadow-md">
        {/* sun and field rows */}
        <div className="absolute -right-16 -top-20 w-72 h-72 rounded-full bg-butter/25 blur-3xl" aria-hidden="true" />
        <svg className="absolute bottom-0 inset-x-0 w-full h-28 sm:h-36" viewBox="0 0 1200 160" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 78 C220 28 420 118 640 70 S1010 22 1200 72 V160 H0Z" fill="#315b26" opacity="0.75" />
          <path d="M0 112 C240 72 440 142 680 104 S1030 64 1200 106 V160 H0Z" fill="#3f742c" opacity="0.55" />
          <path d="M0 140 C260 116 460 156 700 134 S1040 112 1200 138 V160 H0Z" fill="#e5a823" opacity="0.9" />
        </svg>

        <div className="relative grid lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-12 items-center px-6 sm:px-10 lg:px-14 pt-10 sm:pt-14 pb-32 sm:pb-40">
          <div>
            <h1 className="rise text-[2rem] sm:text-5xl font-bold leading-[1.1] tracking-tight" style={step(0)}>
              {t('home.title')}
            </h1>
            <p className="rise mt-5 text-base sm:text-lg text-emerald-100 leading-relaxed max-w-lg" style={step(1)}>
              {t('home.subtitle')}
            </p>
            <div className="rise mt-8 flex flex-wrap gap-3" style={step(2)}>
              <Link to="/test" className="btn btn-gold !px-6 !py-3.5 text-base">
                {t('home.cta')}
                <ArrowRight className="w-5 h-5" aria-hidden="true" />
              </Link>
              <Link to="/history" className="btn btn-ghost !px-5 !py-3.5 text-base">
                <History className="w-4 h-4" aria-hidden="true" />
                {t('nav.history')}
              </Link>
            </div>
          </div>

          {/* Example report */}
          <div className="rise card p-5 sm:p-6 shadow-md" style={step(3)} aria-hidden="true">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-900">Example result</span>
              <span className="chip">Illustration</span>
            </div>
            <div className="mt-4 relative overflow-hidden rounded-xl border border-green-200 bg-green-50 pl-5 pr-4 py-4 flex items-center gap-4">
              <span className="absolute inset-y-0 left-0 w-1.5 bg-green-600" />
              <span className="w-12 h-12 rounded-xl bg-green-100 text-green-700 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </span>
              <div>
                <div className="font-display text-2xl font-bold text-green-800 leading-none">GOOD</div>
                <div className="text-sm text-gray-600 mt-1">Safe to feed. Indicators meet guidelines.</div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {SAMPLE.map((s) => (
                <div key={s.label} className="rounded-xl bg-gray-50 border border-gray-200 px-3 py-3">
                  <div className="text-xs text-gray-500">{s.label}</div>
                  <div className="mt-1 text-lg font-bold text-gray-900 tabular-nums">{s.value}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-end gap-1.5 h-14">
              {[30, 44, 40, 62, 78, 66, 52, 38, 84].map((h, i) => (
                <span
                  key={i}
                  className="bar-grow flex-1 rounded-t bg-gradient-to-t from-emerald-500 to-butter"
                  style={{ height: `${h}%`, animationDelay: `${600 + i * 60}ms` }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Facts */}
      <section className="grid sm:grid-cols-3 gap-4 -mt-6 sm:-mt-10 relative">
        {FACTS.map((f) => {
          const Icon = f.icon;
          return (
            <div key={f.big} className="card flex items-center gap-4 p-4 sm:p-5 shadow-sm">
              <span className="w-12 h-12 shrink-0 rounded-xl bg-emerald-800 text-butter flex items-center justify-center">
                <Icon className="w-6 h-6" aria-hidden="true" />
              </span>
              <div>
                <div className="font-display text-2xl font-bold text-emerald-900 leading-none">{f.big}</div>
                <div className="text-sm text-gray-600 mt-1 leading-snug">{f.small}</div>
              </div>
            </div>
          );
        })}
      </section>

      {/* What it measures */}
      <section>
        <h2 className="text-2xl sm:text-3xl font-bold text-emerald-950">What FeedScan checks</h2>
        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {MEASURES.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.title} className="card p-5 hover:-translate-y-0.5 hover:shadow-md transition">
                <span className={`w-12 h-12 rounded-xl flex items-center justify-center ${m.tone}`}>
                  <Icon className="w-6 h-6" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-bold text-gray-900">{m.title}</h3>
                <p className="mt-1 text-sm text-gray-600 leading-relaxed">{m.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works: a real sequence */}
      <section>
        <h2 className="text-2xl sm:text-3xl font-bold text-emerald-950">{t('home.howItWorks')}</h2>
        <ol className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-8 relative">
          <span className="hidden lg:block absolute top-5 left-[12%] right-[12%] h-0.5 bg-emerald-200" aria-hidden="true" />
          {WORKFLOW_STEPS.map((s, idx) => {
            const Icon = s.icon;
            return (
              <li key={s.title} className="relative text-center lg:text-center">
                <span className="relative mx-auto w-10 h-10 rounded-full bg-emerald-800 text-white font-bold flex items-center justify-center ring-4 ring-[#f3f6ec] tabular-nums">
                  {idx + 1}
                </span>
                <Icon className="mx-auto mt-4 w-6 h-6 text-emerald-600" aria-hidden="true" />
                <h3 className="mt-2 font-bold text-gray-900 leading-snug">{s.title}</h3>
                <p className="mt-1 text-sm text-gray-600 leading-relaxed max-w-[15rem] mx-auto">{s.desc}</p>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Closing call to action */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-800 to-emerald-900 text-white px-6 sm:px-10 py-10 sm:py-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 shadow-md">
        <div className="absolute -left-10 -bottom-16 w-56 h-56 rounded-full bg-butter/20 blur-3xl" aria-hidden="true" />
        <div className="relative">
          <h2 className="text-2xl sm:text-3xl font-bold leading-tight">Check a sample before you feed it.</h2>
          <p className="mt-2 text-emerald-100 max-w-lg text-sm sm:text-base">
            FeedScan is a screening aid. Confirm critical feeding decisions with an accredited laboratory.
          </p>
        </div>
        <Link to="/test" className="relative btn btn-gold !px-6 !py-3.5 text-base shrink-0">
          {t('home.cta')}
          <ArrowRight className="w-5 h-5" aria-hidden="true" />
        </Link>
      </section>
    </main>
  );
}
