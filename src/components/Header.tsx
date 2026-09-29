import { useEffect, useState } from 'react';
import {
  Wifi, WifiOff, Home, ScanLine, Wheat, History, QrCode, Cpu, Factory, LogIn, UserCircle, Languages, Check,
} from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useAuth } from '../contexts/AuthContext';
import { getMode, type SourceMode } from '../data-sources/sourceStore';
import { setLanguage } from '../i18n';

const LANGS = [
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'ta', label: 'தமிழ்', name: 'தமிழ்' },
  { code: 'hi', label: 'हिंदी', name: 'हिंदी' },
] as const;

function useNavLinks(role: 'farmer' | 'producer' | null) {
  const { t } = useTranslation();
  const links = [
    { to: '/',        label: t('nav.home'),    icon: Home },
    { to: '/test',    label: t('nav.test'),    icon: ScanLine },
    { to: '/history', label: t('nav.history'), icon: History },
    { to: '/batch',   label: t('nav.batch'),   icon: QrCode },
    { to: '/device',  label: t('nav.device'),  icon: Cpu },
  ];
  if (role === 'producer') links.push({ to: '/producer', label: 'Producer', icon: Factory });
  return links;
}

/**
 * Top navigation bar (tabs on desktop) plus a bottom tab bar on phones.
 * Status, language and account controls live on the right of the bar.
 */
export function Header() {
  const { i18n } = useTranslation();
  const { user, role } = useAuth();
  const NAV_LINKS = useNavLinks(role);
  const isOnline = useOnlineStatus();
  const [showLang, setShowLang] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [mode, setMode] = useState<SourceMode>(getMode());

  useEffect(() => {
    const onChange = (e: Event) => setMode((e as CustomEvent<SourceMode>).detail);
    window.addEventListener('feedscan-mode-change', onChange);
    return () => window.removeEventListener('feedscan-mode-change', onChange);
  }, []);

  const noteText = mode === 'live'
    ? 'Readings come from the ESP32 sensor over Firebase. Switch modes on the Device page.'
    : 'Readings are synthetic demo data. Switch to Live on the Device page once the sensor is connected.';
  const modeLabel = mode === 'live' ? 'Live sensor' : 'Demo mode';
  const accTo = user ? '/account' : '/login';
  const accLabel = user ? 'Account' : 'Log in';
  const accTitle = user ? `Account (${user.email})` : 'Log in';
  const AccIcon = user ? UserCircle : LogIn;
  const iconBtn = 'inline-flex items-center justify-center min-h-10 min-w-10 rounded-lg border border-white/20 bg-white/10 text-white hover:bg-white/20 px-2.5 gap-1.5 text-xs font-semibold';

  return (
    <>
      <header className="sticky top-0 z-40 bg-gradient-to-r from-emerald-900 to-emerald-800 text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4 lg:gap-8">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0" aria-label="FeedScan Home">
            <span className="w-9 h-9 rounded-full bg-butter flex items-center justify-center" aria-hidden="true">
              <Wheat className="w-5 h-5 text-emerald-950" />
            </span>
            <span className="leading-none">
              <span className="block font-display font-bold text-[17px] tracking-tight text-white">FeedScan</span>
              <span className="hidden sm:block text-[11px] mt-1 text-emerald-200">Feed &amp; silage quality</span>
            </span>
          </Link>

          {/* Desktop tabs */}
          <nav className="hidden lg:flex items-center gap-1 flex-1" aria-label="Main navigation">
            {NAV_LINKS.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} end={to === '/'} className="tab-link">
                <Icon className="w-4 h-4" aria-hidden="true" />
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Controls */}
          <div className="ml-auto flex items-center gap-2 relative">
            <button
              type="button"
              onClick={() => { setShowNote((v) => !v); setShowLang(false); }}
              aria-expanded={showNote}
              className={iconBtn}
              title={isOnline ? 'Online' : 'Offline – local testing active'}
            >
              <span className={`w-2 h-2 rounded-full ${mode === 'live' ? 'bg-green-400' : 'bg-butter'}`} aria-hidden="true" />
              <span className="hidden sm:inline">{modeLabel}</span>
              {isOnline
                ? <Wifi className="w-3.5 h-3.5 text-green-300" aria-label="Online" />
                : <WifiOff className="w-3.5 h-3.5 text-red-300" aria-label="Offline" />}
            </button>

            <button
              type="button"
              onClick={() => { setShowLang((v) => !v); setShowNote(false); }}
              aria-label="Change language"
              aria-expanded={showLang}
              className={iconBtn}
            >
              <Languages className="w-4 h-4" />
              {LANGS.find((l) => l.code === i18n.language)?.label ?? 'EN'}
            </button>

            {role === 'producer' && (
              <Link to="/producer" aria-label="Producer" className={`${iconBtn} lg:hidden`}>
                <Factory className="w-4 h-4" />
              </Link>
            )}
            <Link to={accTo} title={accTitle} aria-label={accLabel} className={iconBtn}>
              <AccIcon className="w-4 h-4" />
              <span className="hidden md:inline">{accLabel}</span>
            </Link>

            {showLang && (
              <div className="absolute right-0 top-12 z-50 w-40 bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden py-1">
                {LANGS.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => { setLanguage(l.code); setShowLang(false); }}
                    className="flex w-full items-center justify-between px-3.5 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50"
                  >
                    {l.name}
                    {i18n.language === l.code && <Check className="w-4 h-4 text-emerald-700" aria-hidden="true" />}
                  </button>
                ))}
              </div>
            )}
            {showNote && (
              <div role="note" className="absolute right-0 top-12 w-72 z-50 p-3.5 rounded-xl bg-white border border-gray-200 shadow-md text-sm text-gray-700 leading-relaxed">
                <p className="font-semibold text-gray-900 mb-1">{modeLabel} · {isOnline ? 'Online' : 'Offline'}</p>
                {noteText}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile bottom tabs */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 flex"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        aria-label="Main navigation"
      >
        {NAV_LINKS.slice(0, 5).map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex-1 min-w-0 flex flex-col items-center gap-0.5 pt-2 pb-1.5 text-[11px] font-semibold ${isActive ? 'text-emerald-800' : 'text-gray-500'}`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.4 : 1.8} aria-hidden="true" />
                <span className="truncate max-w-full px-1">{label}</span>
                <span className={`h-0.5 w-6 rounded-full ${isActive ? 'bg-emerald-800' : 'bg-transparent'}`} />
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
