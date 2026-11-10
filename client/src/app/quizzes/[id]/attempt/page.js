'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import api from '../../../../lib/api';
import {
  Clock,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Send,
  Grid,
  X,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Save,
} from 'lucide-react';

export default function QuizAttemptPlayer() {
  const { id: quizId } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const attemptIdParam = searchParams.get('attemptId');

  const [attemptData, setAttemptData] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [questionId]: { selectedOptionIds: [], textAnswer: '' } }
  const [remainingSeconds, setRemainingSeconds] = useState(null);
  const [proctorWarnings, setProctorWarnings] = useState(0);
  const [showProctorAlert, setShowProctorAlert] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const autoSaveTimeoutRef = useRef(null);
  const timerIntervalRef = useRef(null);

  // 1. Fetch Attempt Data
  useEffect(() => {
    async function loadAttempt() {
      try {
        let res;
        if (attemptIdParam) {
          res = await api.get(`/attempts/${attemptIdParam}`);
        } else {
          res = await api.post(`/attempts/start/${quizId}`);
        }

        const data = res.data;
        if (data.status === 'SUBMITTED' || data.status === 'TIMED_OUT') {
          router.push(`/quizzes/result/${data.attemptId}`);
          return;
        }

        setAttemptData(data);
        setRemainingSeconds(data.remainingSeconds);

        // Populate existing answers from saved drafts
        const initialAnswers = {};
        for (const q of data.questions) {
          if (q.savedAnswer) {
            initialAnswers[q.id] = {
              selectedOptionIds: q.savedAnswer.selectedOptionIds || [],
              textAnswer: q.savedAnswer.textAnswer || '',
            };
          } else {
            initialAnswers[q.id] = {
              selectedOptionIds: [],
              textAnswer: '',
            };
          }
        }
        setAnswers(initialAnswers);
      } catch (err) {
        console.error('Failed to start/resume attempt:', err);
        router.push(`/quizzes/${quizId}`);
      } finally {
        setLoading(false);
      }
    }

    loadAttempt();
  }, [quizId, attemptIdParam, router]);

  // 2. Submit Handler
  const handleSubmit = useCallback(async (isTimeout = false) => {
    if (!attemptData || submitting) return;
    setSubmitting(true);

    try {
      const payloadAnswers = Object.entries(answers).map(([qId, ans]) => ({
        questionId: qId,
        selectedOptionIds: ans.selectedOptionIds,
        textAnswer: ans.textAnswer,
      }));

      await api.post(`/attempts/${attemptData.attemptId}/submit`, {
        answers: payloadAnswers,
      });

      router.push(`/quizzes/result/${attemptData.attemptId}`);
    } catch (err) {
      console.error('Failed to submit attempt:', err);
      setSubmitting(false);
    }
  }, [attemptData, answers, submitting, router]);

  // 3. Countdown Timer Engine
  useEffect(() => {
    if (remainingSeconds === null || remainingSeconds === undefined) return;

    if (remainingSeconds <= 0) {
      handleSubmit(true);
      return;
    }

    timerIntervalRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerIntervalRef.current);
  }, [remainingSeconds, handleSubmit]);

  // 4. Anti-Cheating Proctoring: Detect Tab Switch & Blur
  useEffect(() => {
    if (!attemptData) return;

    const handleVisibilityChange = async () => {
      if (document.hidden) {
        setProctorWarnings((prev) => prev + 1);
        setShowProctorAlert(true);

        try {
          await api.post(`/attempts/${attemptData.attemptId}/proctor-event`, {
            type: 'TAB_SWITCH',
            metadata: {
              timestamp: new Date().toISOString(),
              questionIndex: currentIndex,
            },
          });
        } catch (e) {
          console.warn('Proctor event logging error:', e);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [attemptData, currentIndex]);

  // 5. Debounced Auto-Save Draft
  const triggerAutoSave = (updatedAnswers) => {
    if (!attemptData) return;
    setIsAutoSaving(true);

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        const payload = Object.entries(updatedAnswers).map(([qId, ans]) => ({
          questionId: qId,
          selectedOptionIds: ans.selectedOptionIds,
          textAnswer: ans.textAnswer,
        }));

        await api.patch(`/attempts/${attemptData.attemptId}/save-draft`, {
          answers: payload,
        });
      } catch (err) {
        console.warn('Auto-save error:', err);
      } finally {
        setIsAutoSaving(false);
      }
    }, 800);
  };

  // Option selection handler
  const handleOptionSelect = (questionId, optionId, type) => {
    const current = answers[questionId] || { selectedOptionIds: [], textAnswer: '' };
    let newSelected = [];

    if (type === 'SINGLE_CHOICE' || type === 'TRUE_FALSE') {
      newSelected = [optionId];
    } else if (type === 'MULTI_SELECT') {
      if (current.selectedOptionIds.includes(optionId)) {
        newSelected = current.selectedOptionIds.filter((id) => id !== optionId);
      } else {
        newSelected = [...current.selectedOptionIds, optionId];
      }
    }

    const updated = {
      ...answers,
      [questionId]: {
        ...current,
        selectedOptionIds: newSelected,
      },
    };
    setAnswers(updated);
    triggerAutoSave(updated);
  };

  // Text answer handler
  const handleTextChange = (questionId, text) => {
    const current = answers[questionId] || { selectedOptionIds: [], textAnswer: '' };
    const updated = {
      ...answers,
      [questionId]: {
        ...current,
        textAnswer: text,
      },
    };
    setAnswers(updated);
    triggerAutoSave(updated);
  };

  if (loading || !attemptData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-400">Loading secure exam arena...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = attemptData.questions[currentIndex];
  const totalQuestions = attemptData.questions.length;
  const currentAnswer = answers[currentQuestion.id] || { selectedOptionIds: [], textAnswer: '' };

  const formatTimer = (secs) => {
    if (secs === null) return 'Unlimited';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const answeredCount = Object.values(answers).filter(
    (a) => (a.selectedOptionIds && a.selectedOptionIds.length > 0) || (a.textAnswer && a.textAnswer.trim().length > 0)
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* 1. Sticky Proctor Header Bar */}
      <header className="sticky top-0 z-30 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white truncate max-w-[140px] sm:max-w-xs">
              {attemptData.quizTitle}
            </span>
            {isAutoSaving && (
              <span className="hidden sm:inline-flex items-center space-x-1 text-[11px] text-slate-400">
                <Save className="w-3 h-3 animate-spin" />
                <span>Saving...</span>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Proctor Alert Badge */}
            <div
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                proctorWarnings > 0
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-400 animate-pulse'
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-400'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{proctorWarnings > 0 ? `${proctorWarnings} Warning` : 'Proctored'}</span>
            </div>

            {/* Timer */}
            {remainingSeconds !== null && (
              <div
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-mono text-xs sm:text-sm font-black ${
                  remainingSeconds < 120
                    ? 'bg-rose-600 text-white animate-bounce'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>{formatTimer(remainingSeconds)}</span>
              </div>
            )}

            {/* Question Palette Drawer Toggle */}
            <button
              onClick={() => setShowPalette(true)}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title="Open Question Palette"
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Line */}
        <div className="w-full bg-slate-200 dark:bg-slate-800 h-1 mt-2.5 rounded-full overflow-hidden">
          <div
            className="bg-indigo-600 h-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>
      </header>

      {/* 2. Main Question Card Area */}
      <main className="max-w-3xl mx-auto w-full px-4 py-6 sm:py-10 flex-1 flex flex-col justify-center">
        {/* Anti-Cheating Warning Banner if triggered */}
        {showProctorAlert && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-900 flex items-start justify-between text-rose-700 dark:text-rose-300 text-xs">
            <div className="flex items-start space-x-2.5">
              <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600" />
              <div>
                <span className="font-bold text-sm block">Attention: Tab-Switch Monitored</span>
                You switched tabs or lost window focus. This incident has been recorded in your proctor examination log.
              </div>
            </div>
            <button onClick={() => setShowProctorAlert(false)} className="text-rose-500 hover:text-rose-700 ml-2">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-xl">
          {/* Question Meta Bar */}
          <div className="flex items-center justify-between text-xs mb-4">
            <span className="font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              Question {currentIndex + 1} of {totalQuestions}
            </span>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                {currentQuestion.type.replace('_', ' ')}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold">
                {currentQuestion.points} pt
              </span>
            </div>
          </div>

          {/* Question Text */}
          <h2 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white leading-relaxed mb-6">
            {currentQuestion.text}
          </h2>

          {/* Question Options or Short Answer Input */}
          {currentQuestion.type === 'SHORT_ANSWER' ? (
            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                Type your answer below:
              </label>
              <input
                type="text"
                value={currentAnswer.textAnswer || ''}
                onChange={(e) => handleTextChange(currentQuestion.id, e.target.value)}
                placeholder="Type exact answer here..."
                className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium text-base focus:outline-none focus:border-indigo-600 transition-colors shadow-inner"
              />
            </div>
          ) : (
            <div className="space-y-3">
              {currentQuestion.options.map((opt, idx) => {
                const isSelected = currentAnswer.selectedOptionIds.includes(opt.id);
                const letter = String.fromCharCode(65 + idx);

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleOptionSelect(currentQuestion.id, opt.id, currentQuestion.type)}
                    className={`w-full p-4 rounded-2xl border-2 text-left flex items-center justify-between transition-all group ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50 text-indigo-950 dark:text-indigo-100 shadow-sm ring-2 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3.5 pr-2">
                      <span
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs transition-colors ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-slate-200'
                        }`}
                      >
                        {letter}
                      </span>
                      <span className="text-sm sm:text-base font-medium leading-snug">
                        {opt.text}
                      </span>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-600 text-white'
                          : 'border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* 3. Bottom Sticky Action Navigation */}
      <footer className="sticky bottom-0 z-20 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-4 py-3.5">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <button
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-xs sm:text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none flex items-center space-x-1 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <div className="text-xs text-slate-400 font-medium">
            Answered: <strong className="text-slate-700 dark:text-slate-200">{answeredCount}</strong> of {totalQuestions}
          </div>

          {currentIndex === totalQuestions - 1 ? (
            <button
              onClick={() => setShowSubmitModal(true)}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/20 flex items-center space-x-1.5 transition-all"
            >
              <span>Submit Exam</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={() => setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-indigo-500/20 flex items-center space-x-1 transition-all"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </footer>

      {/* 4. Question Palette Slide-In Drawer */}
      {showPalette && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between shadow-2xl animate-slide-left">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center space-x-2">
                  <Grid className="w-4 h-4 text-indigo-500" />
                  <span>Question Navigator</span>
                </h3>
                <button
                  onClick={() => setShowPalette(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 flex items-center justify-around text-xs py-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <span className="flex items-center space-x-1.5 text-emerald-600 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Answered</span>
                </span>
                <span className="flex items-center space-x-1.5 text-slate-400 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                  <span>Unanswered</span>
                </span>
              </div>

              {/* Grid of numbers */}
              <div className="grid grid-cols-5 gap-2.5 mt-6 max-h-[60vh] overflow-y-auto p-1">
                {attemptData.questions.map((q, idx) => {
                  const ans = answers[q.id];
                  const hasAnswered =
                    (ans?.selectedOptionIds && ans.selectedOptionIds.length > 0) ||
                    (ans?.textAnswer && ans.textAnswer.trim().length > 0);
                  const isCurrent = idx === currentIndex;

                  return (
                    <button
                      key={q.id}
                      onClick={() => {
                        setCurrentIndex(idx);
                        setShowPalette(false);
                      }}
                      className={`h-11 rounded-xl font-bold text-sm flex items-center justify-center transition-all ${
                        isCurrent
                          ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900'
                          : ''
                      } ${
                        hasAnswered
                          ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => {
                setShowPalette(false);
                setShowSubmitModal(true);
              }}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all mt-4"
            >
              Submit Assessment
            </button>
          </div>
        </div>
      )}

      {/* 5. Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center mb-4">
              <Send className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Ready to submit your exam?
            </h3>

            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              You have answered <strong className="text-slate-900 dark:text-white">{answeredCount}</strong> of{' '}
              <strong className="text-slate-900 dark:text-white">{totalQuestions}</strong> questions.
              {totalQuestions - answeredCount > 0 && (
                <span className="block text-amber-500 font-semibold mt-1">
                  You have {totalQuestions - answeredCount} unanswered questions!
                </span>
              )}
            </p>

            <div className="mt-6 flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="w-1/2 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Review Answers
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSubmit(false)}
                className="w-1/2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50"
              >
                {submitting ? 'Grading...' : 'Confirm Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
