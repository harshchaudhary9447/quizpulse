'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import NextLink from 'next/link';
import confetti from 'canvas-confetti';
import api from '../../../../lib/api';
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  ArrowRight,
  BookOpen,
  HelpCircle,
} from 'lucide-react';
import CertificateModal from '../../../../components/certificate/CertificateModal';

export default function QuizResultPage() {
  const { attemptId } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [certModalOpen, setCertModalOpen] = useState(false);

  useEffect(() => {
    async function loadResult() {
      try {
        const res = await api.get(`/attempts/${attemptId}/review`);
        setResult(res.data);

        // Fire confetti on pass
        if (res.data.isPassed) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        }
      } catch (err) {
        setError(err.response?.data?.error?.message || 'Failed to load quiz results');
      } finally {
        setLoading(false);
      }
    }

    loadResult();
  }, [attemptId]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500 text-sm">Evaluating server-side scoring & review payload...</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Results Unavailable</h2>
        <p className="text-slate-500 text-sm mt-2">{error || 'Could not find review records for this attempt.'}</p>
        <NextLink href="/quizzes" className="inline-block mt-4 text-indigo-600 font-semibold hover:underline text-sm">
          Return to Quizzes
        </NextLink>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 1. Score Summary Banner */}
      <div
        className={`rounded-3xl p-6 sm:p-10 border text-center shadow-xl mb-10 ${
          result.isPassed
            ? 'bg-gradient-to-b from-emerald-500/10 via-white dark:via-slate-900 to-white dark:to-slate-900 border-emerald-500/30'
            : 'bg-gradient-to-b from-rose-500/10 via-white dark:via-slate-900 to-white dark:to-slate-900 border-rose-500/30'
        }`}
      >
        <div className="inline-flex w-16 h-16 rounded-3xl bg-white dark:bg-slate-800 shadow-md items-center justify-center mb-4">
          {result.isPassed ? (
            <Award className="w-9 h-9 text-emerald-500 fill-emerald-500/20" />
          ) : (
            <XCircle className="w-9 h-9 text-rose-500" />
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
          {result.isPassed ? 'Congratulations! You Passed!' : 'Assessment Completed'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
          {result.quizTitle}
        </p>

        {/* Score metrics */}
        <div className="mt-8 flex items-center justify-center space-x-6 sm:space-x-12">
          <div>
            <span className="block text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
              {result.percentage}%
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Grade ({result.score}/{result.totalPoints})
            </span>
          </div>

          <div className="h-10 w-px bg-slate-200 dark:bg-slate-800" />

          <div>
            <span
              className={`block text-3xl sm:text-4xl font-extrabold ${
                result.isPassed ? 'text-emerald-500' : 'text-rose-500'
              }`}
            >
              {result.isPassed ? 'PASSED' : 'FAILED'}
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Pass Mark: {result.passPercentage}%
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          {result.isPassed && (
            <button
              onClick={() => setCertModalOpen(true)}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-lg shadow-amber-500/25 flex items-center justify-center space-x-2 transition-all"
            >
              <Award className="w-4 h-4" />
              <span>Claim Verified Certificate</span>
            </button>
          )}

          <NextLink
            href="/quizzes"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm transition-all flex items-center justify-center space-x-2"
          >
            <BookOpen className="w-4 h-4" />
            <span>Explore More Quizzes</span>
          </NextLink>
        </div>

        {/* Proctoring Log Notice if violations recorded */}
        {result.proctorViolationsCount > 0 && (
          <div className="mt-6 inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 text-xs font-medium">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
            <span>
              {result.proctorViolationsCount} tab-switching event(s) logged during this examination.
            </span>
          </div>
        )}
      </div>

      {/* 2. Detailed Per-Question Breakdown */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Question Review & Explanations
          </h2>
          <span className="text-xs text-slate-400">
            {result.questions.filter((q) => q.isCorrect).length} Correct / {result.questions.length} Total
          </span>
        </div>

        {result.questions.map((q, idx) => (
          <div
            key={q.questionId}
            className={`p-6 rounded-3xl bg-white dark:bg-slate-900 border transition-all ${
              q.isCorrect
                ? 'border-emerald-500/30'
                : 'border-rose-500/30'
            }`}
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-400">
                  Question {idx + 1}
                </span>
                <span
                  className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                    q.isCorrect
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                      : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {q.isCorrect ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  <span>{q.isCorrect ? 'Correct' : 'Incorrect'}</span>
                </span>
              </div>

              <span className="text-xs font-bold text-slate-500">
                {q.pointsAwarded} / {q.pointsPossible} pts
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed mb-4">
              {q.text}
            </h3>

            {/* If Short Answer */}
            {q.type === 'SHORT_ANSWER' ? (
              <div className="space-y-2 text-sm mb-4">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="block text-xs font-semibold text-slate-400 mb-1">Your Submission:</span>
                  <span className={q.isCorrect ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                    {q.studentTextAnswer || '(Empty)'}
                  </span>
                </div>
                {!q.isCorrect && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                    <span className="block text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
                      Accepted Correct Answer(s):
                    </span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-300">
                      {q.options.map((o) => o.text).join(', ')}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              /* Options list */
              <div className="space-y-2 mb-4">
                {q.options.map((opt) => {
                  const wasSelected = q.studentSelectedOptions.includes(opt.id);
                  const isCorrectAnswer = opt.isCorrect;

                  let style = 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300';
                  if (isCorrectAnswer) {
                    style = 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-950 dark:text-emerald-100 font-semibold';
                  } else if (wasSelected && !isCorrectAnswer) {
                    style = 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-950 dark:text-rose-100 font-semibold';
                  }

                  return (
                    <div
                      key={opt.id}
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs sm:text-sm ${style}`}
                    >
                      <div className="flex items-center space-x-2">
                        <span>{opt.text}</span>
                        {wasSelected && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-700">
                            Your Choice
                          </span>
                        )}
                      </div>

                      {isCorrectAnswer && (
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          ✓ Correct Key
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Explanation card */}
            {q.explanation && (
              <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 text-xs text-indigo-950 dark:text-indigo-200 leading-relaxed">
                <span className="font-bold block text-indigo-600 dark:text-indigo-400 mb-1 flex items-center space-x-1">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Explanation & Context</span>
                </span>
                {q.explanation}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Certificate Modal */}
      <CertificateModal
        isOpen={certModalOpen}
        onClose={() => setCertModalOpen(false)}
        data={{
          studentName: result.student?.name,
          quizTitle: result.quizTitle,
          score: result.score,
          totalPoints: result.totalPoints,
          percentage: result.percentage,
          date: new Date(result.submittedAt).toLocaleDateString(),
          attemptId: result.attemptId,
        }}
      />
    </div>
  );
}
