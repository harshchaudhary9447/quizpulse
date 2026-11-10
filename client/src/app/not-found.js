import React from 'react';
import NextLink from 'next/link';
import { HelpCircle, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center p-4 text-center">
      <div className="max-w-md bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4">
          <HelpCircle className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">404</h1>
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-200 mt-1">
          Page Not Found
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 mb-6">
          The assessment or page you are looking for does not exist or may have been relocated.
        </p>
        <NextLink
          href="/"
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </NextLink>
      </div>
    </div>
  );
}
