'use client';

import React, { useState, useEffect } from 'react';
import NextLink from 'next/link';
import api from '../../../lib/api';
import {
  GraduationCap,
  Plus,
  BarChart3,
  Radio,
  Eye,
  EyeOff,
  Trash2,
  Clock,
  Layers,
  Award,
  Lock,
} from 'lucide-react';

export default function TeacherQuizzesPage() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeacherQuizzes();
  }, []);

  const fetchTeacherQuizzes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/quizzes');
      setQuizzes(res?.data?.quizzes || []);
    } catch (err) {
      console.error('Failed to load teacher quizzes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async (id) => {
    try {
      const res = await api.patch(`/quizzes/${id}/publish`);
      setQuizzes((prev) =>
        prev.map((q) => (q.id === id ? { ...q, isPublished: res.data.isPublished } : q))
      );
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Toggle publish failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this quiz?')) return;
    try {
      await api.delete(`/quizzes/${id}`);
      setQuizzes((prev) => prev.filter((q) => q.id !== id));
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Delete failed');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Quiz Studio
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Author quizzes, launch live sessions, and track cohort analytics.
          </p>
        </div>

        <NextLink
          href="/teacher/quizzes/new"
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-500/20 flex items-center justify-center space-x-1.5 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Quiz</span>
        </NextLink>
      </div>

      {/* Quizzes Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-3xl bg-slate-200/50 dark:bg-slate-800/50 animate-pulse" />
          ))}
        </div>
      ) : quizzes.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
          <GraduationCap className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">No Quizzes Created Yet</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-6">
            Assemble questions from your Question Bank and set your exam rules.
          </p>
          <NextLink
            href="/teacher/quizzes/new"
            className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs sm:text-sm"
          >
            Create Your First Quiz
          </NextLink>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="flex flex-col justify-between p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1.5 ${
                      quiz.isPublished
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${quiz.isPublished ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    <span>{quiz.isPublished ? 'Status: Published' : 'Status: Draft'}</span>
                  </span>

                  {quiz.requiresAccessCode && (
                    <span className="flex items-center space-x-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                      <Lock className="w-3 h-3" />
                      <span>Protected</span>
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug line-clamp-2">
                  {quiz.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                  {quiz.description || 'No description provided.'}
                </p>

                {/* Metrics */}
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                      {quiz.questionCount}
                    </span>
                    <span className="text-[10px] text-slate-400">Questions</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                      {quiz.timeLimitMinutes > 0 ? `${quiz.timeLimitMinutes}m` : 'None'}
                    </span>
                    <span className="text-[10px] text-slate-400">Timer</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 block">
                      {quiz.totalAttempts || 0}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {quiz.liveSessionsCount > 0 && quiz.attemptsCount > 0
                        ? `Plays (${quiz.attemptsCount} self / ${quiz.liveSessionsCount} live)`
                        : quiz.liveSessionsCount > 0
                        ? `Plays (${quiz.liveSessionsCount} live)`
                        : 'Attempts'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <NextLink
                    href={`/teacher/analytics/${quiz.id}`}
                    className="py-2.5 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors"
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>Analytics</span>
                  </NextLink>

                  <NextLink
                    href={`/live/host/${quiz.id}`}
                    className="py-2.5 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors"
                  >
                    <Radio className="w-3.5 h-3.5" />
                    <span>Host Live</span>
                  </NextLink>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60">
                  <button
                    onClick={() => handleTogglePublish(quiz.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                      quiz.isPublished
                        ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-500/20'
                    }`}
                  >
                    {quiz.isPublished ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{quiz.isPublished ? 'Switch to Draft' : 'Publish Quiz'}</span>
                  </button>

                  <button
                    onClick={() => handleDelete(quiz.id)}
                    className="text-xs font-semibold text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 flex items-center space-x-1 px-2.5 py-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
