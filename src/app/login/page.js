'use client';

import React, { useState } from 'react';
import NextLink from 'next/link';
import { useAuth } from '../../context/AuthContext';
import BrandLogo from '../../components/common/BrandLogo';
import { Mail, Lock, ArrowRight, AlertCircle, GraduationCap, User } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-slate-950 text-white flex flex-col justify-between px-4 py-3 sm:py-5">
      {/* Top Bar with Brand Logo and Back link */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between flex-shrink-0">
        <BrandLogo showText={true} />

        <NextLink
          href="/"
          className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 text-xs sm:text-sm font-semibold transition-all"
        >
          Home
        </NextLink>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center p-2">
        <div className="w-full max-w-md bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-800">
          <div className="text-center mb-5">
            <h1 className="text-2xl font-black text-white">Welcome back</h1>
            <p className="text-xs text-slate-400 mt-1">
              Sign in to take or host assessments
            </p>
          </div>

          {/* Quick Demo Fill Buttons */}
          <div className="mb-4 p-2.5 bg-slate-800/60 rounded-2xl border border-slate-700/60">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center mb-2">
              ⚡ Quick Fill Demo Credentials
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('student1@quizpulse.com', 'Student123!')}
                className="px-2 py-1.5 rounded-xl bg-indigo-950/70 hover:bg-indigo-900/80 text-indigo-300 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors border border-indigo-900/60"
              >
                <User className="w-3.5 h-3.5" />
                <span>Student</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('teacher1@quizpulse.com', 'Teacher123!')}
                className="px-2 py-1.5 rounded-xl bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors border border-emerald-900/60"
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Teacher</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-3 p-2.5 rounded-xl bg-rose-950/50 border border-rose-900 flex items-center space-x-2 text-rose-400 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50 mt-1"
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-slate-400">
            Don&apos;t have an account?{' '}
            <NextLink href="/register" className="font-bold text-indigo-400 hover:underline">
              Create an account
            </NextLink>
          </p>
        </div>
      </main>

      <footer className="text-center py-1 text-[11px] text-slate-500 flex-shrink-0">
        QuizPulse &bull; Secure Authentication
      </footer>
    </div>
  );
}
