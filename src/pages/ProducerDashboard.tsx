import { useEffect, useState } from 'react';
import { ref, set, onValue, remove } from 'firebase/database';
import { Factory, Save, Trash2, Info } from 'lucide-react';
import { rtdb } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import type { BatchRecord } from '../types';

const emptyForm = {
  batchId: '', sampleType: 'feed' as 'feed' | 'silage', feedType: '',
  moisture_pct: '', ph: '', protein_pct: '', fiber_pct: '', notes: '',
};

/**
 * Producer-facing page. Publishes batch reference data to the SHARED
 * Realtime Database (/batches/{batchId}), visible to any farmer who looks up
 * that batch ID on the Batch page — unlike a farmer's own test results,
 * which stay local to their device.
 */
export function ProducerDashboard() {
  const { user } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [myBatches, setMyBatches] = useState<BatchRecord[] | null>(null);

  useEffect(() => {
    if (!user) return;
    // Realtime Database has no server-side "where producerId = me" query without
    // extra indexing, so for this scale we read the whole node and filter here.
    const unsub = onValue(ref(rtdb, 'batches'), (snap) => {
      const all = (snap.val() as Record<string, BatchRecord> | null) ?? {};
      setMyBatches(
        Object.values(all)
          .filter((b) => b.producerId === user.uid)
          .sort((a, b) => b.updatedAt - a.updatedAt),
      );
    }, () => setMyBatches([]));
    return () => unsub();
  }, [user]);

  const update = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError(null);
    setSavedMsg(null);

    const batchId = form.batchId.trim();
    if (!batchId) { setError('Batch ID is required.'); return; }
    // Realtime Database keys cannot contain . $ # [ ] /
    if (/[.$#\[\]/]/.test(batchId)) {
      setError('Batch ID cannot contain . $ # [ ] or /. Use letters, numbers, - or _.');
      return;
    }
    for (const k of ['moisture_pct', 'ph', 'protein_pct', 'fiber_pct'] as const) {
      if (form[k] !== '' && !Number.isFinite(Number(form[k]))) {
        setError('Moisture, pH, protein and fibre must be numbers.');
        return;
      }
    }

    setSaving(true);
    try {
      const now = Date.now();
      const record: BatchRecord = {
        batchId,
        producerId: user.uid,
        producerName: user.displayName || user.email || 'Unknown producer',
        sampleType: form.sampleType,
        feedType: form.feedType.trim() || undefined,
        moisture_pct: form.moisture_pct ? Number(form.moisture_pct) : undefined,
        ph: form.ph ? Number(form.ph) : undefined,
        protein_pct: form.protein_pct ? Number(form.protein_pct) : undefined,
        fiber_pct: form.fiber_pct ? Number(form.fiber_pct) : undefined,
        notes: form.notes.trim() || undefined,
        createdAt: now,
        updatedAt: now,
      };
      // Realtime Database rejects `undefined`, so drop the empty optional fields.
      const clean = Object.fromEntries(
        Object.entries(record).filter(([, v]) => v !== undefined),
      );
      await set(ref(rtdb, `batches/${batchId}`), clean);
      setSavedMsg(`Batch "${batchId}" published.`);
      setForm(emptyForm);
    } catch (err) {
      setError((err as { message?: string })?.message ?? 'Could not save this batch. Check your connection.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (batchId: string) => {
    if (!confirm(`Remove batch "${batchId}" from the shared database?`)) return;
    try {
      await remove(ref(rtdb, `batches/${batchId}`));
    } catch (err) {
      setError((err as { message?: string })?.message ?? 'Could not delete this batch.');
    }
  };

  return (
    <main className="page">
      <div>
        <h1 className="page-title flex items-center gap-2.5">
          <Factory className="w-6 h-6 text-emerald-800" />
          Producer Dashboard
        </h1>
        <p className="page-sub">Publish batch reference data farmers can look up by batch ID</p>
      </div>

      <div className="note note-brand p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-emerald-800 mt-0.5 shrink-0" />
        <p className="text-xs text-emerald-900/90 leading-relaxed">
          These figures are what you declare for the batch. They are shown to farmers as
          <strong> producer-declared reference values</strong>, alongside — not instead of — their own on-farm test
          results for the same batch ID.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Batch ID *" value={form.batchId} onChange={(v) => update('batchId', v)} placeholder="BAT-00123" />
          <div>
            <label className="label">Sample type</label>
            <select
              value={form.sampleType}
              onChange={(e) => update('sampleType', e.target.value)}
              className="field mt-1 w-full"
            >
              <option value="feed">Dry Feed</option>
              <option value="silage">Silage</option>
            </select>
          </div>
        </div>

        <Field label="Feed / product name" value={form.feedType} onChange={(v) => update('feedType', v)} placeholder="e.g. Maize Silage" />

        <div className="grid grid-cols-2 gap-3">
          <Field label="Moisture (%)" value={form.moisture_pct} onChange={(v) => update('moisture_pct', v)} type="number" step="0.1" />
          {form.sampleType === 'silage' && (
            <Field label="pH" value={form.ph} onChange={(v) => update('ph', v)} type="number" step="0.01" />
          )}
          <Field label="Protein (%)" value={form.protein_pct} onChange={(v) => update('protein_pct', v)} type="number" step="0.1" />
          <Field label="Fiber (%)" value={form.fiber_pct} onChange={(v) => update('fiber_pct', v)} type="number" step="0.1" />
        </div>

        <div>
          <label className="label">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => update('notes', e.target.value)}
            rows={2}
            className="field mt-1 w-full resize-none"
          />
        </div>

        {error && <p className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-100 rounded-xl p-2.5">{error}</p>}
        {savedMsg && <p className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-xl p-2.5">{savedMsg}</p>}

        <button
          type="submit"
          disabled={saving}
          className="btn btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Publish batch'}
        </button>
      </form>

      <section className="space-y-3">
        <h2 className="text-xs font-bold text-gray-400">Your published batches</h2>
        {myBatches === null && <p className="text-sm text-gray-400">Loading…</p>}
        {myBatches?.length === 0 && <p className="text-sm text-gray-400">You haven't published any batches yet.</p>}
        {myBatches?.map((b) => (
          <div key={b.batchId} className="card p-4 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-gray-900 truncate">{b.batchId} <span className="text-gray-400 font-normal">· {b.sampleType}</span></p>
              <p className="text-xs text-gray-500 truncate">
                {b.feedType ? `${b.feedType} · ` : ''}
                {b.moisture_pct !== undefined ? `Moisture ${b.moisture_pct}% · ` : ''}
                {b.ph !== undefined ? `pH ${b.ph}` : ''}
              </p>
            </div>
            <button type="button" onClick={() => handleDelete(b.batchId)} className="text-rose-700 shrink-0" aria-label="Delete batch">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </section>
    </main>
  );
}

function Field({
  label, value, onChange, placeholder, type = 'text', step,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; step?: string }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        type={type}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="field mt-1 w-full"
      />
    </div>
  );
}
