'use client';

import React from 'react';
import NextLink from 'next/link';

export default function BrandLogo({ className = '', showText = true, href = '/' }) {
  const content = (
    <div className={`flex items-center space-x-2.5 group ${className}`}>
      {/* User's custom bird logo with transparent background */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        alt="QuizPulse Logo"
        className="h-9 w-auto object-contain drop-shadow group-hover:scale-105 transition-transform"
      />

      {showText && (
        <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">
          Quiz<span className="text-indigo-600 dark:text-indigo-400">Pulse</span>
        </span>
      )}
    </div>
  );

  if (href) {
    return <NextLink href={href}>{content}</NextLink>;
  }

  return content;
}
