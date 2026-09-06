import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth, DEMO_ACCOUNTS } from '@/context/AuthContext';
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  KeyRound,
  ShieldAlert,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, switchDemoRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaRequired, setMfaRequired] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await login({ email: email.trim(), password, mfa_code: mfaRequired ? mfaCode : undefined });
      if (result.mfaRequired) {
        setMfaRequired(true);
        return;
      }
      navigate(from, { replace: true });
    } catch (err: any) {
      const msg =
        err?.response?.data?.error?.message ||
        'Invalid authentication credentials or disabled account.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (account: (typeof DEMO_ACCOUNTS)[0]) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await switchDemoRole(account);
      navigate(from, { replace: true });
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.error?.message || 'Quick login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Top Banner */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <div className="inline-flex p-3 bg-blue-950 border border-blue-800/80 rounded-2xl text-blue-400 mb-4 shadow-xl shadow-blue-950/50">
          <ShieldCheck className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">
          SECURE LEGAL DMS
        </h1>
        <p className="mt-1 text-xs uppercase tracking-widest text-slate-400 font-mono">
          Investigation & Evidence Operations Portal
        </p>

        {/* Official Security Clearance notice */}
        <div className="mt-4 p-2.5 bg-navy-950/80 border border-navy-900 rounded-xl text-[11px] text-teal-300/90 flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-teal-400 flex-shrink-0" />
          <span>Government of India • Authorized Law Enforcement & Judicial Network</span>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900 border border-slate-800 py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-rose-950/50 border border-rose-900 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Official Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="officer@demo.local"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {mfaRequired && (
              <div className="rounded-xl border border-teal-900 bg-teal-950/30 p-3">
                <label htmlFor="mfa-code" className="block text-xs font-semibold text-teal-100">
                  Authenticator verification code
                </label>
                <p className="mt-1 text-[11px] text-teal-200/80">Enter the six-digit code from your approved authenticator. Demo code: 123456.</p>
                <input
                  id="mfa-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  minLength={6}
                  maxLength={6}
                  required
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="mt-2 w-full rounded-lg border border-teal-800 bg-slate-950 px-3 py-2 font-mono text-lg tracking-[0.45em] text-slate-100"
                  aria-describedby="mfa-help"
                />
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-300">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-10 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition shadow-lg shadow-blue-900/30"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              <span>{mfaRequired ? 'Verify and open session' : 'Continue securely'}</span>
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 text-[11px] text-slate-500">
            <span className="h-px flex-1 bg-slate-800" />
            approved workforce identity
            <span className="h-px flex-1 bg-slate-800" />
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage('SSO is authenticated through the Government National Identity Provider (Parichay / MeriPehchan). Select authorized department profile below.')}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
          >
            Continue with organization SSO
          </button>

          {/* Departmental Role Access */}
          <div className="mt-6 pt-6 border-t border-slate-800">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-teal-400" />
              <span>Departmental Personnel Sign-In</span>
            </div>
            <p className="text-[11px] text-slate-500 mb-3">
              Select authorized departmental profile to access designated jurisdictional portal:
            </p>

            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((acc) => {
                const lvl =
                  acc.role === 'SYSTEM_ADMIN'
                    ? 100
                    : acc.role === 'INVESTIGATING_OFFICER'
                    ? 80
                    : acc.role === 'LEGAL_OFFICER' || acc.role === 'PROSECUTOR'
                    ? 60
                    : acc.role === 'COURT_USER' || acc.role === 'AUDITOR'
                    ? 40
                    : 10;
                return (
                  <button
                    key={acc.role}
                    type="button"
                    onClick={() => handleQuickLogin(acc)}
                    disabled={isLoading}
                    className="text-left p-2.5 rounded-lg bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-blue-800/60 transition flex flex-col justify-center gap-1"
                  >
                    <div className="flex items-center justify-between gap-1 w-full">
                      <span className="text-xs font-semibold text-slate-200 truncate">{acc.label}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-blue-950 text-blue-400 border border-blue-900 flex-shrink-0">
                        Lvl {lvl}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">{acc.department} • {acc.email}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
