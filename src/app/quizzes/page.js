'use client';

import React, { useState, useEffect } from 'react';
import NextLink from 'next/link';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import {
  BookOpen,
  Clock,
  Award,
  Lock,
  Search,
  CheckCircle,
  XCircle,
  Play,
  RotateCcw,
  Calendar,
  Layers,
  ArrowRight,
  History,
} from 'lucide-react';
import CertificateModal from '../../components/certificate/CertificateModal';

export default function QuizzesPage() {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('explore'); // 'explore' | 'history'
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Certificate modal state
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [certData, setCertData] = useState(null);

  useEffect(() => {
    fetchQuizzes();
    if (user) {
      fetchHistory();
    }
  }, [user]);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/quizzes');
      setQuizzes(res?.data?.quizzes || []);
    } catch (err) {
      console.error('Failed to load quizzes:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await api.get('/attempts/history');
      setHistory(res?.data || []);
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  const filteredQuizzes = quizzes.filter((q) =>
    q.title.toLowerCase().includes(search.toLowerCase()) ||
    q.description?.toLowerCase().includes(search.toLowerCase())
  );

  const openCertificate = (item) => {
    setCertData({
      studentName: user?.name,
      quizTitle: item.quizTitle,
      score: item.score,
      totalPoints: item.totalPoints,
      percentage: item.percentage,
      date: new Date(item.submittedAt).toLocaleDateString(),
      attemptId: item.attemptId,
    });
    setCertModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Assessment Center
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Browse published quizzes, test your knowledge, and earn certified credentials.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl self-start md:self-auto border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('explore')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeTab === 'explore'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Available Quizzes ({quizzes.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeTab === 'history'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>My Past Results ({history.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'explore' ? (
        <>
          {/* Search bar */}
          <div className="relative mb-6 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search quizzes by title or topic..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            />
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 rounded-2xl bg-slate-200/50 dark:bg-slate-800/50 animate-pulse" />
              ))}
            </div>
          ) : filteredQuizzes.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
              <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">No Quizzes Found</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Try modifying your search or check back later.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredQuizzes.map((quiz) => {
                const studentStats = quiz.studentStats;
                const attemptsUsed = studentStats?.count || 0;
                const maxAttempts = quiz.maxAttempts;
                const isExhausted = attemptsUsed >= maxAttempts && !studentStats?.hasActiveAttempt;

                return (
                  <div
                    key={quiz.id}
                    className="flex flex-col justify-between p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
                  >
                    <div>
                      {/* Badges bar */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40">
                          {quiz.questionCount} Questions
                        </span>
                        {quiz.requiresAccessCode && (
                          <span className="flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800">
                            <Lock className="w-3 h-3" />
                            <span>Access Code</span>
                          </span>
                        )}
                      </div>

                      {/* Title & Description */}
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug line-clamp-2">
                        {quiz.title}
                      </h3>
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {quiz.description || 'Comprehensive evaluation assessment.'}
                      </p>

                      {/* Meta stats */}
                      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                          <Clock className="w-3.5 h-3.5 mx-auto text-slate-400 mb-1" />
                          <span className="font-bold text-slate-700 dark:text-slate-200">
                            {quiz.timeLimitMinutes > 0 ? `${quiz.timeLimitMinutes}m` : 'None'}
                          </span>
                          <span className="block text-[10px] text-slate-400">Limit</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                          <Award className="w-3.5 h-3.5 mx-auto text-emerald-500 mb-1" />
                          <span className="font-bold text-slate-700 dark:text-slate-200">
                            {quiz.passPercentage}%
                          </span>
                          <span className="block text-[10px] text-slate-400">Pass</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                          <Layers className="w-3.5 h-3.5 mx-auto text-indigo-500 mb-1" />
                          <span className="font-bold text-slate-700 dark:text-slate-200">
                            {attemptsUsed}/{maxAttempts}
                          </span>
                          <span className="block text-[10px] text-slate-400">Attempts</span>
                        </div>
                      </div>

                      {/* Past student result if any */}
                      {studentStats?.count > 0 && (
                        <div className="mt-3 px-3 py-2 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100/60 dark:border-indigo-900/40 flex items-center justify-between text-xs">
                          <span className="text-slate-500 dark:text-slate-400">Best Score:</span>
                          <span className={`font-bold ${studentStats.passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>
                            {studentStats.highestPercentage}% {studentStats.passed && '🏆'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action button */}
                    <div className="mt-6">
                      <NextLink
                        href={`/quizzes/${quiz.id}`}
                        className={`w-full py-3 px-4 rounded-xl text-sm font-semibold flex items-center justify-center space-x-2 transition-all shadow-sm ${
                          studentStats?.hasActiveAttempt
                            ? 'bg-amber-600 hover:bg-amber-700 text-white'
                            : isExhausted
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20'
                        }`}
                      >
                        {studentStats?.hasActiveAttempt ? (
                          <>
                            <RotateCcw className="w-4 h-4 animate-spin-reverse" />
                            <span>Resume Attempt</span>
                          </>
                        ) : isExhausted ? (
                          <span>Max Attempts Used</span>
                        ) : (
                          <>
                            <Play className="w-4 h-4 fill-current" />
                            <span>Start Quiz</span>
                          </>
                        )}
                      </NextLink>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* History & Certificate Tab */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
            Completed Assessments
          </h2>
          {history.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400 text-sm">
              You haven&apos;t taken any quizzes yet. Start one from the available list!
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {history.map((h) => (
                <div key={h.attemptId} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      {h.quizTitle}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Submitted on {new Date(h.submittedAt).toLocaleDateString()} at{' '}
                      {new Date(h.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <span className="block text-sm font-black text-slate-800 dark:text-slate-100">
                        {h.score} / {h.totalPoints} ({h.percentage}%)
                      </span>
                      <span className={`inline-block text-[11px] font-bold uppercase ${h.isPassed ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {h.isPassed ? 'Passed' : 'Failed'}
                      </span>
                    </div>

                    <NextLink
                      href={`/quizzes/result/${h.attemptId}`}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
                    >
                      Review
                    </NextLink>

                    {h.isPassed && (
                      <button
                        onClick={() => openCertificate(h)}
                        className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition-colors flex items-center space-x-1"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>Certificate</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Certificate Modal */}
      <CertificateModal
        isOpen={certModalOpen}
        onClose={() => setCertModalOpen(false)}
        data={certData}
      />
    </div>
  );
}
