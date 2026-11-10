'use client';

import React, { useState, useEffect } from 'react';
import api from '../../../lib/api';
import {
  Sparkles,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit3,
  CheckCircle2,
  XCircle,
  X,
  Bot,
  Layers,
  HelpCircle,
  Tag,
} from 'lucide-react';

export default function QuestionBankPage() {
  const [questions, setQuestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiDifficulty, setAiDifficulty] = useState('MEDIUM');
  const [aiGeneratedList, setAiGeneratedList] = useState([]);

  // Create Question Form State
  const [formText, setFormText] = useState('');
  const [formExplanation, setFormExplanation] = useState('');
  const [formType, setFormType] = useState('SINGLE_CHOICE');
  const [formDifficulty, setFormDifficulty] = useState('MEDIUM');
  const [formCategory, setFormCategory] = useState('Web Development');
  const [formTags, setFormTags] = useState('');
  const [formOptions, setFormOptions] = useState([
    { text: '', isCorrect: true },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ]);
  const [formError, setFormError] = useState('');
  const [savingQuestion, setSavingQuestion] = useState(false);

  useEffect(() => {
    fetchQuestions();
    fetchCategories();
  }, [categoryFilter, typeFilter, difficultyFilter]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (categoryFilter) params.append('category', categoryFilter);
      if (typeFilter) params.append('type', typeFilter);
      if (difficultyFilter) params.append('difficulty', difficultyFilter);

      const res = await api.get(`/questions?${params.toString()}`);
      setQuestions(res?.data?.questions || []);
    } catch (err) {
      console.error('Failed to load questions:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/questions/categories');
      setCategories(res?.data || []);
    } catch (err) {
      console.warn('Failed to load categories:', err);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchQuestions();
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      await api.delete(`/questions/${id}`);
      setQuestions((prev) => prev.filter((q) => q.id !== id));
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Delete failed');
    }
  };

  // Create Question
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSavingQuestion(true);

    try {
      const tagsArray = formTags.split(',').map((t) => t.trim()).filter(Boolean);
      await api.post('/questions', {
        text: formText,
        explanation: formExplanation || null,
        type: formType,
        difficulty: formDifficulty,
        category: formCategory,
        tags: tagsArray,
        options: formOptions.map((opt, idx) => ({
          text: opt.text,
          isCorrect: Boolean(opt.isCorrect),
          order: idx,
        })),
      });

      setShowCreateModal(false);
      resetForm();
      fetchQuestions();
    } catch (err) {
      setFormError(err.response?.data?.error?.message || 'Failed to create question');
    } finally {
      setSavingQuestion(false);
    }
  };

  const resetForm = () => {
    setFormText('');
    setFormExplanation('');
    setFormType('SINGLE_CHOICE');
    setFormDifficulty('MEDIUM');
    setFormCategory('Web Development');
    setFormTags('');
    setFormOptions([
      { text: '', isCorrect: true },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
    ]);
    setFormError('');
  };

  // AI Generation
  const handleAiGenerate = async (e) => {
    e.preventDefault();
    if (!aiTopic.trim()) return;
    setAiGenerating(true);

    try {
      const res = await api.post('/questions/ai-generate', {
        topic: aiTopic,
        difficulty: aiDifficulty,
        count: 2,
      });
      setAiGeneratedList(res.data);
    } catch (err) {
      alert(err.response?.data?.error?.message || 'AI Generation failed');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSaveAiQuestion = async (q) => {
    try {
      await api.post('/questions', q);
      setAiGeneratedList((prev) => prev.filter((item) => item.text !== q.text));
      fetchQuestions();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to save question');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Question Bank
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Build and manage reusable questions across multiple types and categories.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAiModal(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-purple-500/20 flex items-center space-x-1.5 transition-all"
          >
            <Bot className="w-4 h-4" />
            <span>AI Generator</span>
          </button>

          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-indigo-500/20 flex items-center space-x-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Question</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 mb-6 flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </form>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="">All Types</option>
          <option value="SINGLE_CHOICE">Single Choice</option>
          <option value="MULTI_SELECT">Multi-Select</option>
          <option value="TRUE_FALSE">True / False</option>
          <option value="SHORT_ANSWER">Short Answer</option>
        </select>

        <select
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="">All Difficulties</option>
          <option value="EASY">Easy</option>
          <option value="MEDIUM">Medium</option>
          <option value="HARD">Hard</option>
        </select>
      </div>

      {/* Questions List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-slate-200/50 dark:bg-slate-800/50 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
          <HelpCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">No Questions Found</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Try adjusting your search filters or click &ldquo;New Question&rdquo; to create one.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q) => (
            <div
              key={q.id}
              className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                      {q.category}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                        q.difficulty === 'EASY'
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40'
                          : q.difficulty === 'MEDIUM'
                          ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40'
                          : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40'
                      }`}
                    >
                      {q.difficulty}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {q.type.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug">
                    {q.text}
                  </h3>

                  {/* Options display */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                    {q.options.map((opt) => (
                      <div
                        key={opt.id}
                        className={`px-3 py-1.5 rounded-lg text-xs flex items-center justify-between ${
                          opt.isCorrect
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800'
                            : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <span className="truncate">{opt.text}</span>
                        {opt.isCorrect && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 ml-2 flex-shrink-0" />}
                      </div>
                    ))}
                  </div>

                  {q.explanation && (
                    <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 italic">
                      💡 {q.explanation}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleDelete(q.id)}
                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                    title="Delete question"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 1. Create Question Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Create New Question
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Question Text
                </label>
                <textarea
                  required
                  rows={2}
                  value={formText}
                  onChange={(e) => setFormText(e.target.value)}
                  placeholder="e.g. Which HTTP method is idempotent?"
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Question Type
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => {
                      const newType = e.target.value;
                      setFormType(newType);
                      if (newType === 'TRUE_FALSE') {
                        setFormOptions([
                          { text: 'True', isCorrect: true },
                          { text: 'False', isCorrect: false },
                        ]);
                      } else if (newType === 'SHORT_ANSWER') {
                        setFormOptions([{ text: '', isCorrect: true }]);
                      } else {
                        setFormOptions([
                          { text: '', isCorrect: true },
                          { text: '', isCorrect: false },
                          { text: '', isCorrect: false },
                          { text: '', isCorrect: false },
                        ]);
                      }
                    }}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="SINGLE_CHOICE">Single Choice</option>
                    <option value="MULTI_SELECT">Multi-Select</option>
                    <option value="TRUE_FALSE">True / False</option>
                    <option value="SHORT_ANSWER">Short Answer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    required
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="e.g. Web Development"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Difficulty
                  </label>
                  <select
                    value={formDifficulty}
                    onChange={(e) => setFormDifficulty(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>
              </div>

              {/* Options Builder */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Answer Options (Check the correct key)
                </label>
                <div className="space-y-2">
                  {formOptions.map((opt, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <input
                        type={formType === 'MULTI_SELECT' ? 'checkbox' : 'radio'}
                        name="correct-option"
                        checked={opt.isCorrect}
                        onChange={(e) => {
                          if (formType === 'MULTI_SELECT') {
                            const updated = [...formOptions];
                            updated[idx].isCorrect = e.target.checked;
                            setFormOptions(updated);
                          } else {
                            const updated = formOptions.map((o, i) => ({
                              ...o,
                              isCorrect: i === idx,
                            }));
                            setFormOptions(updated);
                          }
                        }}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                      <input
                        type="text"
                        required
                        value={opt.text}
                        onChange={(e) => {
                          const updated = [...formOptions];
                          updated[idx].text = e.target.value;
                          setFormOptions(updated);
                        }}
                        placeholder={`Option ${idx + 1}`}
                        className="flex-1 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                      />
                      {formOptions.length > 2 && formType !== 'TRUE_FALSE' && (
                        <button
                          type="button"
                          onClick={() => setFormOptions(formOptions.filter((_, i) => i !== idx))}
                          className="p-1.5 text-slate-400 hover:text-rose-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {formType !== 'TRUE_FALSE' && formType !== 'SHORT_ANSWER' && formOptions.length < 6 && (
                  <button
                    type="button"
                    onClick={() => setFormOptions([...formOptions, { text: '', isCorrect: false }])}
                    className="mt-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Another Option</span>
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Explanation / Rationale (Shown post-exam review)
                </label>
                <textarea
                  rows={2}
                  value={formExplanation}
                  onChange={(e) => setFormExplanation(e.target.value)}
                  placeholder="Explain why this answer is correct..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-4 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingQuestion}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 disabled:opacity-50"
                >
                  {savingQuestion ? 'Saving...' : 'Save Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. AI Question Generator Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    AI Question Generator
                  </h2>
                  <span className="text-[10px] text-purple-600 font-bold uppercase tracking-wider">
                    Feature-Flagged Intelligence Engine
                  </span>
                </div>
              </div>
              <button onClick={() => setShowAiModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAiGenerate} className="flex gap-2 mb-6">
              <input
                type="text"
                required
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder="Topic: e.g. React Hooks, Python Dictionaries, Network Protocols..."
                className="flex-1 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <select
                value={aiDifficulty}
                onChange={(e) => setAiDifficulty(e.target.value)}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
              <button
                type="submit"
                disabled={aiGenerating}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-500/20 disabled:opacity-50 flex items-center space-x-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{aiGenerating ? 'Generating...' : 'Generate'}</span>
              </button>
            </form>

            {/* Generated results */}
            {aiGeneratedList.length > 0 && (
              <div className="space-y-4 max-h-[50vh] overflow-y-auto">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Generated Suggestions ({aiGeneratedList.length})
                </h3>
                {aiGeneratedList.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700"
                  >
                    <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white mb-2">
                      {item.text}
                    </p>
                    <div className="space-y-1 mb-3">
                      {item.options.map((opt, i) => (
                        <div key={i} className="text-xs text-slate-600 dark:text-slate-300 flex items-center space-x-1">
                          <span className={opt.isCorrect ? 'text-emerald-500 font-bold' : 'text-slate-400'}>
                            {opt.isCorrect ? '✓' : '•'}
                          </span>
                          <span>{opt.text}</span>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => handleSaveAiQuestion(item)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add to Question Bank</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
