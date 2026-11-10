'use client';

import React from 'react';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, Radio, Sparkles, Shield, User, Home } from 'lucide-react';

export default function MobileBottomNav() {
  const { user } = useAuth();
  const pathname = usePathname();

  // Hide on quiz attempt, register, and login screens for focused view
  if (pathname?.includes('/attempt') || pathname === '/register' || pathname === '/login') return null;

  const items = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Quizzes', href: '/quizzes', icon: BookOpen },
    { label: 'Live Arena', href: '/live/join', icon: Radio },
    ...(user?.role === 'TEACHER' || user?.role === 'ADMIN'
      ? [{ label: 'Studio', href: '/teacher/quizzes', icon: Sparkles }]
      : []),
    ...(user?.role === 'ADMIN'
      ? [{ label: 'Admin', href: '/admin/platform', icon: Shield }]
      : []),
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
          return (
            <NextLink
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full py-1.5 transition-colors ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
              <span className="text-[11px] mt-1">{item.label}</span>
            </NextLink>
          );
        })}
      </div>
    </nav>
  );
}
