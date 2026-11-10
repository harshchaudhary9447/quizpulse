'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../lib/api';
import {
  Clock,
  Award,
  AlertTriangle,
  Lock,
  Play,
  ArrowLeft,
  CheckCircle,
  HelpCircle,
  ShieldAlert,
} from 'lucide-react';
import NextLink from 'next/link';

export default function QuizIntroPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [quiz, setQuiz] = useState(null);
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    async function loadQuiz() {
      try {
        const res = await api.get(`/quizzes/${id}`);
        setQuiz(res.data);
      } catch (err) {
        setError(err.response?.data?.error?.message || 'Failed to load quiz');
      } finally {
        setLoading(false);
      }
    }
    loadQuiz();
  }, [id]);

  const handleStart = async (e) => {
    e.preventDefault();
    setError('');
    setStarting(true);

    try {
      const res = await api.post(`/attempts/start/${id}`, {
        accessCode: accessCode.trim() || undefined,
      });

      const attemptId = res.data.attemptId;
      router.push(`/quizzes/${id}/attempt?attemptId=${attemptId}`);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Could not start quiz');
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500">Preparing assessment instructions...</p>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Quiz Unavailable</h2>
        <p className="text-slate-500 text-sm mt-2">{error || 'This quiz does not exist or has been unpublished.'}</p>
        <NextLink href="/quizzes" className="inline-block mt-4 text-indigo-600 font-semibold hover:underline text-sm">
          Return to Quizzes
        </NextLink>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <NextLink
        href="/quizzes"
        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Assessments</span>
      </NextLink>

      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-xl">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              Official Assessment
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
              {quiz.title}
            </h1>
          </div>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
          {quiz.description || 'Welcome to this quiz. Please read the rules below carefully before clicking begin.'}
        </p>

        {/* Rule Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-center">
            <Clock className="w-4 h-4 mx-auto text-indigo-500 mb-1" />
            <span className="block text-sm font-bold text-slate-900 dark:text-white">
              {quiz.timeLimitMinutes > 0 ? `${quiz.timeLimitMinutes} Mins` : 'Unlimited'}
            </span>
            <span className="text-[10px] text-slate-400">Time Limit</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-center">
            <Award className="w-4 h-4 mx-auto text-emerald-500 mb-1" />
            <span className="block text-sm font-bold text-slate-900 dark:text-white">
              {quiz.passPercentage}%
            </span>
            <span className="text-[10px] text-slate-400">Passing Score</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-center">
            <HelpCircle className="w-4 h-4 mx-auto text-blue-500 mb-1" />
            <span className="block text-sm font-bold text-slate-900 dark:text-white">
              {quiz.questions?.length || 0}
            </span>
            <span className="text-[10px] text-slate-400">Total Questions</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-center">
            <AlertTriangle className="w-4 h-4 mx-auto text-amber-500 mb-1" />
            <span className="block text-sm font-bold text-slate-900 dark:text-white">
              {quiz.maxAttempts}
            </span>
            <span className="text-[10px] text-slate-400">Max Attempts</span>
          </div>
        </div>

        {/* Anti-Cheating & Proctor Notice */}
        <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/40 mb-8 flex items-start space-x-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
            <span className="font-bold">Anti-Cheating Proctoring Enabled:</span>
            <ul className="list-disc list-inside mt-1 space-y-0.5 text-amber-800 dark:text-amber-300">
              <li>Tab-switching or minimizing the browser is automatically monitored and logged.</li>
              <li>Your progress is continuously auto-saved. If disconnected, resume the quiz immediately.</li>
              <li>Questions and options are randomized for each candidate.</li>
            </ul>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Access Code Input if required */}
        <form onSubmit={handleStart} className="space-y-4">
          {quiz.requiresAccessCode && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center space-x-1.5">
                <Lock className="w-4 h-4 text-amber-500" />
                <span>Quiz Access Code Required</span>
              </label>
              <input
                type="text"
                required
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="Enter secret code (e.g. CS2026)"
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase tracking-widest font-mono"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={starting}
            className="w-full py-4 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {starting ? (
              <span>Initializing secure attempt...</span>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                <span>Begin Assessment Now</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
