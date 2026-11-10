'use client';

import React, { useState } from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import BrandLogo from '../../components/common/BrandLogo';
import {
  ChevronLeft,
  Mail,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  // Multi-step state: 1 = Role selection, 2 = Workplace / Scope selection, 3 = Email/Password signup
  const [step, setStep] = useState(1);
  const [accountType, setAccountType] = useState(''); // 'teacher', 'professional', 'student', 'personal'
  const [workplace, setWorkplace] = useState('');     // 'school', 'higher_ed', 'admin', 'business', 'other'

  // Form credentials
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Step 1 Selection Handler
  const handleSelectAccountType = (type) => {
    setAccountType(type);
    setStep(2);
  };

  // Step 2 Selection Handler
  const handleSelectWorkplace = (wp) => {
    setWorkplace(wp);
    setStep(3);
  };

  // Step 3 Form Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const mappedRole = accountType === 'teacher' ? 'TEACHER' : 'STUDENT';

      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: mappedRole,
      });
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 3) setStep(2);
    else if (step === 2) setStep(1);
    else router.push('/');
  };

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-slate-950 text-white flex flex-col justify-between px-4 py-3 sm:py-5">
      {/* Top Bar: Brand Logo on Left, Back button */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between flex-shrink-0">
        <BrandLogo showText={true} />

        <button
          onClick={handleBack}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 text-xs sm:text-sm font-semibold transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
      </header>

      {/* Main Centered Card — Fits completely without vertical scrolling */}
      <main className="flex-1 flex items-center justify-center p-2">
        <div className="w-full max-w-md bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-800">
          
          {/* STEP 1: Choose Account Type (Kahoot Style) */}
          {step === 1 && (
            <div>
              <div className="mb-5 text-center sm:text-left">
                <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">
                  Choose what&apos;s most relevant to you.
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  If you&apos;re not sure, you can change this later.
                </p>
              </div>

              {/* 2x2 Clean Colored Tiles — Compact & Centered */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                {/* Red Tile - Teacher */}
                <button
                  type="button"
                  onClick={() => handleSelectAccountType('teacher')}
                  className="h-16 sm:h-20 rounded-2xl bg-[#e21b3c] hover:bg-[#c91835] active:scale-95 text-white flex items-center justify-center font-bold text-base sm:text-lg shadow-md transition-all p-3 text-center"
                >
                  <span className="leading-tight">Teacher</span>
                </button>

                {/* Blue Tile - Professional */}
                <button
                  type="button"
                  onClick={() => handleSelectAccountType('professional')}
                  className="h-16 sm:h-20 rounded-2xl bg-[#1368ce] hover:bg-[#1059b0] active:scale-95 text-white flex items-center justify-center font-bold text-base sm:text-lg shadow-md transition-all p-3 text-center"
                >
                  <span className="leading-tight">Professional</span>
                </button>

                {/* Gold Tile - Student */}
                <button
                  type="button"
                  onClick={() => handleSelectAccountType('student')}
                  className="h-16 sm:h-20 rounded-2xl bg-[#d89e00] hover:bg-[#b88600] active:scale-95 text-white flex items-center justify-center font-bold text-base sm:text-lg shadow-md transition-all p-3 text-center"
                >
                  <span className="leading-tight">Student</span>
                </button>

                {/* Green Tile - Family and friends */}
                <button
                  type="button"
                  onClick={() => handleSelectAccountType('personal')}
                  className="h-16 sm:h-20 rounded-2xl bg-[#26890c] hover:bg-[#20750a] active:scale-95 text-white flex items-center justify-center font-bold text-sm sm:text-base shadow-md transition-all p-3 text-center"
                >
                  <span className="leading-tight">Family and friends</span>
                </button>
              </div>

              <div className="pt-2 border-t border-slate-800 text-center">
                <p className="text-xs text-slate-400">
                  Already have an account?{' '}
                  <NextLink href="/login" className="font-bold text-indigo-400 hover:underline">
                    Log in
                  </NextLink>
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: Choose Workplace / Environment */}
          {step === 2 && (
            <div>
              <div className="mb-4 text-center sm:text-left">
                <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">
                  {accountType === 'student'
                    ? 'Choose your learning institution.'
                    : 'Choose the workplace that is most relevant to you.'}
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  If you&apos;re not sure, you can change this later.
                </p>
              </div>

              {/* 5 Workplace Colored Tiles — Compact & Centered */}
              <div className="space-y-2.5 mb-5">
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Red: School */}
                  <button
                    type="button"
                    onClick={() => handleSelectWorkplace('school')}
                    className="h-14 sm:h-16 rounded-2xl bg-[#e21b3c] hover:bg-[#c91835] active:scale-95 text-white flex items-center justify-center font-bold text-sm sm:text-base shadow-sm transition-all p-2 text-center"
                  >
                    <span>School</span>
                  </button>

                  {/* Blue: Higher Education */}
                  <button
                    type="button"
                    onClick={() => handleSelectWorkplace('higher_ed')}
                    className="h-14 sm:h-16 rounded-2xl bg-[#1368ce] hover:bg-[#1059b0] active:scale-95 text-white flex items-center justify-center font-bold text-xs sm:text-sm shadow-sm transition-all p-2 text-center"
                  >
                    <span>Higher education</span>
                  </button>

                  {/* Gold: Administration / Coaching */}
                  <button
                    type="button"
                    onClick={() => handleSelectWorkplace('admin')}
                    className="h-14 sm:h-16 rounded-2xl bg-[#d89e00] hover:bg-[#b88600] active:scale-95 text-white flex items-center justify-center font-bold text-xs sm:text-sm shadow-sm transition-all p-2 text-center"
                  >
                    <span>{accountType === 'student' ? 'Coaching / Institute' : 'School administration'}</span>
                  </button>

                  {/* Green: Business */}
                  <button
                    type="button"
                    onClick={() => handleSelectWorkplace('business')}
                    className="h-14 sm:h-16 rounded-2xl bg-[#26890c] hover:bg-[#20750a] active:scale-95 text-white flex items-center justify-center font-bold text-sm sm:text-base shadow-sm transition-all p-2 text-center"
                  >
                    <span>Business</span>
                  </button>
                </div>

                {/* Purple: Other */}
                <button
                  type="button"
                  onClick={() => handleSelectWorkplace('other')}
                  className="w-full h-11 sm:h-12 rounded-2xl bg-[#864cbf] hover:bg-[#723fa4] active:scale-95 text-white flex items-center justify-center font-bold text-sm shadow-sm transition-all"
                >
                  <span>Other</span>
                </button>
              </div>

              <div className="pt-2 border-t border-slate-800 text-center">
                <p className="text-xs text-slate-400">
                  Already have an account?{' '}
                  <NextLink href="/login" className="font-bold text-indigo-400 hover:underline">
                    Log in
                  </NextLink>
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: Simple Gmail Sign Up */}
          {step === 3 && (
            <div>
              <div className="mb-4">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-400 block mb-0.5">
                  {accountType === 'teacher' ? '🧑‍🏫 Teacher Registration' : '🎓 Student / Learner Registration'}
                </span>
                <h1 className="text-2xl font-black text-white">
                  Sign up
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Enter your name and Gmail to create your account.
                </p>
              </div>

              {error && (
                <div className="mb-3 p-2.5 rounded-xl bg-rose-950/50 border border-rose-900 flex items-center space-x-2 text-rose-400 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Gmail / Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="yourname@gmail.com"
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
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
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
                    <span>Creating account...</span>
                  ) : (
                    <>
                      <span>Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-4 pt-2.5 border-t border-slate-800 text-center">
                <p className="text-xs text-slate-400">
                  Already have an account?{' '}
                  <NextLink href="/login" className="font-bold text-indigo-400 hover:underline">
                    Log in
                  </NextLink>
                </p>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Footer — Visible directly on screen without any vertical scrolling! */}
      <footer className="text-center py-1 text-[11px] text-slate-500 flex-shrink-0">
        By continuing, you accept terms of service and privacy policy.
      </footer>
    </div>
  );
}
