import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tractor, Factory, LogOut, KeyRound, UserCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../types';

/** Account settings: switch between farmer and producer, reset password, log out. */
export function AccountPage() {
  const { user, role, changeRole, resetPassword, logout } = useAuth();
  const navigate = useNavigate();
  const [busyRole, setBusyRole] = useState<UserRole | null>(null);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [resetBusy, setResetBusy] = useState(false);

  if (!user) return null; // route is wrapped in <ProtectedRoute>

  const current: UserRole = role ?? 'farmer';

  const pickRole = async (r: UserRole) => {
    if (r === current) return;
    setMsg(null);
    setBusyRole(r);
    try {
      await changeRole(r);
      setMsg({ kind: 'ok', text: `Your account is now a ${r} account.` });
    } catch {
      setMsg({ kind: 'err', text: 'Could not change account type. Check your connection and try again.' });
    } finally {
      setBusyRole(null);
    }
  };

  const sendReset = async () => {
    if (!user.email) return;
    setMsg(null);
    setResetBusy(true);
    try {
      await resetPassword(user.email);
      setMsg({ kind: 'ok', text: `Password reset link sent to ${user.email}.` });
    } catch {
      setMsg({ kind: 'err', text: 'Could not send the reset email. Please try again later.' });
    } finally {
      setResetBusy(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <main className="page-narrow">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
          <UserCircle className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-extrabold text-gray-900">{user.displayName || 'Your account'}</h1>
        <p className="text-xs text-gray-500">{user.email}</p>
      </div>

      <section className="card p-5 space-y-3">
        <h2 className="label">Account type</h2>
        <div className="grid grid-cols-2 gap-2.5">
          <RoleCard icon={Tractor} label="Farmer" desc="Run tests, view results"
            active={current === 'farmer'} busy={busyRole === 'farmer'} onClick={() => pickRole('farmer')} />
          <RoleCard icon={Factory} label="Producer" desc="Publish batch data"
            active={current === 'producer'} busy={busyRole === 'producer'} onClick={() => pickRole('producer')} />
        </div>
        <p className="text-[11px] text-gray-400">
          Switching to Farmer hides the Producer dashboard. Batches you already published stay online.
        </p>
      </section>

      <section className="card p-5 space-y-3">
        <h2 className="label">Password</h2>
        <button
          type="button"
          onClick={sendReset}
          disabled={resetBusy}
          className="btn btn-secondary w-full flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <KeyRound className="w-4 h-4" />
          {resetBusy ? 'Sending…' : 'Email me a password reset link'}
        </button>
      </section>

      {msg && (
        <p className={`text-xs font-semibold rounded-xl p-2.5 border ${
          msg.kind === 'ok' ? 'text-emerald-800 bg-emerald-50 border-emerald-100' : 'text-rose-700 bg-rose-50 border-rose-100'
        }`}>{msg.text}</p>
      )}

      <button
        type="button"
        onClick={handleLogout}
        className="btn w-full flex items-center justify-center gap-2 text-rose-700 hover:bg-rose-50"
      >
        <LogOut className="w-4 h-4" /> Log out
      </button>
    </main>
  );
}

function RoleCard({
  icon: Icon, label, desc, active, busy, onClick,
}: { icon: typeof Tractor; label: string; desc: string; active: boolean; busy: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      aria-pressed={active}
      className={`text-left p-3 rounded-2xl border-2 transition-all ${
        active ? 'border-emerald-800 bg-emerald-50/70' : 'border-gray-200 hover:border-emerald-300'
      } ${busy ? 'opacity-60' : ''}`}
    >
      <Icon className={`w-5 h-5 mb-1 ${active ? 'text-emerald-800' : 'text-gray-400'}`} />
      <p className={`text-sm font-bold ${active ? 'text-emerald-900' : 'text-gray-700'}`}>{label}</p>
      <p className="text-[11px] text-gray-500">{desc}</p>
    </button>
  );
}
