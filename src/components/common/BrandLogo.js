'use client';

import React from 'react';
import NextLink from 'next/link';

export default function BrandLogo({ className = '', showText = true, href = '/' }) {
  const content = (
    <div className={`flex items-center space-x-2 sm:space-x-2.5 group shrink-0 ${className}`}>
      {/* User's custom bird logo with transparent background */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        alt="QuizPulse Logo"
        className="h-8 sm:h-9 w-auto object-contain drop-shadow group-hover:scale-105 transition-transform shrink-0"
      />

      {showText && (
        <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900 dark:text-white shrink-0 whitespace-nowrap">
          Quiz<span className="text-indigo-600 dark:text-indigo-400">Pulse</span>
        </span>
      )}
    </div>
  );

  if (href) {
    return <NextLink href={href} className="shrink-0">{content}</NextLink>;
  }

  return content;
}
