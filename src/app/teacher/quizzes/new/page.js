'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NextLink from 'next/link';
import api from '../../../../lib/api';
import {
  GraduationCap,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Award,
  Lock,
  Shuffle,
  Search,
  Plus,
  Layers,
  HelpCircle,
  Save,
} from 'lucide-react';

export default function NewQuizPage() {
  const router = useRouter();
  const [questionsBank, setQuestionsBank] = useState([]);
  const [searchQuestion, setSearchQuestion] = useState('');
  const [selectedQuestions, setSelectedQuestions] = useState([]); // array of question IDs
  const [pointsMap, setPointsMap] = useState({}); // { [qId]: points }

  // Quiz Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(15);
  const [passPercentage, setPassPercentage] = useState(70);
  const [maxAttempts, setMaxAttempts] = useState(2);
  const [accessCode, setAccessCode] = useState('');
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(true);
  const [isPublished, setIsPublished] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadQuestions() {
      try {
        const res = await api.get('/questions?limit=100');
        setQuestionsBank(res?.data?.questions || []);
      } catch (err) {
        console.error('Failed to load bank questions:', err);
      }
    }
    loadQuestions();
  }, []);

  const handleToggleQuestion = (id) => {
    if (selectedQuestions.includes(id)) {
      setSelectedQuestions(selectedQuestions.filter((qId) => qId !== id));
    } else {
      setSelectedQuestions([...selectedQuestions, id]);
      if (!pointsMap[id]) {
        setPointsMap((prev) => ({ ...prev, [id]: 1.0 }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (selectedQuestions.length === 0) {
      setError('Please select at least one question for your quiz.');
      return;
    }

    setSaving(true);
    try {
      const questionsPayload = selectedQuestions.map((qId, idx) => ({
        questionId: qId,
        order: idx,
        points: pointsMap[qId] || 1.0,
      }));

      await api.post('/quizzes', {
        title,
        description: description || null,
        timeLimitMinutes: Number(timeLimitMinutes),
        passPercentage: Number(passPercentage),
        maxAttempts: Number(maxAttempts),
        accessCode: accessCode.trim() || null,
        shuffleQuestions,
        shuffleOptions,
        isPublished,
        questions: questionsPayload,
      });

      router.push('/teacher/quizzes');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to create quiz');
      setSaving(false);
    }
  };

  const filteredQuestions = questionsBank.filter((q) =>
    q.text.toLowerCase().includes(searchQuestion.toLowerCase()) ||
    q.category.toLowerCase().includes(searchQuestion.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <NextLink
        href="/teacher/quizzes"
        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Quiz Studio</span>
      </NextLink>

      <div className="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Quiz Builder Wizard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure examination rules and assemble questions from your Question Bank.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-sm font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Basic Information */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
            1. Quiz Details & Overview
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Quiz Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Full-Stack JavaScript & Node.js Assessment"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Instructions or topic scope for the students..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Section 2: Rules & Examination Settings */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
            2. Exam Parameters & Security
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                <span>Time Limit (Minutes)</span>
              </label>
              <input
                type="number"
                min={0}
                max={180}
                required
                value={timeLimitMinutes}
                onChange={(e) => setTimeLimitMinutes(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
              />
              <span className="text-[10px] text-slate-400">Set 0 for unlimited time.</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center space-x-1">
                <Award className="w-3.5 h-3.5 text-emerald-500" />
                <span>Pass Mark (%)</span>
              </label>
              <input
                type="number"
                min={1}
                max={100}
                required
                value={passPercentage}
                onChange={(e) => setPassPercentage(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
              />
              <span className="text-[10px] text-slate-400">Default pass score requirement.</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center space-x-1">
                <Layers className="w-3.5 h-3.5 text-blue-500" />
                <span>Max Attempts per Student</span>
              </label>
              <input
                type="number"
                min={1}
                max={10}
                required
                value={maxAttempts}
                onChange={(e) => setMaxAttempts(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
              />
              <span className="text-[10px] text-slate-400">Limits repeated retakes.</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center space-x-1">
                <Lock className="w-3.5 h-3.5 text-amber-500" />
                <span>Access Code (Optional)</span>
              </label>
              <input
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="e.g. EXAM2026"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white uppercase tracking-wider font-mono"
              />
              <span className="text-[10px] text-slate-400">Secret passcode to enter quiz.</span>
            </div>

            <div className="space-y-3 pt-6">
              <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={shuffleQuestions}
                  onChange={(e) => setShuffleQuestions(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <span>Randomize Question Order per student</span>
              </label>

              <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={shuffleOptions}
                  onChange={(e) => setShuffleOptions(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <span>Randomize Answer Options per question</span>
              </label>

              <label className="flex items-center space-x-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <span>Publish immediately to student assessment center</span>
              </label>
            </div>
          </div>
        </div>

        {/* Section 3: Question Bank Picker */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                3. Select Questions ({selectedQuestions.length} Selected)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose questions from your bank to include in this exam.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuestion}
                onChange={(e) => setSearchQuestion(e.target.value)}
                placeholder="Filter questions..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
            {filteredQuestions.map((q) => {
              const isSelected = selectedQuestions.includes(q.id);
              return (
                <div
                  key={q.id}
                  onClick={() => handleToggleQuestion(q.id)}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-4 ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}} // handled by parent div click
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 pointer-events-none"
                    />
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {q.category}
                        </span>
                        <span className="text-[10px] font-bold uppercase text-slate-400">
                          {q.type.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white">
                        {q.text}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center space-x-1.5 text-xs text-slate-500 flex-shrink-0"
                    >
                      <span>Points:</span>
                      <input
                        type="number"
                        min={0.5}
                        step={0.5}
                        max={10}
                        value={pointsMap[q.id] || 1.0}
                        onChange={(e) =>
                          setPointsMap({ ...pointsMap, [q.id]: parseFloat(e.target.value) || 1.0 })
                        }
                        className="w-14 px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-center font-bold text-slate-900 dark:text-white"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-end space-x-3 pt-4">
          <NextLink
            href="/teacher/quizzes"
            className="px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </NextLink>
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 flex items-center space-x-2 disabled:opacity-50 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Creating Quiz...' : 'Create & Save Quiz'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
