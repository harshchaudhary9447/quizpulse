'use client';

import React, { useState } from 'react';
import Link from 'next/navigation';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Zap,
  Moon,
  Sun,
  LogOut,
  User,
  Shield,
  GraduationCap,
  Sparkles,
  BookOpen,
  Radio,
  Menu,
  X,
} from 'lucide-react';

import BrandLogo from './BrandLogo';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Don't render full navbar during active quiz attempt, sign-up onboarding, or login
  const hideNavbar = pathname?.includes('/attempt') || pathname === '/register' || pathname === '/login';
  if (hideNavbar) return null;

  const navLinks = [
    { label: 'Explore Quizzes', href: '/quizzes', icon: BookOpen },
    { label: 'Live Arena', href: '/live/join', icon: Radio },
    ...(user?.role === 'TEACHER' || user?.role === 'ADMIN'
      ? [
          { label: 'Question Bank', href: '/teacher/questions', icon: Sparkles },
          { label: 'Quiz Studio', href: '/teacher/quizzes', icon: GraduationCap },
        ]
      : []),
    ...(user?.role === 'ADMIN'
      ? [{ label: 'Admin Panel', href: '/admin/platform', icon: Shield }]
      : []),
  ];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <BrandLogo />

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
              return (
                <NextLink
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NextLink>
              );
            })}
          </nav>

          {/* Right Controls: Quick Play, Theme Toggle & User Info */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Quick Play with PIN (Kahoot-style Instant Join) */}
            <NextLink
              href="/live/join"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm shadow-emerald-500/20 transition-all hover:scale-105"
            >
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>Play PIN</span>
            </NextLink>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle Dark Mode"
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
            </button>

            {user ? (
              <div className="flex items-center space-x-3">
                <NextLink
                  href={user.role === 'STUDENT' ? '/quizzes' : user.role === 'TEACHER' ? '/teacher/quizzes' : '/admin/platform'}
                  className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>{user.name.split(' ')[0]}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                    {user.role}
                  </span>
                </NextLink>

                <button
                  onClick={logout}
                  title="Log out"
                  className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <NextLink
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Log in
                </NextLink>
                <NextLink
                  href="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-500/20 transition-all hover:shadow"
                >
                  Get Started
                </NextLink>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 dark:text-slate-300"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NextLink
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Icon className="w-5 h-5 text-indigo-500" />
                  <span>{item.label}</span>
                </NextLink>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
}
