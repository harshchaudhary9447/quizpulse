'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import NextLink from 'next/link';
import api from '../../../../lib/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  ArrowLeft,
  Download,
  Users,
  Award,
  Clock,
  TrendingUp,
  AlertTriangle,
  ShieldAlert,
  HelpCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export default function QuizAnalyticsPage() {
  const { quizId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const res = await api.get(`/analytics/quiz/${quizId}`);
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.error?.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, [quizId]);

  const handleExportCsv = async () => {
    try {
      const response = await api.get(`/analytics/quiz/${quizId}/export-csv`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `quiz-${quizId}-results.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('CSV export failed');
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500 text-sm">Aggregating cohort statistics and charts...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Analytics Unavailable</h2>
        <p className="text-slate-500 text-sm mt-2">{error || 'Could not load metrics.'}</p>
        <NextLink href="/teacher/quizzes" className="inline-block mt-4 text-indigo-600 font-semibold hover:underline text-sm">
          Return to Studio
        </NextLink>
      </div>
    );
  }

  const CHART_COLORS = ['#ef4444', '#f97316', '#eab308', '#3b82f6', '#10b981'];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <NextLink
        href="/teacher/quizzes"
        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Quiz Studio</span>
      </NextLink>

      {/* Header & Export CSV */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            Cohort Performance Analytics
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
            {data.quizTitle}
          </h1>
        </div>

        <button
          onClick={handleExportCsv}
          className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 text-xs sm:text-sm font-bold shadow-md flex items-center justify-center space-x-2 transition-all self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Export Results (CSV)</span>
        </button>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Total Attempts</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {data.totalAttempts}
          </span>
          <span className="block text-[11px] text-slate-400 mt-1">
            {data.passedCount} Passed / {data.failedCount} Failed
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Pass Rate</span>
            <Award className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {data.passRate}%
          </span>
          <span className="block text-[11px] text-slate-400 mt-1">
            Threshold: {data.passPercentage}%
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Average Score</span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {data.averagePercentage}%
          </span>
          <span className="block text-[11px] text-slate-400 mt-1">
            Mean raw: {data.averageScore} pts
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Avg Completion</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {data.averageDurationMinutes}m
          </span>
          <span className="block text-[11px] text-slate-400 mt-1">
            Duration elapsed
          </span>
        </div>
      </div>

      {/* Grid: Score Distribution & Hardest Questions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Score Distribution Chart */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            Score Distribution Histogram
          </h2>
          <p className="text-xs text-slate-400 mb-6">Candidate percentage grade frequencies</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.scoreDistribution}>
                <XAxis dataKey="range" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {data.scoreDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hardest Questions Diagnostics */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Top Diagnostic Questions (Hardest)
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Questions with the lowest candidate accuracy rate
            </p>

            <div className="space-y-3">
              {data.hardestQuestions.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No attempt submissions recorded yet.</p>
              ) : (
                data.hardestQuestions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex-1 truncate">
                      <span className="font-bold text-slate-500 mr-2">#{idx + 1}</span>
                      <span className="text-slate-800 dark:text-slate-200 font-medium">
                        {q.text}
                      </span>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span
                        className={`font-bold block ${
                          q.accuracy < 50 ? 'text-rose-500' : 'text-amber-500'
                        }`}
                      >
                        {q.accuracy}% Correct
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {q.incorrectCount} mistakes
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Student Attempts Table */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">
          Student Examination Submissions ({data.recentAttempts.length})
        </h2>

        {data.recentAttempts.length === 0 ? (
          <p className="text-center py-8 text-xs text-slate-400">No student submissions recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase border-b border-slate-100 dark:border-slate-800 font-semibold">
                <tr>
                  <th className="p-3">Candidate</th>
                  <th className="p-3">Score</th>
                  <th className="p-3">Percentage</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Proctor Warnings</th>
                  <th className="p-3">Submitted At</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.recentAttempts.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-3">
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {att.studentName}
                      </span>
                      <span className="text-[10px] text-slate-400">{att.studentEmail}</span>
                    </td>
                    <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">
                      {att.score} / {att.totalPoints}
                    </td>
                    <td className="p-3">
                      <span className="font-extrabold text-slate-900 dark:text-white">
                        {att.percentage}%
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          att.isPassed
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600'
                            : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600'
                        }`}
                      >
                        {att.isPassed ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        <span>{att.isPassed ? 'PASSED' : 'FAILED'}</span>
                      </span>
                    </td>
                    <td className="p-3">
                      {att.proctorViolationsCount > 0 ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-600">
                          <ShieldAlert className="w-3 h-3" />
                          <span>{att.proctorViolationsCount} Warnings</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">Clean</span>
                      )}
                    </td>
                    <td className="p-3 text-slate-400 text-[11px]">
                      {att.submittedAt ? new Date(att.submittedAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="p-3 text-right">
                      <NextLink
                        href={`/quizzes/result/${att.id}`}
                        className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                      >
                        Inspect
                      </NextLink>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
