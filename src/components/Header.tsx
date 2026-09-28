import { useState } from 'react';
import { Leaf, Wifi, WifiOff } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

const NAV_LINKS = [
  { to: '/',        label: 'Home'     },
  { to: '/test',    label: 'New Test' },
  { to: '/history', label: 'History'  },
  { to: '/device',  label: 'Device'   },
];

/**
 * Sticky header with FeedScan branding, live connection status, and navigation.
 */
export function Header() {
  const isOnline = useOnlineStatus();
  const [showNote, setShowNote] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-xs">
      <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        {/* Brand */}
        <Link
          to="/"
          className="flex items-center gap-2.5 group"
          aria-label="FeedScan Home"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 group-hover:bg-emerald-200 transition-colors">
            <Leaf className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-xl text-emerald-950 tracking-tight leading-none">
              FeedScan
            </span>
            <span className="text-[10px] font-medium text-emerald-700 tracking-wider uppercase mt-0.5">
              Quality Testing
            </span>
          </div>
        </Link>

        {/* Status indicator */}
        <div className="flex items-center gap-2 relative">
          <button
            type="button"
            onClick={() => setShowNote((v) => !v)}
            className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200"
            aria-expanded={showNote}
          >
            Prototype · simulation mode
          </button>
          {showNote && (
            <div
              role="note"
              className="absolute right-0 top-9 w-64 z-50 p-3 rounded-xl bg-white border border-gray-200 shadow-md text-xs text-gray-700"
            >
              Readings are generated in simulation mode. Live sensor input will be enabled when the device is connected.
            </div>
          )}
          <div
            className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
              isOnline
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
            title={isOnline ? 'Online' : 'Offline – local testing active'}
          >
            {isOnline
              ? <Wifi className="w-3.5 h-3.5" aria-hidden="true" />
              : <WifiOff className="w-3.5 h-3.5" aria-hidden="true" />}
            <span className="hidden sm:inline">{isOnline ? 'Ready' : 'Offline'}</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav
        className="max-w-2xl mx-auto px-4 pb-2.5 flex gap-1.5 overflow-x-auto no-scrollbar"
        aria-label="Main navigation"
      >
        {NAV_LINKS.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `px-3.5 py-1.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-gray-600 hover:text-emerald-800 hover:bg-emerald-50'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
