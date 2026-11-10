'use client';

import React from 'react';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import BrandLogo from './BrandLogo';
import {
  Sparkles,
  Radio,
  BookOpen,
  Award,
  ShieldCheck,
  CheckCircle,
  Lock,
} from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();

  // Suppress on dedicated focus screens
  const hideFooter =
    pathname?.includes('/attempt') ||
    pathname === '/register' ||
    pathname === '/login' ||
    pathname === '/admin/login';

  if (hideFooter) return null;

  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Col 1: Brand & Description */}
          <div className="space-y-3 md:col-span-1">
            <BrandLogo />
            <p className="text-xs text-slate-400 leading-relaxed mt-2">
              Next-generation quiz and assessment platform. Featuring live multiplayer arenas, tamper-proof server-side grading, and instant verified certificates.
            </p>
            <div className="flex items-center space-x-2 text-[11px] text-emerald-400 font-semibold pt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>All Systems Operational • Real-time Socket.IO</span>
            </div>
          </div>

          {/* Col 2: For Students */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3 flex items-center space-x-1.5">
              <span>🎓 For Students</span>
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <NextLink href="/quizzes" className="hover:text-indigo-400 transition-colors">
                  Explore Public Quizzes
                </NextLink>
              </li>
              <li>
                <NextLink href="/live/join" className="hover:text-indigo-400 transition-colors flex items-center space-x-1">
                  <span>Join Live Arena (PIN)</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] bg-rose-500/20 text-rose-300 font-bold">HOT</span>
                </NextLink>
              </li>
              <li>
                <NextLink href="/quizzes" className="hover:text-indigo-400 transition-colors">
                  View Score History & Reviews
                </NextLink>
              </li>
              <li>
                <NextLink href="/register" className="hover:text-indigo-400 transition-colors">
                  Student Sign Up (Free)
                </NextLink>
              </li>
            </ul>
          </div>

          {/* Col 3: For Teachers & Teams */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3 flex items-center space-x-1.5">
              <span>🧑‍🏫 For Educators & Teams</span>
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <NextLink href="/teacher/quizzes" className="hover:text-indigo-400 transition-colors">
                  Quiz Studio & Builder
                </NextLink>
              </li>
              <li>
                <NextLink href="/teacher/questions" className="hover:text-indigo-400 transition-colors">
                  Categorized Question Bank
                </NextLink>
              </li>
              <li>
                <NextLink href="/teacher/quizzes" className="hover:text-indigo-400 transition-colors">
                  Host Live Multiplayer Session
                </NextLink>
              </li>
              <li>
                <NextLink href="/teacher/quizzes" className="hover:text-indigo-400 transition-colors">
                  Hardest Questions Analytics & CSV
                </NextLink>
              </li>
            </ul>
          </div>

          {/* Col 4: Platform Integrity */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
              🛡️ Security & Integrity
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center space-x-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                <span>Strict Server-Side Grading</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                <span>Anti-Cheat Tab-Switch Logging</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                <span>Tamper-Proof Question Shuffling</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                <span>Verified Certificate Verification</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} QuizPulse. Inspired by game-based learning. All rights reserved.</p>
          <div className="flex items-center space-x-5 text-slate-400">
            <NextLink href="/quizzes" className="hover:text-white transition-colors">
              Quizzes
            </NextLink>
            <NextLink href="/live/join" className="hover:text-white transition-colors">
              Play Live
            </NextLink>
            <NextLink href="/login" className="hover:text-white transition-colors">
              Sign In
            </NextLink>
          </div>
        </div>
      </div>
    </footer>
  );
}
