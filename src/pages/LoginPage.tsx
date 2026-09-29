import { useState } from 'react';
import { useNavigate, useLocation, Link, Navigate } from 'react-router-dom';
import { Leaf, LogIn, UserPlus, Tractor, Factory, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../types';

export function LoginPage() {
  const { login, signup, resetPassword, user, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [resetSent, setResetSent] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signupRole, setSignupRole] = useState<UserRole>('farmer');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Already logged in: bounce to the right home immediately.
  if (user) {
    const target = role === 'producer' ? '/producer' : '/';
    return <Navigate to={(location.state as { from?: string })?.from ?? target} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === 'reset') {
        await resetPassword(email.trim());
        setResetSent(true);
        return;
      }
      if (mode === 'login') {
        await login(email.trim(), password);
      } else {
        await signup(email.trim(), password, name, signupRole);
      }
      navigate(signupRole === 'producer' && mode === 'signup' ? '/producer' : '/', { replace: true });
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="page-narrow">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
          <Leaf className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-extrabold text-gray-900">
          {mode === 'login' ? 'Log in to FeedScan' : mode === 'signup' ? 'Create your FeedScan account' : 'Reset your password'}
        </h1>
        <p className="text-xs text-gray-500">
          {mode === 'login'
            ? 'Farmers and producers use the same login.'
            : mode === 'signup'
              ? 'Choose the account type that fits you.'
              : "Enter your email and we'll send you a reset link."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4 p-5">
        {mode === 'signup' && (
          <div>
            <label className="label">Your name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ramesh Kumar"
              className="field mt-1 w-full"
            />
          </div>
        )}

        <div>
          <label className="label">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="field mt-1 w-full"
          />
        </div>

        {mode !== 'reset' && (
        <div>
          <label className="label">Password</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field mt-1 w-full"
          />
          {mode === 'login' && (
            <button
              type="button"
              onClick={() => { setMode('reset'); setError(null); setResetSent(false); }}
              className="mt-1.5 text-xs font-semibold text-emerald-800 hover:underline"
            >
              Forgot password?
            </button>
          )}
        </div>
        )}

        {mode === 'signup' && (
          <div>
            <label className="label">Account type</label>
            <div className="grid grid-cols-2 gap-2.5 mt-1.5">
              <RoleCard
                icon={Tractor}
                label="Farmer"
                desc="Run tests, view results"
                active={signupRole === 'farmer'}
                onClick={() => setSignupRole('farmer')}
              />
              <RoleCard
                icon={Factory}
                label="Producer"
                desc="Publish batch data"
                active={signupRole === 'producer'}
                onClick={() => setSignupRole('producer')}
              />
            </div>
          </div>
        )}

        {resetSent && (
          <p className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-xl p-2.5">
            If an account exists for that email, a reset link is on its way. Check your inbox and spam folder.
          </p>
        )}

        {error && <p className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-100 rounded-xl p-2.5">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="btn btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {mode === 'login' ? <LogIn className="w-4 h-4" /> : mode === 'signup' ? <UserPlus className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
          {busy ? 'Please wait…' : mode === 'login' ? 'Log in' : mode === 'signup' ? 'Create account' : 'Send reset link'}
        </button>
      </form>

      <p className="text-center text-xs text-gray-500">
        {mode === 'login' ? "Don't have an account?" : mode === 'signup' ? 'Already have an account?' : 'Remembered it?'}{' '}
        <button
          type="button"
          onClick={() => { setMode(mode === 'signup' || mode === 'reset' ? 'login' : 'signup'); setError(null); setResetSent(false); }}
          className="font-bold text-emerald-800 hover:underline"
        >
          {mode === 'login' ? 'Sign up' : 'Log in'}
        </button>
      </p>

      <p className="text-center">
        <Link to="/" className="text-xs text-gray-400 hover:underline">Continue browsing without an account</Link>
      </p>
    </main>
  );
}

function RoleCard({
  icon: Icon, label, desc, active, onClick,
}: { icon: typeof Tractor; label: string; desc: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left p-3 rounded-2xl border-2 transition-all ${
        active ? 'border-emerald-800 bg-emerald-50/70' : 'border-gray-200 hover:border-emerald-300'
      }`}
    >
      <Icon className={`w-5 h-5 mb-1 ${active ? 'text-emerald-800' : 'text-gray-400'}`} />
      <p className={`text-sm font-bold ${active ? 'text-emerald-900' : 'text-gray-700'}`}>{label}</p>
      <p className="text-[11px] text-gray-500">{desc}</p>
    </button>
  );
}

function friendlyError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? '';
  if (code.includes('email-already-in-use')) return 'An account with this email already exists. Try logging in.';
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found'))
    return 'Incorrect email or password.';
  if (code.includes('weak-password')) return 'Password must be at least 6 characters.';
  if (code.includes('invalid-email')) return 'Enter a valid email address.';
  if (code.includes('too-many-requests')) return 'Too many attempts. Please wait a few minutes and try again.';
  if (code.includes('network-request-failed') || code.includes('auth/configuration-not-found'))
    return 'Could not reach the login service. Check your connection and Firebase setup.';
  return 'Something went wrong. Please try again.';
}
