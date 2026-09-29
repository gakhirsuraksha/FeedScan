import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { ref, get } from 'firebase/database';
import QRCode from 'qrcode';
import { QrCode, Info, Search, Factory } from 'lucide-react';
import { db } from '../db';
import { rtdb } from '../firebase/config';
import { TrafficLight } from '../components/TrafficLight';
import { formatDateTime } from '../utils/sessionId';
import type { TestSession, BatchRecord } from '../types';

/**
 * Batch traceability. Looks up saved test sessions on THIS device by batch ID,
 * and renders a QR code linking to this page for a given batch.
 *
 * Honesty note: there is no shared server, so scanning this QR on another
 * device will not show these results — only the device that ran the tests
 * has them. This page states that plainly rather than implying a shared
 * cloud record.
 */
export function BatchPage() {
  const [params, setParams] = useSearchParams();
  const batchIdParam = params.get('batchId') ?? '';
  const [input, setInput] = useState(batchIdParam);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [producerRecord, setProducerRecord] = useState<BatchRecord | null | undefined>(undefined);

  const sessions = useLiveQuery(
    () => (batchIdParam
      ? db.sessions.where('batchId').equals(batchIdParam).reverse().sortBy('createdAt')
      : Promise.resolve<TestSession[]>([])),
    [batchIdParam],
  );

  useEffect(() => {
    if (!canvasRef.current || !batchIdParam) return;
    const url = `${window.location.origin}/batch?batchId=${encodeURIComponent(batchIdParam)}`;
    QRCode.toCanvas(canvasRef.current, url, { width: 176, margin: 1, color: { dark: '#064e3b' } });
  }, [batchIdParam]);

  // Shared, cross-device data a producer may have published for this batch ID.
  useEffect(() => {
    if (!batchIdParam) { setProducerRecord(undefined); return; }
    let cancelled = false;
    setProducerRecord(undefined);
    get(ref(rtdb, `batches/${batchIdParam}`))
      .then((snap) => { if (!cancelled) setProducerRecord(snap.exists() ? (snap.val() as BatchRecord) : null); })
      .catch(() => { if (!cancelled) setProducerRecord(null); });
    return () => { cancelled = true; };
  }, [batchIdParam]);

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const v = input.trim();
    if (v) setParams({ batchId: v });
  };

  return (
    <main className="page">
      <div>
        <h1 className="page-title flex items-center gap-2.5">
          <QrCode className="w-6 h-6 text-emerald-800" />
          Batch Traceability
        </h1>
        <p className="page-sub">Look up saved test results for a feed or silage batch</p>
      </div>

      <div className="note note-warn p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-800 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-900/90 leading-relaxed">
          <strong>Producer-declared reference values</strong> (if published) are shared and visible to anyone with
          the batch ID. Your own <strong>on-farm test results</strong> below are saved on this device only, and are
          not automatically shared with other devices.
        </p>
      </div>

      <form onSubmit={handleLookup} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter batch ID (e.g. BAT-XXXXX)"
            className="field w-full pl-9 pr-3"
          />
        </div>
        <button type="submit" className="btn btn-primary shrink-0">
          Look up
        </button>
      </form>

      {batchIdParam && (
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-4">
            <canvas ref={canvasRef} className="rounded-xl border border-gray-100 shrink-0" />
            <div>
              <p className="text-xs font-bold text-gray-400">Batch ID</p>
              <p className="font-mono font-bold text-lg text-gray-900 break-all">{batchIdParam}</p>
              <p className="text-xs text-gray-500 mt-1">
                {sessions === undefined ? 'Loading…' : `${sessions.length} on-device test${sessions.length === 1 ? '' : 's'}`}
              </p>
            </div>
          </div>

          {producerRecord === undefined && (
            <p className="text-xs text-gray-400">Checking for producer-published data…</p>
          )}

          {producerRecord && (
            <div className="note note-brand p-4 space-y-2">
              <p className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <Factory className="w-3.5 h-3.5" /> Producer-declared reference — {producerRecord.producerName}
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {producerRecord.feedType && <BatchStat label="Product" value={producerRecord.feedType} />}
                {producerRecord.moisture_pct !== undefined && <BatchStat label="Moisture" value={`${producerRecord.moisture_pct}%`} />}
                {producerRecord.ph !== undefined && <BatchStat label="pH" value={String(producerRecord.ph)} />}
                {producerRecord.protein_pct !== undefined && <BatchStat label="Protein" value={`${producerRecord.protein_pct}%`} />}
                {producerRecord.fiber_pct !== undefined && <BatchStat label="Fiber" value={`${producerRecord.fiber_pct}%`} />}
              </div>
              {producerRecord.notes && <p className="text-xs text-emerald-900/80 pt-1">{producerRecord.notes}</p>}
              <p className="text-[10px] text-emerald-900/60 pt-1">
                Published {formatDateTime(producerRecord.updatedAt)}. As declared by the producer — not independently verified.
              </p>
            </div>
          )}

          {producerRecord === null && (
            <p className="text-xs text-gray-400">No producer-published data found for this batch ID.</p>
          )}

          {sessions && sessions.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">
              No on-device test results found for this batch ID.
            </p>
          )}

          {sessions && sessions.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-gray-100">
              {sessions.map((s) => (
                <div key={s.id} className="flex items-center gap-3 p-3 bg-gray-50/70 rounded-xl">
                  <TrafficLight classification={s.modelOutput.classification} compact />
                  <div className="flex-1 min-w-0 text-xs">
                    <p className="font-bold text-gray-900 truncate">{s.sampleId} · {s.sampleType}</p>
                    <p className="text-gray-500">{formatDateTime(s.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}

function BatchStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/70 rounded-xl border border-emerald-100 p-2">
      <p className="text-[10px] font-bold text-emerald-800/70">{label}</p>
      <p className="font-mono font-bold text-emerald-950">{value}</p>
    </div>
  );
}
