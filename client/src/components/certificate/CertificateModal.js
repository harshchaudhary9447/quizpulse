'use client';

import React from 'react';
import { Award, Printer, X, CheckCircle, ShieldCheck } from 'lucide-react';

export default function CertificateModal({ isOpen, onClose, data }) {
  if (!isOpen || !data) return null;

  const { studentName, quizTitle, score, totalPoints, percentage, date, attemptId } = data;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
        {/* Top Controls bar (hidden during print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 print:hidden">
          <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
            <CheckCircle className="w-4 h-4" />
            <span>Official Verified Certificate</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Body (Targeted by #printable-certificate in @media print) */}
        <div
          id="printable-certificate"
          className="p-8 sm:p-12 text-center bg-gradient-to-b from-white via-slate-50/30 to-amber-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/80 border-[10px] border-double border-amber-300/60 dark:border-amber-500/30 m-4 rounded-xl relative"
        >
          {/* Watermark badge icon */}
          <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400 to-amber-200 dark:from-amber-500 dark:to-amber-300 flex items-center justify-center text-amber-900 dark:text-amber-950 shadow-lg mb-6">
            <Award className="w-10 h-10" />
          </div>

          <h2 className="text-xs uppercase tracking-widest text-amber-600 dark:text-amber-400 font-bold mb-2">
            QuizPulse Certification Authority
          </h2>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4 font-serif">
            Certificate of Achievement
          </h1>

          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
            This is to proudly certify that
          </p>

          <div className="border-b-2 border-indigo-500/40 inline-block px-8 pb-2 mb-6">
            <span className="text-2xl sm:text-3xl font-bold text-indigo-600 dark:text-indigo-400">
              {studentName || 'Accomplished Scholar'}
            </span>
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-lg mx-auto mb-4">
            has demonstrated proficiency and successfully completed the assessment
          </p>

          <h3 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">
            &ldquo;{quizTitle}&rdquo;
          </h3>

          <div className="flex items-center justify-center space-x-6 text-sm mb-8">
            <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg">
              <span className="block text-xs text-slate-500 dark:text-slate-400">Final Score</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-lg">
                {score} / {totalPoints} ({percentage}%)
              </span>
            </div>
            <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-lg">
              <span className="block text-xs text-slate-500 dark:text-slate-400">Status</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400 text-lg">
                PASSED
              </span>
            </div>
          </div>

          {/* Certificate Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-6 text-xs text-slate-400 dark:text-slate-500">
            <div className="flex items-center space-x-1.5 mb-2 sm:mb-0">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Verified ID: {attemptId ? attemptId.substring(0, 16) : 'QP-VERIFIED'}</span>
            </div>
            <div>
              <span>Awarded on: {date || new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
