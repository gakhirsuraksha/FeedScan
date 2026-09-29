import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  Save,
  Printer,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FlaskConical,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { TrafficLight } from '../components/TrafficLight';
import { Disclaimer } from '../components/Disclaimer';
import { SpectralChart } from '../components/SpectralChart';
import { db } from '../db';
import { formatDateTime } from '../utils/sessionId';
import type { TestSession } from '../types';

export function ResultPage() {
  const location = useLocation();
  const navigate  = useNavigate();

  const session: TestSession | undefined = location.state?.session;

  const [saved,     setSaved]     = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving,  setIsSaving]  = useState(false);

  useEffect(() => {
    if (!session) navigate('/test', { replace: true });
  }, [session, navigate]);

  if (!session) return null;

  const { modelOutput, reading, sampleType, sessionId, sampleId, batchId, feedType, createdAt } = session;
  const { estimated, classification, reasons } = modelOutput;

  const handleSave = async () => {
    if (saved) return;
    setIsSaving(true);
    try {
      await db.sessions.add(session);
      setSaved(true);
    } catch {
      setSaveError('Failed to save to local storage.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => window.print();

  // Helper for reason item styling
  const reasonItemClass = (reason: string) => {
    if (reason.includes('✓') || reason.toLowerCase().includes('within expected')) {
      return {
        icon: <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-green-700" aria-hidden="true" />,
        bg: 'bg-green-50/80 border-green-200 text-green-950',
      };
    }
    if (reason.toLowerCase().includes('flag') || reason.toLowerCase().includes('adulter') || reason.toLowerCase().includes('very high')) {
      return {
        icon: <XCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-700" aria-hidden="true" />,
        bg: 'bg-rose-50/80 border-rose-200 text-rose-950',
      };
    }
    return {
      icon: <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-700" aria-hidden="true" />,
      bg: 'bg-amber-50/80 border-amber-200 text-amber-950',
    };
  };

  const moistureStatus = () => {
    const m = estimated.moisture_pct;
    const thresh = sampleType === 'feed' ? [18, 24] : [70, 75];
    if (m > thresh[1]) return { label: 'Very High', cls: 'bg-rose-100 text-rose-800' };
    if (m > thresh[0]) return { label: 'Elevated',  cls: 'bg-amber-100 text-amber-800' };
    return { label: 'Normal', cls: 'bg-green-100 text-green-800' };
  };

  const phStatus = (ph: number) => {
    if (ph > 5.0) return { label: 'High – Spoilage Risk', cls: 'bg-rose-100 text-rose-800' };
    if (ph > 4.5) return { label: 'Elevated',             cls: 'bg-amber-100 text-amber-800' };
    return { label: 'Normal (3.8–4.5)',   cls: 'bg-green-100 text-green-800' };
  };

  const mStatus = moistureStatus();

  return (
    <main className="page">
      {/* Top bar with back button & metadata */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          aria-label="Back to test setup"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Back</span>
        </button>

        <div className="text-right">
          <div className="text-xs font-mono font-bold text-gray-800">{sessionId}</div>
          <div className="text-[11px] text-gray-400">{formatDateTime(createdAt)}</div>
        </div>
      </div>

      {/* ── Sample summary banner ─────────────────────────────── */}
      <div className="card p-3.5 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div>
          <span className="text-gray-400">Sample:</span>{' '}
          <strong className="text-gray-800 font-semibold">{sampleId}</strong>
          <span className="mx-2 text-gray-300">|</span>
          <span className="text-gray-400">Type:</span>{' '}
          <strong className="text-gray-800 font-semibold">{feedType}</strong>
        </div>
        <div>
          <span className="text-gray-400">Batch:</span>{' '}
          <strong className="text-gray-800 font-semibold">{batchId}</strong>
        </div>
      </div>

      {/* ── Large Result Hero Card ────────────────────────────── */}
      <section className="space-y-4" aria-label="Quality evaluation result">
        <TrafficLight classification={classification} large />

        {/* Diagnostic Reasons */}
        <div className="card p-5 sm:p-6 space-y-4">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-700" aria-hidden="true" />
            Key Diagnostic Findings
          </h3>
          <ul className="space-y-2.5">
            {reasons.slice(0, 3).map((reason, i) => {
              const style = reasonItemClass(reason);
              return (
                <li
                  key={i}
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border text-sm font-medium leading-relaxed ${style.bg}`}
                >
                  {style.icon}
                  <span>{reason}</span>
                </li>
              );
            })}
          </ul>

          {/* Actionable recommendation box */}
          <div className="pt-2">
            <div className="note note-brand p-4">
              <h4 className="text-xs font-bold text-emerald-800 mb-1">
                Feeding Recommendation
              </h4>
              <p className="text-sm font-medium leading-relaxed">
                {classification === 'GOOD' &&
                  'Feed quality indicators meet expected nutritional thresholds. Continue standard ration feeding practices and maintain dry, well-ventilated storage.'}
                {classification === 'CHECK' &&
                  'Certain parameters fall outside optimal range. Inspect the lot for localized heating or moisture pockets. Blend with verified high-quality stock or obtain laboratory testing before primary feeding.'}
                {classification === 'ACTION_REQUIRED' &&
                  'Significant quality or spoilage risk detected. Do not distribute this lot to cattle without certified laboratory clearance. Quarantine the batch and consult a dairy nutritionist or veterinarian.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Estimated Values Table ───────────────────────────── */}
      <section className="space-y-2.5" aria-label="Estimated parameter values">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">Estimated Nutrient &amp; Physical Values</h3>
          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            Sensor-derived
          </span>
        </div>

        <div className="card overflow-hidden">
          <table className="data-table w-full text-sm">
            <thead>
              <tr>
                <th>
                  Parameter
                </th>
                <th>
                  Estimated Value
                </th>
                <th>
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {/* Moisture */}
              <tr>
                <td className="p-3 font-medium text-gray-800">Moisture Content</td>
                <td className="p-3 font-mono font-bold text-gray-950">
                  {estimated.moisture_pct.toFixed(1)}%
                </td>
                <td className="p-3">
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${mStatus.cls}`}>
                    {mStatus.label}
                  </span>
                </td>
              </tr>

              {/* Crude Protein – feed only */}
              {sampleType === 'feed' && estimated.protein_pct !== undefined && (
                <tr>
                  <td className="p-3 font-medium text-gray-800">
                    Crude Protein <span className="text-xs text-gray-400 font-normal">(Estimated)</span>
                  </td>
                  <td className="p-3 font-mono font-bold text-gray-950">
                    {estimated.protein_pct.toFixed(1)}%
                  </td>
                  <td className="p-3">
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-semibold">
                      Estimated
                    </span>
                  </td>
                </tr>
              )}

              {/* Crude Fiber – feed only */}
              {sampleType === 'feed' && estimated.fiber_pct !== undefined && (
                <tr>
                  <td className="p-3 font-medium text-gray-800">
                    Crude Fiber <span className="text-xs text-gray-400 font-normal">(Estimated)</span>
                  </td>
                  <td className="p-3 font-mono font-bold text-gray-950">
                    {estimated.fiber_pct.toFixed(1)}%
                  </td>
                  <td className="p-3">
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-semibold">
                      Estimated
                    </span>
                  </td>
                </tr>
              )}

              {/* pH – silage only */}
              {sampleType === 'silage' && estimated.ph !== undefined && (() => {
                const ps = phStatus(estimated.ph);
                return (
                  <tr>
                    <td className="p-3 font-medium text-gray-800">Silage pH</td>
                    <td className="p-3 font-mono font-bold text-gray-950">{estimated.ph.toFixed(2)}</td>
                    <td className="p-3">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${ps.cls}`}>
                        {ps.label}
                      </span>
                    </td>
                  </tr>
                );
              })()}

              {/* Adulteration Screening */}
              <tr>
                <td className="p-3 font-medium text-gray-800">
                  Adulteration Screening <span className="text-xs text-gray-400 font-normal">(spectral)</span>
                </td>
                <td colSpan={2} className="p-3">
                  {estimated.adulterationFlag ? (
                    <span className="inline-flex items-center gap-1.5 text-rose-800 font-bold text-xs">
                      <FlaskConical className="w-3.5 h-3.5" aria-hidden="true" />
                      Screening flag raised — confirm with lab
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-emerald-800">
                      Standard spectral response ✓
                    </span>
                  )}
                </td>
              </tr>

              {/* Spoilage Risk */}
              <tr>
                <td className="p-3 font-medium text-gray-800">Spoilage Indicator</td>
                <td colSpan={2} className="p-3">
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                      estimated.spoilageRisk
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {estimated.spoilageRisk ? 'Elevated Spoilage Risk' : 'Low Spoilage Risk'}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Spectral chart card ──────────────────────────────── */}
      <section className="card p-5" aria-label="Spectral reading chart">
        <h3 className="text-sm font-bold text-gray-900 mb-2">Optical Sensor Response</h3>
        <SpectralChart reading={reading} />
      </section>

      {/* ── Honest screening disclaimers ─────────────────────── */}
      <div className="space-y-3">
        <p className="text-xs text-gray-500 px-1">
          Assessed by a machine-learning model (Random Forest, bootstrap-trained on synthetic data) with rule-based safety checks. It will be retrained on laboratory-referenced samples.
        </p>
        <Disclaimer variant="screening" />
        {estimated.adulterationFlag && <Disclaimer variant="toxin" />}
      </div>

      {/* ── Actions ──────────────────────────────────────────── */}
      <div className="flex gap-3 no-print" role="group" aria-label="Result actions">
        <button
          type="button"
          onClick={handleSave}
          disabled={saved || isSaving}
          className={`btn flex-1 ${
            saved
              ? 'bg-green-100 text-green-800 cursor-default'
              : 'btn-primary'
          } disabled:opacity-80`}
        >
          <Save className="w-4 h-4" aria-hidden="true" />
          {isSaving ? 'Saving…' : saved ? 'Saved to Records ✓' : 'Save Result'}
        </button>

        <button
          type="button"
          onClick={handlePrint}
          className="btn btn-secondary flex items-center justify-center gap-2 bg-white hover:bg-gray-50 transition-colors"
        >
          <Printer className="w-4 h-4" aria-hidden="true" />
          Print
        </button>
      </div>

      {saveError && (
        <p role="alert" className="text-sm text-rose-600 text-center font-medium">
          {saveError}
        </p>
      )}

      {/* ── New test link ────────────────────────────────────── */}
      <div className="text-center pt-1 no-print">
        <Link
          to="/test"
          className="inline-flex items-center gap-2 text-emerald-800 text-sm font-bold hover:underline"
        >
          <RotateCcw className="w-4 h-4" aria-hidden="true" />
          Start New Test
        </Link>
      </div>
    </main>
  );
}
