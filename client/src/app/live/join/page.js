'use client';

import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import confetti from 'canvas-confetti';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../lib/api';
import {
  Radio,
  Clock,
  CheckCircle2,
  XCircle,
  Award,
  Sparkles,
  ArrowRight,
  Shield,
} from 'lucide-react';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || '';

export default function LiveJoinPage() {
  const { user } = useAuth();
  const [pin, setPin] = useState('');
  const [nickname, setNickname] = useState('');
  const [joined, setJoined] = useState(false);
  const [quizTitle, setQuizTitle] = useState('');
  const [error, setError] = useState('');

  // Game states: 'WAITING', 'COUNTDOWN', 'QUESTION', 'ANSWERED', 'REVEAL', 'LEADERBOARD', 'FINISHED'
  const [stage, setStage] = useState('WAITING');
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [timerSeconds, setTimerSeconds] = useState(20);
  const [lastAnswerResult, setLastAnswerResult] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);

  const socketRef = useRef(null);
  const eventSourceRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const questionStartTimeRef = useRef(null);
  const playerIdRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlPin = params.get('pin');
      if (urlPin) setPin(urlPin);
    }
  }, []);

  useEffect(() => {
    if (user?.name && !nickname) {
      setNickname(user.name);
    }
  }, [user, nickname]);

  useEffect(() => {
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      if (eventSourceRef.current) eventSourceRef.current.close();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  const handleJoin = async (e) => {
    e.preventDefault();
    setError('');

    const cleanPin = pin.trim();
    if (!cleanPin || cleanPin.length !== 6) {
      setError('Please enter a valid 6-digit game PIN.');
      return;
    }
    if (!nickname.trim()) {
      setError('Please enter your nickname.');
      return;
    }

    try {
      // 1. Verify PIN and register player via REST
      const verifyRes = await api.get(`/live/session/${cleanPin}`);
      setQuizTitle(verifyRes.data.quiz.title);

      if (!playerIdRef.current) {
        playerIdRef.current = user?.id || `guest_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
      }
      const stablePlayerId = playerIdRef.current;

      await api.post(`/live/session/${cleanPin}`, {
        playerId: stablePlayerId,
        name: nickname.trim(),
      });

      setJoined(true);
      setStage('WAITING');

      // 2. Connect Server-Sent Events (SSE) for Vercel real-time streaming
      if (typeof window !== 'undefined' && window.EventSource) {
        if (eventSourceRef.current) eventSourceRef.current.close();
        const es = new EventSource(`/api/live/events/${cleanPin}?playerId=${stablePlayerId}`);
        eventSourceRef.current = es;

        es.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (!data) return;

            if (data.quizTitle) setQuizTitle(data.quizTitle);

            if (data.status === 'WAITING') {
              setStage('WAITING');
            } else if (data.status === 'COUNTDOWN') {
              setStage('COUNTDOWN');
            } else if (data.status === 'QUESTION_ACTIVE' && data.currentQuestion) {
              setCurrentQuestion((prevQ) => {
                if (!prevQ || prevQ.id !== data.currentQuestion.id) {
                  setSelectedOptionId(null);
                  setLastAnswerResult(null);
                  setStage('QUESTION');
                  setTimerSeconds(data.currentQuestion.timeLimitSeconds || 20);
                  questionStartTimeRef.current = Date.now();

                  if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
                  timerIntervalRef.current = setInterval(() => {
                    setTimerSeconds((prev) => {
                      if (prev <= 1) {
                        clearInterval(timerIntervalRef.current);
                        return 0;
                      }
                      return prev - 1;
                    });
                  }, 1000);
                }
                return data.currentQuestion;
              });

              if (data.playerSelfResult) {
                setLastAnswerResult(data.playerSelfResult);
                setStage('ANSWERED');
              }
            } else if (data.status === 'REVEAL') {
              setStage('REVEAL');
              if (data.playerSelfResult) {
                setLastAnswerResult(data.playerSelfResult);
              }
              if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            } else if (data.status === 'LEADERBOARD') {
              setLeaderboard(data.leaderboard || []);
              setStage('LEADERBOARD');
            } else if (data.status === 'FINISHED') {
              setLeaderboard(data.leaderboard || []);
              setStage('FINISHED');
              confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
            }
          } catch (err) {
            console.warn('Live SSE parse error:', err);
          }
        };

        es.onerror = () => {
          // EventSource will auto-reconnect
        };
      }

      // 3. Connect Socket.IO if configured
      if (SOCKET_URL) {
        const socket = io(SOCKET_URL, { transports: ['websocket'] });
        socketRef.current = socket;

        const sendJoin = () => {
          socket.emit('player:join', {
            joinCode: cleanPin,
            studentId: stablePlayerId,
            studentName: nickname.trim(),
          });
        };

        if (socket.connected) {
          sendJoin();
        } else {
          socket.on('connect', sendJoin);
        }

        socket.on('player:joined_success', () => {
          setJoined(true);
          setStage('WAITING');
        });

        socket.on('game:starting', () => {
          setStage('COUNTDOWN');
        });

        socket.on('question:active', (q) => {
          setCurrentQuestion(q);
          setSelectedOptionId(null);
          setLastAnswerResult(null);
          setStage('QUESTION');
          setTimerSeconds(q.timeLimitSeconds || 20);
          questionStartTimeRef.current = Date.now();

          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = setInterval(() => {
            setTimerSeconds((prev) => {
              if (prev <= 1) {
                clearInterval(timerIntervalRef.current);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        });

        socket.on('player:answer_recorded', (result) => {
          setLastAnswerResult(result);
          setStage('ANSWERED');
        });

        socket.on('question:revealed', () => {
          setStage('REVEAL');
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        });

        socket.on('game:leaderboard', (data) => {
          setLeaderboard(data.leaderboard);
          setStage('LEADERBOARD');
        });

        socket.on('game:finished', (data) => {
          setLeaderboard(data.podium);
          setStage('FINISHED');
          confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        });
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Invalid PIN or session not found');
    }
  };

  const handleSelectOption = async (optionId) => {
    if (selectedOptionId || stage !== 'QUESTION') return;

    setSelectedOptionId(optionId);
    setStage('ANSWERED');

    const timeElapsedSeconds = Math.round(
      (Date.now() - (questionStartTimeRef.current || Date.now())) / 1000
    );

    const currentStudentId = playerIdRef.current || user?.id;

    // Dispatch via REST
    try {
      await api.post('/live/action', {
        joinCode: pin.trim(),
        action: 'SUBMIT_ANSWER',
        payload: {
          playerId: currentStudentId,
          selectedOptionIds: [optionId],
          timeElapsedSeconds,
        },
      });
    } catch (e) {
      console.warn('REST submit answer error:', e);
    }

    // Also emit via socket if active
    if (socketRef.current?.connected) {
      socketRef.current.emit('player:submit_answer', {
        joinCode: pin.trim(),
        studentId: currentStudentId,
        selectedOptionIds: [optionId],
        timeElapsedSeconds,
      });
    }
  };

  // Button colors for Kahoot-style mobile ergonomics
  const BUTTON_COLORS = [
    'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/25',
    'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/25',
    'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/25',
    'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25',
  ];

  const BUTTON_SHAPES = ['▲', '◆', '●', '■'];

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4">
      {!joined ? (
        /* PIN Entry Box */
        <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Logo"
            className="w-16 h-16 object-contain mx-auto mb-3"
          />

          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Join Live Quiz Arena
          </h1>
          <p className="text-xs text-slate-400 mt-1 mb-6">
            Enter the 6-digit PIN shown on the host presenter screen.
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <input
                type="text"
                required
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Game PIN"
                className="w-full px-4 py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-2xl font-black font-mono tracking-widest text-center text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <input
                type="text"
                required
                maxLength={20}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Your Nickname"
                className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-center text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-base shadow-lg shadow-rose-600/25 transition-all"
            >
              Enter Arena
            </button>
          </form>
        </div>
      ) : (
        /* Joined Interactive Arena Stage */
        <div className="w-full max-w-md">
          {/* Waiting in Lobby */}
          {stage === 'WAITING' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-4 animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                You&apos;re in, {nickname}!
              </h2>
              <p className="text-xs text-slate-400 mt-2">
                See your name on the presenter screen?
              </p>
              <div className="mt-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
                <span className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                  Active Quiz
                </span>
                <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                  {quizTitle}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-4 animate-pulse">
                Waiting for the teacher to start the countdown...
              </p>
            </div>
          )}

          {/* Countdown Starting */}
          {stage === 'COUNTDOWN' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 border border-slate-200 dark:border-slate-800 shadow-2xl text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-500">
                Get Ready!
              </span>
              <h2 className="text-5xl font-black text-slate-900 dark:text-white my-4 animate-ping">
                3... 2... 1...
              </h2>
            </div>
          )}

          {/* Active Question: Large Tactile Touch Buttons */}
          {stage === 'QUESTION' && currentQuestion && (
            <div className="space-y-4">
              {/* Question Header & Timer */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
                <span className="font-bold text-xs uppercase text-slate-400">
                  Q{currentQuestion.index + 1}
                </span>
                <span className="font-mono font-bold text-rose-500 flex items-center space-x-1 text-sm">
                  <Clock className="w-4 h-4" />
                  <span>{timerSeconds}s</span>
                </span>
              </div>

              {/* Question Card */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-relaxed text-center">
                  {currentQuestion.text}
                </h2>
              </div>

              {/* Big Color-Coded Touch Pads */}
              <div className="grid grid-cols-2 gap-3">
                {currentQuestion.options.map((opt, i) => (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectOption(opt.id)}
                    className={`h-28 rounded-3xl font-extrabold text-base p-4 flex flex-col justify-between items-center transition-transform active:scale-95 shadow-md ${BUTTON_COLORS[i % 4]}`}
                  >
                    <span className="text-xl opacity-75">{BUTTON_SHAPES[i % 4]}</span>
                    <span className="text-center line-clamp-2 text-sm leading-tight">
                      {opt.text}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Answered State (Waiting for host to reveal) */}
          {stage === 'ANSWERED' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl text-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 animate-spin" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Answer Locked!
              </h2>
              <p className="text-xs text-slate-400 mt-2">
                Waiting for the host to reveal the results...
              </p>
            </div>
          )}

          {/* Reveal State */}
          {stage === 'REVEAL' && lastAnswerResult && (
            <div
              className={`rounded-3xl p-8 border shadow-xl text-center ${
                lastAnswerResult.isCorrect
                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500 text-rose-400'
              }`}
            >
              {lastAnswerResult.isCorrect ? (
                <>
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-emerald-500" />
                  <h2 className="text-2xl font-black text-white">Correct!</h2>
                  <p className="text-sm font-bold text-emerald-400 mt-1">
                    +{lastAnswerResult.pointsEarned} Points (Speed Bonus Included!)
                  </p>
                </>
              ) : (
                <>
                  <XCircle className="w-12 h-12 mx-auto mb-2 text-rose-500" />
                  <h2 className="text-2xl font-black text-white">Incorrect</h2>
                  <p className="text-xs text-slate-400 mt-1">Keep going, next question is coming!</p>
                </>
              )}
            </div>
          )}

          {/* Leaderboard or Final Podium */}
          {(stage === 'LEADERBOARD' || stage === 'FINISHED') && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl text-center">
              <Award className="w-10 h-10 text-amber-500 mx-auto mb-2" />
              <h2 className="text-xl font-black text-slate-900 dark:text-white mb-4">
                {stage === 'FINISHED' ? 'Final Standings' : 'Current Leaderboard'}
              </h2>

              <div className="space-y-2 mb-4">
                {leaderboard.slice(0, 5).map((p, idx) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-between text-xs font-bold"
                  >
                    <span>
                      #{idx + 1} {p.name}
                    </span>
                    <span className="font-mono text-emerald-500">{p.score} pts</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
