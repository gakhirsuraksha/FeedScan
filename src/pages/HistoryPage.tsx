import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  History, Play, Info, Download, Trash2, ChevronDown, QrCode, Search,
} from 'lucide-react';
import { db } from '../db';
import { downloadSessionsCsv } from '../utils/csv';
import { TrafficLight } from '../components/TrafficLight';
import { formatDateTime } from '../utils/sessionId';
import type { TestSession } from '../types';

type Filter = 'all' | 'feed' | 'silage';

export function HistoryPage() {
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<number | null>(null);

  // Live-updating read from IndexedDB — reflects new saves immediately, no manual refresh.
  const sessions = useLiveQuery(
    () => db.sessions.orderBy('createdAt').reverse().toArray(),
    [],
  );

  const filtered = useMemo(() => {
    if (!sessions) return undefined;
    const q = query.trim().toLowerCase();
    return sessions.filter((s) => {
      if (filter !== 'all' && s.sampleType !== filter) return false;
      if (!q) return true;
      return (
        s.sampleId.toLowerCase().includes(q) ||
        s.batchId.toLowerCase().includes(q) ||
        (s.feedType ?? '').toLowerCase().includes(q)
      );
    });
  }, [sessions, filter, query]);

  const handleDelete = async (id: number | undefined) => {
    if (id === undefined) return;
    if (!confirm('Delete this saved test? This cannot be undone.')) return;
    await db.sessions.delete(id);
  };

  const isLoading = sessions === undefined;
  const isEmpty = !isLoading && sessions.length === 0;

  return (
    <main className="page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2.5">
            <History className="w-6 h-6 text-emerald-800" />
            Test History
          </h1>
          <p className="page-sub">Saved quality assessments stored on this device</p>
        </div>
      </div>

      <div className="note note-brand p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-emerald-800 mt-0.5 shrink-0" />
        <div className="text-sm text-emerald-950">
          <p className="font-bold">Offline Storage Active</p>
          <p className="text-xs text-emerald-900/80 mt-0.5">
            Records are saved in this browser's local database only. They are not shared with other devices
            unless you export the CSV below.
          </p>
        </div>
      </div>

      {!isEmpty && (
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="flex gap-2 shrink-0">
            {(['all', 'feed', 'silage'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                  filter === f
                    ? 'bg-emerald-800 text-white border-emerald-800'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300'
                }`}
              >
                {f === 'all' ? 'All' : f === 'feed' ? 'Feed' : 'Silage'}
              </button>
            ))}
          </div>
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search sample ID or batch ID…"
              className="field w-full pl-9 pr-3"
            />
          </div>
          <button
            type="button"
            onClick={() => downloadSessionsCsv(filtered ?? [])}
            disabled={!filtered || filtered.length === 0}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gray-900 text-white disabled:opacity-40 shrink-0"
          >
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
        </div>
      )}

      {isLoading && (
        <p className="text-sm text-gray-400 text-center py-10">Loading saved tests…</p>
      )}

      {isEmpty && (
        <div className="card p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-400 mx-auto flex items-center justify-center">
            <History className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-gray-600 max-w-sm mx-auto leading-relaxed">
            No previous assessments found in local storage. Complete and save a test to view records and trends.
          </p>
          <Link
            to="/test"
            className="btn btn-primary inline-flex items-center gap-2"
          >
            <Play className="w-4 h-4 fill-current" /> Start New Test
          </Link>
        </div>
      )}

      {filtered && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((s) => (
            <HistoryRow
              key={s.id}
              session={s}
              open={openId === s.id}
              onToggle={() => setOpenId(openId === s.id ? null : (s.id as number))}
              onDelete={() => handleDelete(s.id)}
            />
          ))}
        </div>
      )}

      {filtered && filtered.length === 0 && !isEmpty && (
        <p className="text-sm text-gray-400 text-center py-8">No records match this search.</p>
      )}
    </main>
  );
}

function HistoryRow({
  session, open, onToggle, onDelete,
}: { session: TestSession; open: boolean; onToggle: () => void; onDelete: () => void }) {
  const { modelOutput, reading, sampleId, batchId, sampleType, feedType, createdAt } = session;
  return (
    <div className="card overflow-hidden">
      <button type="button" onClick={onToggle} className="w-full flex items-center gap-3 p-4 text-left">
        <StatusDot classification={modelOutput.classification} />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 text-sm truncate">
            {sampleId} <span className="font-normal text-gray-400">·</span>{' '}
            <span className="capitalize text-gray-600">{sampleType}</span>
          </p>
          <p className="text-xs text-gray-500 truncate">
            {feedType ? `${feedType} · ` : ''}Batch {batchId} · {formatDateTime(createdAt)}
          </p>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="border-t border-gray-100 p-4 space-y-4 bg-gray-50/60">
          <TrafficLight classification={modelOutput.classification} />
          <div className="grid grid-cols-2 gap-2 text-xs">
            <Stat label="Moisture (est.)" value={`${modelOutput.estimated.moisture_pct.toFixed(1)}%`} />
            {sampleType === 'feed' && (
              <>
                <Stat label="Protein (est.)" value={`${modelOutput.estimated.protein_pct?.toFixed(1)}%`} />
                <Stat label="Fiber (est.)" value={`${modelOutput.estimated.fiber_pct?.toFixed(1)}%`} />
              </>
            )}
            {sampleType === 'silage' && (
              <Stat label="pH" value={reading.ph !== undefined ? reading.ph.toFixed(2) : '—'} />
            )}
            <Stat label="Temperature" value={`${reading.temperature_c.toFixed(1)}°C`} />
          </div>
          <div className="flex items-center justify-between gap-2 pt-1">
            <Link
              to={`/batch?batchId=${encodeURIComponent(batchId)}`}
              className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:underline"
            >
              <QrCode className="w-3.5 h-3.5" /> View batch
            </Link>
            <button
              type="button"
              onClick={onDelete}
              className="flex items-center gap-1.5 text-xs font-bold text-rose-700 hover:underline"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-2.5">
      <p className="text-[10px] font-bold text-gray-400">{label}</p>
      <p className="font-mono font-bold text-gray-900">{value}</p>
    </div>
  );
}

function StatusDot({ classification }: { classification: TestSession['modelOutput']['classification'] }) {
  const cls =
    classification === 'GOOD' ? 'bg-green-500' :
    classification === 'CHECK' ? 'bg-amber-500' : 'bg-rose-500';
  return <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${cls}`} aria-hidden="true" />;
}
