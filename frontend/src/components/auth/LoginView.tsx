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
      {/* Dynamic ambient background glow in light theme */}
      <div
        className={`absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full blur-3xl pointer-events-none transition-colors duration-500 ${
          isResearcher ? 'bg-blue-100/60' : 'bg-indigo-100/60'
        }`}
      />
      <div
        className={`absolute bottom-0 right-10 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none transition-colors duration-500 ${
          isResearcher ? 'bg-cyan-100/40' : 'bg-purple-100/40'
        }`}
      />

      {/* Top Bar with Back to Landing Page option */}
      {onBackToLanding && (
        <div className="absolute top-6 left-6 z-20">
          <button
            type="button"
            onClick={onBackToLanding}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 text-xs font-semibold border border-slate-200 shadow-sm transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
            <span>Back to Landing Page</span>
          </button>
        </div>
      )}

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10 pt-4">
        <div
          className={`inline-flex items-center justify-center p-3.5 rounded-2xl shadow-lg ring-1 ring-black/5 mb-3 transition-all duration-300 ${
            isResearcher
              ? 'bg-gradient-to-tr from-blue-600 to-cyan-600 shadow-blue-500/20 text-white'
              : 'bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-indigo-500/20 text-white'
          }`}
        >
          <Dna className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">PharmaLens</h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-600 max-w-sm mx-auto">
          Clinical Research Intelligence & Evidence Verification Platform
        </p>
      </div>

      {/* Main Container */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg relative z-10 px-4">
        {/* Role Portal Selection Tabs */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-200/80 rounded-2xl border border-slate-300/80 mb-4 shadow-sm">
          <button
            type="button"
            onClick={() => {
              setSelectedRole('RESEARCHER');
              setError(null);
            }}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 sm:px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isResearcher
                ? 'bg-white text-blue-700 shadow-md ring-1 ring-black/5'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Stethoscope className="w-4 h-4 text-blue-600" />
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
                ? 'bg-white text-indigo-700 shadow-md ring-1 ring-black/5'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>Compliance Admin</span>
          </button>
        </div>

        {/* Login Card (Light Themed) */}
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl rounded-2xl border border-slate-200/90 relative">
          {/* Portal Scope Header */}
          <div className="mb-6 pb-5 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <span
                className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                  isResearcher
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                }`}
              >
                {isResearcher ? 'Investigator Portal' : 'Administrative Portal'}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                Credential Authentication
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-2.5">
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
              className={`flex-1 pb-3 text-sm font-semibold text-center border-b-2 transition-colors cursor-pointer ${
                !isRegistering
                  ? isResearcher
                    ? 'border-blue-600 text-blue-600'
                    : 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
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
              className={`flex-1 pb-3 text-sm font-semibold text-center border-b-2 transition-colors cursor-pointer ${
                isRegistering
                  ? isResearcher
                    ? 'border-blue-600 text-blue-600'
                    : 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Register Profile
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
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
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
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
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
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
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex items-center justify-center gap-2 py-3 px-4 text-white text-sm font-semibold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 mt-2 ${
                isResearcher
                  ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
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
            <div className="mt-4 p-3 rounded-xl bg-indigo-50 border border-indigo-200/80 text-[11px] text-indigo-900 flex items-center gap-2">
              <KeyRound className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
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
