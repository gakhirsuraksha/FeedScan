import { Link } from 'react-router-dom';
import { History, Play, Info } from 'lucide-react';

export function HistoryPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-8 space-y-6 pb-14">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
            <History className="w-6 h-6 text-emerald-800" />
            Test History
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Saved quality assessments stored on this device</p>
        </div>
      </div>

      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
        <Info className="w-5 h-5 text-emerald-800 mt-0.5 shrink-0" />
        <div className="text-sm text-emerald-950">
          <p className="font-bold">Offline Storage Active</p>
          <p className="text-xs text-emerald-900/80 mt-0.5">
            Tests saved on this device persist in your browser's local database without requiring internet connectivity.
          </p>
        </div>
      </div>

      <div className="p-8 text-center bg-white border border-gray-200/80 rounded-3xl space-y-4 shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-400 mx-auto flex items-center justify-center">
          <History className="w-6 h-6" />
        </div>
        <p className="text-sm font-medium text-gray-600 max-w-sm mx-auto leading-relaxed">
          No previous assessments found in local storage. Complete and save a test to view records and trends.
        </p>
        <Link
          to="/test"
          className="inline-flex items-center gap-2 bg-emerald-800 text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-xs active:scale-98"
        >
          <Play className="w-4 h-4 fill-current" /> Start New Test
        </Link>
      </div>
    </main>
  );
}
