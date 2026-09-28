import React, { useState } from 'react';
import {
  Dna,
  ShieldCheck,
  Mail,
  Lock,
  User,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  Stethoscope,
  KeyRound,
} from 'lucide-react';
import { useAuth, UserRole } from '../../context/AuthContext';

interface LoginViewProps {
  initialRole?: UserRole;
  onSuccess?: () => void;
  onBackToLanding?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  initialRole = 'RESEARCHER',
  onSuccess,
  onBackToLanding,
}) => {
  const {
    signInWithEmail,
    signUpWithEmail,
    isFirebaseConfigured,
  } = useAuth();

  // Selected Portal Role
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole);
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!email.trim() || !password.trim()) {
        throw new Error('Please enter both your institutional email and password.');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters.');
      }

      if (selectedRole === 'ADMIN' && !email.toLowerCase().includes('admin') && isFirebaseConfigured) {
        throw new Error('Administrative login requires an authorized administrator or compliance email.');
      }

      if (isRegistering) {
        if (!name.trim()) {
          throw new Error('Please enter your full name and professional title.');
        }
        await signUpWithEmail(email, password, name, selectedRole);
      } else {
        await signInWithEmail(email, password, selectedRole);
      }
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const isResearcher = selectedRole === 'RESEARCHER';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Dynamic ambient background glow with palette colors */}
      <div
        className={`absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full blur-3xl pointer-events-none transition-colors duration-500 ${
          isResearcher ? 'bg-powder-200/50' : 'bg-coral-200/40'
        }`}
      />
      <div
        className={`absolute bottom-0 right-10 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none transition-colors duration-500 ${
          isResearcher ? 'bg-petrol-200/30' : 'bg-crimson-200/30'
        }`}
      />

      {/* Top Bar with Back to Landing Page option */}
      {onBackToLanding && (
        <div className="absolute top-6 left-6 z-20">
          <button
            type="button"
            onClick={onBackToLanding}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-powder-50 text-darkteal-900 text-xs font-semibold border border-powder-200 shadow-xs transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-petrol-600" />
            <span>Back to Landing Page</span>
          </button>
        </div>
      )}

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10 pt-4">
        <div
          className={`inline-flex items-center justify-center p-3.5 rounded-2xl shadow-lg ring-1 ring-black/5 mb-3 transition-all duration-300 ${
            isResearcher
              ? 'bg-gradient-to-tr from-petrol-600 to-powder-400 shadow-petrol-500/20 text-white'
              : 'bg-gradient-to-tr from-crimson-600 to-coral-500 shadow-crimson-500/20 text-white'
          }`}
        >
          <Dna className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-darkteal-900 tracking-tight">PharmaLens</h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-600 max-w-sm mx-auto">
          Clinical Research Intelligence & Evidence Verification Platform
        </p>
      </div>

      {/* Main Container */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg relative z-10 px-4">
        {/* Role Portal Selection Tabs */}
        <div className="grid grid-cols-2 p-1.5 bg-powder-100/70 rounded-2xl border border-powder-200 mb-4 shadow-xs">
          <button
            type="button"
            onClick={() => {
              setSelectedRole('RESEARCHER');
              setError(null);
            }}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 sm:px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isResearcher
                ? 'bg-white text-petrol-700 shadow-sm ring-1 ring-black/5'
                : 'text-slate-600 hover:text-darkteal-900 hover:bg-powder-200/50'
            }`}
          >
            <Stethoscope className="w-4 h-4 text-petrol-600" />
            <span>Clinical Researcher</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedRole('ADMIN');
              setError(null);
            }}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 sm:px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              !isResearcher
                ? 'bg-white text-crimson-700 shadow-sm ring-1 ring-black/5'
                : 'text-slate-600 hover:text-darkteal-900 hover:bg-coral-100/50'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-crimson-600" />
            <span>Compliance Admin</span>
          </button>
        </div>

        {/* Login Card (Light Themed) */}
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl rounded-2xl border border-powder-200/80 relative">
          {/* Portal Scope Header */}
          <div className="mb-6 pb-5 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <span
                className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                  isResearcher
                    ? 'bg-powder-50 text-petrol-700 border-powder-200'
                    : 'bg-coral-50 text-crimson-700 border-coral-200'
                }`}
              >
                {isResearcher ? 'Investigator Portal' : 'Administrative Portal'}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                Credential Authentication
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-darkteal-900 mt-2.5">
              {isResearcher ? 'Researcher Sign In' : 'Administrator Sign In'}
            </h2>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              {isResearcher
                ? 'Sign in with your clinical research credentials to query trial reports, drug labels, and multi-page documents.'
                : 'Sign in with administrative credentials to access quality evaluation benchmarks, token usage, and system controls.'}
            </p>
          </div>

          {/* Form Mode Toggle */}
          <div className="flex border-b border-slate-200 mb-6">
            <button
              type="button"
              onClick={() => {
                setIsRegistering(false);
                setError(null);
              }}
              className={`flex-1 pb-3 text-sm font-bold text-center border-b-2 transition-colors cursor-pointer ${
                !isRegistering
                  ? isResearcher
                    ? 'border-petrol-600 text-petrol-700'
                    : 'border-crimson-600 text-crimson-700'
                  : 'border-transparent text-slate-500 hover:text-darkteal-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegistering(true);
                setError(null);
              }}
              className={`flex-1 pb-3 text-sm font-bold text-center border-b-2 transition-colors cursor-pointer ${
                isRegistering
                  ? isResearcher
                    ? 'border-petrol-600 text-petrol-700'
                    : 'border-crimson-600 text-crimson-700'
                  : 'border-transparent text-slate-500 hover:text-darkteal-900'
              }`}
            >
              Register Profile
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-coral-50 border border-coral-200 text-coral-900 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-coral-600 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name & Title
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={
                      isResearcher
                        ? 'Dr. Eleanor Vance, Lead Investigator'
                        : 'Marcus Reed, Regulatory Lead'
                    }
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-petrol-500/20 focus:border-petrol-600 transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isResearcher ? 'Institutional Email' : 'Administrator Email'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={
                    isResearcher
                      ? 'investigator@novartis.com'
                      : 'admin@pharmalens.io'
                  }
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-petrol-500/20 focus:border-petrol-600 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isResearcher ? 'Password' : 'Administrator Password / Access Key'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-petrol-500/20 focus:border-petrol-600 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex items-center justify-center gap-2 py-3 px-4 text-white text-sm font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 mt-2 ${
                isResearcher
                  ? 'bg-petrol-600 hover:bg-petrol-700 shadow-petrol-600/20'
                  : 'bg-crimson-600 hover:bg-crimson-700 shadow-crimson-600/20'
              }`}
            >
              <span>
                {isRegistering
                  ? isResearcher
                    ? 'Register Researcher Account'
                    : 'Register Administrator Account'
                  : isResearcher
                  ? 'Sign In to Clinical Research'
                  : 'Sign In to Admin Workspace'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Admin audit note */}
          {!isResearcher && (
            <div className="mt-4 p-3 rounded-xl bg-coral-50 border border-coral-200 text-[11px] text-coral-900 flex items-center gap-2">
              <KeyRound className="w-3.5 h-3.5 text-coral-600 shrink-0" />
              <span>Administrative actions and benchmark runs are logged for compliance auditing.</span>
            </div>
          )}
        </div>

        {/* Regulatory disclaimer */}
        <p className="mt-4 text-center text-[11px] text-slate-500">
          PharmaLens supports clinical research synthesis. Grounded evidence retrieval with exact source provenance. Not intended for direct medical diagnostics.
        </p>
      </div>
    </div>
  );
};

export default LoginView;

