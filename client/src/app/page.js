'use client';

import React, { useState, useEffect } from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import {
  Zap,
  ShieldCheck,
  Radio,
  BarChart3,
  Award,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Lock,
  Layers,
  Users,
  BookOpen,
  Clock,
  HelpCircle,
  ChevronDown,
  GraduationCap,
  Briefcase,
  Play,
  RotateCcw,
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const { user, quickLoginAs } = useAuth();

  // Quick Game PIN state (Kahoot signature)
  const [gamePin, setGamePin] = useState('');
  const [pinError, setPinError] = useState('');

  // Quizzes preview state
  const [featuredQuizzes, setFeaturedQuizzes] = useState([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);

  // FAQ Accordion state
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    fetchFeaturedQuizzes();
  }, []);

  const fetchFeaturedQuizzes = async () => {
    try {
      setLoadingQuizzes(true);
      const res = await api.get('/quizzes?limit=3');
      const list = res?.data?.quizzes || [];
      if (list.length > 0) {
        setFeaturedQuizzes(list.slice(0, 3));
      } else {
        // Fallback default featured quizzes if DB is empty
        setFeaturedQuizzes([
          {
            id: 'demo-1',
            title: 'Computer Science Fundamentals & Algorithms',
            description: 'Core data structures, algorithm complexity, time analysis, and binary search.',
            timeLimitMinutes: 15,
            passPercentage: 70,
            questionCount: 10,
            category: 'Computer Science',
          },
          {
            id: 'demo-2',
            title: 'Full-Stack Web Development Essentials',
            description: 'Modern JavaScript, React state lifecycles, REST APIs, and authentication flows.',
            timeLimitMinutes: 20,
            passPercentage: 75,
            questionCount: 10,
            category: 'Web Development',
          },
        ]);
      }
    } catch (err) {
      console.warn('Could not fetch featured quizzes:', err);
    } finally {
      setLoadingQuizzes(false);
    }
  };

  const handleJoinPin = (e) => {
    e.preventDefault();
    setPinError('');
    const clean = gamePin.trim();
    if (!clean) {
      setPinError('Please enter a 6-digit Game PIN');
      return;
    }
    if (clean.length !== 6 || !/^\d+$/.test(clean)) {
      setPinError('PIN must be exactly 6 digits (e.g. 849201)');
      return;
    }
    router.push(`/live/join?pin=${clean}`);
  };

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      q: 'Do players need an account to join a live quiz?',
      a: 'No! Just like Kahoot, students and audience members can join any live game directly on their mobile phone or laptop using only the 6-digit Game PIN and a nickname. No sign-up or app installation required.',
    },
    {
      q: 'Can students cheat or inspect answers in browser Developer Tools?',
      a: 'Never. QuizPulse utilizes strict server-side grading. Correct answers and rationales are never delivered to the client during an active test. Tab switching and window blur events are also logged in real time.',
    },
    {
      q: 'How does the multiplayer Live Arena work?',
      a: 'Teachers launch a live session which generates a 6-digit PIN. Questions are pushed synchronously over Socket.IO with a live countdown timer. Players earn speed bonus points for fast correct answers, and a live leaderboard is shown after each round.',
    },
    {
      q: 'Can educators create custom quizzes with different question types?',
      a: 'Yes! The Quiz Studio supports Single Choice, Multi-Select, True/False, and Short Answer questions. Teachers can set custom timers, pass marks, randomize question order, and download attempt analytics in CSV format.',
    },
    {
      q: 'How do students receive their certificates?',
      a: 'Once a student submits a quiz and meets or exceeds the pass percentage, a high-resolution, printable certificate of achievement is immediately generated with an official verification hash.',
    },
  ];

  return (
    <div className="relative overflow-hidden">
      {/* Decorative gradient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-indigo-500/20 via-purple-500/15 to-emerald-500/20 blur-[130px] pointer-events-none rounded-full" />

      {/* 1. HERO SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 text-center relative z-10">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-6">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Next-Gen Multiplayer & Tamper-Proof Quiz Engine</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-tight">
          Make learning awesome.{' '}
          <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-400 bg-clip-text text-transparent">
            Tamper-proof grading.
          </span>{' '}
          Live buzzers.
        </h1>

        <p className="mt-5 text-base sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          QuizPulse combines strict server-side evaluation, real-time Socket.IO multiplayer arenas, anti-cheat proctoring, and instant verified pass certificates.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <NextLink
            href="/quizzes"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm sm:text-base shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center space-x-2 group"
          >
            <BookOpen className="w-4 h-4" />
            <span>Explore Quizzes</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </NextLink>

          <NextLink
            href="/register"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm sm:text-base border border-slate-700 shadow-md transition-all flex items-center justify-center space-x-2"
          >
            <span>Sign Up Free</span>
          </NextLink>
        </div>

        {/* Kahoot-Style "Quick Join with Game PIN" Input Box */}
        <div className="mt-10 max-w-lg mx-auto p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
          <div className="flex items-center justify-center space-x-2 mb-3">
            <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Have a Game PIN? Join Live Arena
            </h3>
          </div>

          <form onSubmit={handleJoinPin} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              maxLength={6}
              value={gamePin}
              onChange={(e) => {
                setGamePin(e.target.value.replace(/\D/g, ''));
                setPinError('');
              }}
              placeholder="Enter 6-digit PIN..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold text-base text-center placeholder:font-sans placeholder:font-normal placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center space-x-1.5"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Enter</span>
            </button>
          </form>

          {pinError && (
            <p className="mt-2 text-xs font-semibold text-rose-500">{pinError}</p>
          )}

          <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            No registration needed for live players. Enter PIN and pick a nickname!
          </p>
        </div>

        {/* 1-Click Role Exploration Box for Quick Testing */}
        <div className="mt-8 max-w-lg mx-auto p-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-slate-800">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2.5 flex items-center justify-center space-x-1">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Instant 1-Click Role Demo Sign-In</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => quickLoginAs('STUDENT')}
              className="px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold border border-indigo-200 dark:border-indigo-800 transition-all text-center"
            >
              🎓 Student Demo
            </button>
            <button
              onClick={() => quickLoginAs('TEACHER')}
              className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-800 transition-all text-center"
            >
              🧑‍🏫 Teacher Demo
            </button>
          </div>
        </div>
      </section>

      {/* 2. SCALE & INTEGRITY STAT STRIP */}
      <section className="border-y border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-3">
              <span className="block text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400">
                100%
              </span>
              <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                Server-Side Grading
              </span>
              <span className="block text-[11px] text-slate-500 mt-0.5">
                Zero answer leakage to client
              </span>
            </div>

            <div className="p-3">
              <span className="block text-2xl sm:text-3xl font-black text-rose-500">
                &lt;50ms
              </span>
              <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                Live Socket Latency
              </span>
              <span className="block text-[11px] text-slate-500 mt-0.5">
                Real-time synchronized buzzers
              </span>
            </div>

            <div className="p-3">
              <span className="block text-2xl sm:text-3xl font-black text-amber-500">
                Active
              </span>
              <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                Anti-Cheat Proctor
              </span>
              <span className="block text-[11px] text-slate-500 mt-0.5">
                Tab-switch & blur monitoring
              </span>
            </div>

            <div className="p-3">
              <span className="block text-2xl sm:text-3xl font-black text-emerald-500">
                Instant
              </span>
              <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                Verified Certificates
              </span>
              <span className="block text-[11px] text-slate-500 mt-0.5">
                Downloadable PDF on pass
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS (Kahoot-Style 4-Step Journey) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-2">
            Simple & Powerful
          </h2>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            How QuizPulse Works in 4 Steps
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto mt-2">
            From creation to live gameplay and certified mastery in minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Step 1 */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 relative">
            <span className="absolute -top-3.5 left-6 px-3 py-0.5 rounded-full bg-indigo-600 text-white text-xs font-extrabold shadow">
              STEP 1
            </span>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 mt-1">
              <Sparkles className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
              Explore or Build
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Pick from public quizzes or create questions (Single choice, Multi-select, T/F, Short answer) in the Studio.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 relative">
            <span className="absolute -top-3.5 left-6 px-3 py-0.5 rounded-full bg-emerald-600 text-white text-xs font-extrabold shadow">
              STEP 2
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 mt-1">
              <Radio className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
              Share 6-Digit PIN
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Host a live synchronized battle or assign self-paced challenges with customized deadlines & access codes.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 relative">
            <span className="absolute -top-3.5 left-6 px-3 py-0.5 rounded-full bg-amber-600 text-white text-xs font-extrabold shadow">
              STEP 3
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4 mt-1">
              <Zap className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
              Answer & Compete
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Players answer on mobile or desktop with live countdown timers, speed bonuses, and anti-cheat protection.
            </p>
          </div>

          {/* Step 4 */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 relative">
            <span className="absolute -top-3.5 left-6 px-3 py-0.5 rounded-full bg-purple-600 text-white text-xs font-extrabold shadow">
              STEP 4
            </span>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4 mt-1">
              <Award className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
              Podium & Certificates
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Live podium celebration for top finishers, per-question review rationales, and verified downloadable diplomas.
            </p>
          </div>
        </div>
      </section>

      {/* 4. FEATURED QUIZZES PREVIEW (So the site never looks empty!) */}
      <section className="bg-slate-100/60 dark:bg-slate-900/40 py-16 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-10 gap-4">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1">
                Ready to Play
              </h2>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                Featured Public Quizzes
              </h3>
            </div>
            <NextLink
              href="/quizzes"
              className="text-xs sm:text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1"
            >
              <span>Explore All Quizzes</span>
              <ArrowRight className="w-4 h-4" />
            </NextLink>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredQuizzes.map((quiz, i) => (
              <div
                key={quiz.id || i}
                className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                      {quiz.category || 'General Assessment'}
                    </span>
                    <span className="flex items-center space-x-1 text-xs text-slate-500 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{quiz.timeLimitMinutes || 15}m</span>
                    </span>
                  </div>

                  <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2 line-clamp-1">
                    {quiz.title}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                    {quiz.description || 'Test your proficiency and earn a verified certificate upon passing.'}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="text-[11px] text-slate-500">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {quiz.questionCount || 10}
                    </span>{' '}
                    Questions • Pass:{' '}
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {quiz.passPercentage || 70}%
                    </span>
                  </div>

                  <NextLink
                    href={`/quizzes`}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors flex items-center space-x-1"
                  >
                    <span>Start</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </NextLink>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. AUDIENCE SEGMENTATION ("For Every Occasion" - Kahoot Style) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-2">
            Tailored Experiences
          </h2>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Designed for Every Environment
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Track 1: Educators */}
          <div className="p-7 rounded-3xl bg-gradient-to-b from-indigo-500/5 to-transparent border border-indigo-500/20 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mb-5 shadow-md shadow-indigo-500/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              For Educators & Schools
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              Build exams with 4 question formats, randomize question order, enable tab-switch proctoring, and export score distributions to CSV.
            </p>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Rich Question Bank with Categories</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Diagnostic charts for hardest questions</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>One-click synchronous Live Hosting</span>
              </li>
            </ul>
          </div>

          {/* Track 2: Students */}
          <div className="p-7 rounded-3xl bg-gradient-to-b from-emerald-500/5 to-transparent border border-emerald-500/20 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mb-5 shadow-md shadow-emerald-500/20">
              <BookOpen className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              For Students & Learners
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              Practice independently or challenge classmates in live games. Review rationale explanations after submission and earn certificates.
            </p>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Continuous auto-save against network loss</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Instant verified certificate on pass</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Comprehensive test review history</span>
              </li>
            </ul>
          </div>

          {/* Track 3: Teams */}
          <div className="p-7 rounded-3xl bg-gradient-to-b from-purple-500/5 to-transparent border border-purple-500/20 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center mb-5 shadow-md shadow-purple-500/20">
              <Briefcase className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              For Teams & Communities
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              Host live multiplayer trivia, company training quizzes, or town hall icebreakers. Speed bonus points keep everyone on their toes.
            </p>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Zero app install — plays in any mobile browser</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Real-time podium celebration & confetti</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Speed bonuses for fast reflexes</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 6. INTERACTIVE FAQ ACCORDION */}
      <section className="bg-slate-100/60 dark:bg-slate-900/40 py-16 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-2">
              Got Questions?
            </h2>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              Frequently Asked Questions
            </h3>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden transition-all shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between font-bold text-sm sm:text-base text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  <span className="flex items-center space-x-2.5">
                    <HelpCircle className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                    <span>{faq.q}</span>
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      openFaq === idx ? 'rotate-180 text-indigo-500' : ''
                    }`}
                  />
                </button>

                {openFaq === idx && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/60 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. CLOSING CTA BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="rounded-3xl bg-gradient-to-tr from-indigo-900 via-indigo-950 to-slate-900 p-8 sm:p-12 border border-indigo-500/30 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto">
            <h3 className="text-2xl sm:text-4xl font-black text-white mb-3">
              Ready to make assessments awesome?
            </h3>
            <p className="text-sm sm:text-base text-indigo-200 mb-6">
              Join thousands of students and teachers taking exams and hosting live buzzer battles today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <NextLink
                href="/register"
                className="w-full sm:w-auto px-7 py-3 rounded-xl bg-white hover:bg-slate-100 text-indigo-950 font-bold text-sm shadow-md transition-all"
              >
                Create Free Account
              </NextLink>
              <NextLink
                href="/live/join"
                className="w-full sm:w-auto px-7 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center space-x-1.5"
              >
                <Radio className="w-4 h-4 animate-pulse" />
                <span>Join a Live Arena</span>
              </NextLink>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
