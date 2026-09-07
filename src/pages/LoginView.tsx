import React, { useState } from 'react';
import { Sparkles, Shield, UserCheck, AlertCircle, ArrowRight, Check } from 'lucide-react';
import { useAuth, DEMO_CREDENTIALS } from '../context/AuthContext.js';
import { UserRole } from '../types.js';

export const LoginView: React.FC = () => {
  const { login, switchRole, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Authentication failed. Please verify credentials.');
    }
  };

  const handleQuickSelect = async (role: UserRole) => {
    setError(null);
    try {
      await switchRole(role);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Quick login failed.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 shadow-xl shadow-indigo-500/25 mb-4">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">HRFlow Platform</h2>
        <p className="mt-2 text-sm text-slate-400">
          Intelligent Employee Leave & Attendance Management System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl px-4 sm:px-0">
        {/* Quick Persona Access Cards */}
        <div className="mb-6 bg-slate-800/80 rounded-2xl p-4 border border-slate-700/80 backdrop-blur-sm">
          <p className="text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <UserCheck className="w-4 h-4" /> One-Click Demo Personas
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {(Object.entries(DEMO_CREDENTIALS) as [UserRole, any][]).map(([role, cred]) => (
              <button
                key={role}
                onClick={() => handleQuickSelect(role)}
                disabled={isLoading}
                className="text-left p-3 rounded-xl bg-slate-900/80 hover:bg-indigo-950/40 border border-slate-700/60 hover:border-indigo-500/50 transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                    {cred.title}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 group-hover:bg-indigo-900 group-hover:text-indigo-200">
                    {role}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-1">{cred.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Credentials Form */}
        <div className="bg-white py-8 px-6 sm:px-10 shadow-2xl rounded-2xl border border-slate-200">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Corporate Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="employee@hrflow.internal"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{isLoading ? 'Authenticating...' : 'Sign In with Credentials'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              Role-Based Access Control (RBAC)
            </span>
            <span>JWT & Bcrypt Encrypted</span>
          </div>
        </div>
      </div>
    </div>
  );
};
