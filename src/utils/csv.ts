import type { TestSession } from '../types';

/** Builds a CSV of saved sessions and triggers a browser download. */
export function downloadSessionsCsv(sessions: TestSession[]): void {
  const headers = [
    'sessionId', 'sampleId', 'batchId', 'sampleType', 'feedType', 'scenario',
    'classification', 'confidence', 'moisture_pct', 'protein_pct', 'fiber_pct',
    'ph', 'adulterationFlag', 'spoilageRisk', 'createdAt',
  ];
  const escape = (v: unknown) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = sessions.map((s) => [
    s.sessionId, s.sampleId, s.batchId, s.sampleType, s.feedType ?? '', s.scenario,
    s.modelOutput.classification, s.modelOutput.confidence.toFixed(2),
    s.modelOutput.estimated.moisture_pct, s.modelOutput.estimated.protein_pct ?? '',
    s.modelOutput.estimated.fiber_pct ?? '', s.modelOutput.estimated.ph ?? '',
    s.modelOutput.estimated.adulterationFlag, s.modelOutput.estimated.spoilageRisk,
    new Date(s.createdAt).toISOString(),
  ].map(escape).join(','));

  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `feedscan-history-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
