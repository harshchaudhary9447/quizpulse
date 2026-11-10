'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { io } from 'socket.io-client';
import confetti from 'canvas-confetti';
import { useAuth } from '../../../../context/AuthContext';
import api from '../../../../lib/api';
import {
  Radio,
  Users,
  Play,
  ArrowRight,
  Award,
  Clock,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  ChevronRight,
  BarChart2,
} from 'lucide-react';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || '';

export default function LiveHostPage() {
  const { quizId } = useParams();
  const { user } = useAuth();
  const router = useRouter();

  const [session, setSession] = useState(null);
  const [joinCode, setJoinCode] = useState('');
  const [players, setPlayers] = useState([]);
  const [gameState, setGameState] = useState('LOBBY'); // LOBBY, QUESTION, REVEAL, LEADERBOARD, FINISHED
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [revealedData, setRevealedData] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(20);

  const socketRef = useRef(null);
  const eventSourceRef = useRef(null);
  const timerIntervalRef = useRef(null);

  // 1. Create live session and connect real-time streaming
  useEffect(() => {
    async function initSession() {
      try {
        const res = await api.post('/live/create', { quizId });
        const liveSession = res.data;
        setSession(liveSession);
        setJoinCode(liveSession.joinCode);

        // Connect Server-Sent Events (SSE) for Vercel real-time streaming
        if (typeof window !== 'undefined' && window.EventSource) {
          if (eventSourceRef.current) eventSourceRef.current.close();
          const es = new EventSource(`/api/live/events/${liveSession.joinCode}`);
          eventSourceRef.current = es;

          es.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
              if (!data) return;

              if (data.players) setPlayers(data.players);
              if (data.answeredCount !== undefined) setAnsweredCount(data.answeredCount);

              if (data.status === 'QUESTION_ACTIVE' && data.currentQuestion) {
                setCurrentQuestion((prevQ) => {
                  if (!prevQ || prevQ.id !== data.currentQuestion.id) {
                    setGameState('QUESTION');
                    setRevealedData(null);
                    setTimerSeconds(data.currentQuestion.timeLimitSeconds || 20);

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
              } else if (data.status === 'REVEAL') {
                if (data.revealedData) setRevealedData(data.revealedData);
                setGameState('REVEAL');
                if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
              } else if (data.status === 'LEADERBOARD') {
                if (data.leaderboard) setLeaderboard(data.leaderboard);
                setGameState('LEADERBOARD');
              } else if (data.status === 'FINISHED') {
                if (data.leaderboard) setLeaderboard(data.leaderboard);
                setGameState('FINISHED');
                confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
              }
            } catch (err) {
              console.warn('Host SSE parse error:', err);
            }
          };
        }

        // Connect Socket.IO if configured
        if (SOCKET_URL) {
          const socket = io(SOCKET_URL, {
            transports: ['websocket'],
          });
          socketRef.current = socket;

          const sendRegister = () => {
            socket.emit('host:register', {
              joinCode: liveSession.joinCode,
              hostId: user?.id,
            });
          };

          if (socket.connected) {
            sendRegister();
          } else {
            socket.on('connect', sendRegister);
          }

          socket.on('host:ready', (data) => {
            setPlayers(data.players || []);
          });

          socket.on('room:players_updated', (data) => {
            setPlayers(data.players || []);
          });

          socket.on('host:answer_received', (data) => {
            setAnsweredCount(data.answeredCount);
          });

          socket.on('question:active', (q) => {
            setCurrentQuestion(q);
            setGameState('QUESTION');
            setRevealedData(null);
            setAnsweredCount(0);
            setTimerSeconds(q.timeLimitSeconds || 20);

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

          socket.on('question:revealed', (data) => {
            setRevealedData(data);
            setGameState('REVEAL');
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          });

          socket.on('game:leaderboard', (data) => {
            setLeaderboard(data.leaderboard);
            setGameState('LEADERBOARD');
          });

          socket.on('game:finished', (data) => {
            setLeaderboard(data.podium);
            setGameState('FINISHED');
            confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
          });
        }
      } catch (err) {
        console.error('Failed to create live session:', err);
      }
    }

    if (quizId && user) {
      initSession();
    }

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      if (eventSourceRef.current) eventSourceRef.current.close();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [quizId, user]);

  const handleStartGame = async () => {
    if (!joinCode) return;
    try {
      await api.post('/live/action', { joinCode, action: 'START_GAME' });
      if (socketRef.current?.connected) {
        socketRef.current.emit('host:start_game', { joinCode });
      }
      setTimeout(async () => {
        await api.post('/live/action', { joinCode, action: 'NEXT_QUESTION' });
        if (socketRef.current?.connected) {
          socketRef.current.emit('host:next_question', { joinCode });
        }
      }, 1500);
    } catch (e) {
      console.warn('Start game error:', e);
    }
  };

  const handleRevealAnswer = async () => {
    if (!joinCode) return;
    try {
      await api.post('/live/action', { joinCode, action: 'REVEAL_ANSWER' });
      if (socketRef.current?.connected) {
        socketRef.current.emit('host:reveal_answer', { joinCode });
      }
    } catch (e) {
      console.warn('Reveal answer error:', e);
    }
  };

  const handleShowLeaderboard = async () => {
    if (!joinCode) return;
    try {
      await api.post('/live/action', { joinCode, action: 'SHOW_LEADERBOARD' });
      if (socketRef.current?.connected) {
        socketRef.current.emit('host:show_leaderboard', { joinCode });
      }
    } catch (e) {
      console.warn('Show leaderboard error:', e);
    }
  };

  const handleNextQuestion = async () => {
    if (!joinCode) return;
    try {
      await api.post('/live/action', { joinCode, action: 'NEXT_QUESTION' });
      if (socketRef.current?.connected) {
        socketRef.current.emit('host:next_question', { joinCode });
      }
    } catch (e) {
      console.warn('Next question error:', e);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(joinCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 sm:p-8 selection:bg-rose-500 selection:text-white">
      {/* Top Header */}
      <header className="flex items-center justify-between pb-6 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
            <Radio className="w-6 h-6 animate-pulse text-white" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-widest text-rose-400 font-bold">
              Live Arena Controller
            </span>
            <h1 className="text-xl sm:text-2xl font-black">
              {session?.quiz?.title || 'Interactive Session'}
            </h1>
          </div>
        </div>

        {/* Join Code Display */}
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">
              Join at /live/join
            </span>
            <button
              onClick={handleCopyCode}
              className="flex items-center space-x-2 text-2xl sm:text-3xl font-black font-mono tracking-widest text-amber-400 hover:text-amber-300 transition-colors"
            >
              <span>{joinCode || '------'}</span>
              {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5 text-slate-500" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Interactive Stage */}
      <main className="flex-1 flex flex-col items-center justify-center my-8">
        {/* State 1: Lobby */}
        {gameState === 'LOBBY' && (
          <div className="max-w-2xl w-full text-center">
            <div className="mb-6">
              <span className="text-sm font-bold uppercase tracking-widest text-slate-400">
                Waiting for Players to Join
              </span>
              <div className="text-6xl sm:text-8xl font-black font-mono tracking-widest text-amber-400 my-4 select-all">
                {joinCode}
              </div>
              <p className="text-xs sm:text-sm text-slate-400">
                Direct candidates to open <strong className="text-white">QuizPulse &gt; Live Arena</strong> and enter the 6-digit PIN.
              </p>
            </div>

            {/* Players Grid */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl mb-8">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-4 pb-2 border-b border-slate-800">
                <span className="flex items-center space-x-1.5">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <span>Connected Participants</span>
                </span>
                <span className="text-emerald-400">{players.length} Ready</span>
              </div>

              {players.length === 0 ? (
                <p className="py-8 text-xs text-slate-500 animate-pulse">
                  Waiting for players to buzz in with PIN...
                </p>
              ) : (
                <div className="flex flex-wrap gap-2 justify-center max-h-48 overflow-y-auto">
                  {players.map((p) => (
                    <span
                      key={p.id}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-white shadow-sm flex items-center space-x-1.5"
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span>{p.name}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleStartGame}
              disabled={players.length === 0}
              className="px-10 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-lg shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2 mx-auto disabled:opacity-30 disabled:pointer-events-none"
            >
              <Play className="w-6 h-6 fill-current" />
              <span>Launch Live Game</span>
            </button>
          </div>
        )}

        {/* State 2: Question Active */}
        {gameState === 'QUESTION' && currentQuestion && (
          <div className="max-w-3xl w-full text-center">
            <div className="flex items-center justify-between mb-4 text-xs">
              <span className="font-bold text-slate-400 uppercase tracking-widest">
                Question {currentQuestion.index + 1} of {currentQuestion.total}
              </span>
              <span className="font-mono text-lg font-bold text-amber-400 flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{timerSeconds}s</span>
              </span>
            </div>

            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl mb-8">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-relaxed mb-8">
                {currentQuestion.text}
              </h2>

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentQuestion.options.map((opt, i) => {
                  const colors = [
                    'bg-rose-500/20 border-rose-500/50 text-rose-200',
                    'bg-blue-500/20 border-blue-500/50 text-blue-200',
                    'bg-amber-500/20 border-amber-500/50 text-amber-200',
                    'bg-emerald-500/20 border-emerald-500/50 text-emerald-200',
                  ];
                  return (
                    <div
                      key={opt.id}
                      className={`p-4 rounded-2xl border text-left font-bold text-sm sm:text-base flex items-center space-x-3 ${colors[i % 4]}`}
                    >
                      <span className="w-7 h-7 rounded-lg bg-black/40 flex items-center justify-center text-xs">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span>{opt.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Answered counter & Reveal button */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400 font-semibold">
                Answers Received: <strong className="text-emerald-400">{answeredCount}</strong> / {players.length}
              </span>

              <button
                onClick={handleRevealAnswer}
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all flex items-center space-x-2"
              >
                <span>Reveal Correct Key</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* State 3: Answer Revealed */}
        {gameState === 'REVEAL' && currentQuestion && (
          <div className="max-w-3xl w-full text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2 block">
              Question Results Revealed
            </span>

            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl mb-8">
              <h2 className="text-xl sm:text-2xl font-extrabold text-white mb-6">
                {currentQuestion.text}
              </h2>

              <div className="space-y-3 mb-6">
                {currentQuestion.options.map((opt) => {
                  const isCorrect = revealedData?.correctOptionIds?.includes(opt.id);
                  const votes = revealedData?.distribution?.[opt.id] || 0;
                  return (
                    <div
                      key={opt.id}
                      className={`p-4 rounded-2xl border flex items-center justify-between text-sm sm:text-base font-bold ${
                        isCorrect
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                          : 'bg-slate-800/60 border-slate-700 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        {isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                        <span>{opt.text}</span>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-black/40 text-xs font-mono">
                        {votes} answer{votes === 1 ? '' : 's'}
                      </span>
                    </div>
                  );
                })}
              </div>

              {revealedData?.explanation && (
                <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-900/60 text-xs text-indigo-200 text-left">
                  💡 <strong>Explanation:</strong> {revealedData.explanation}
                </div>
              )}
            </div>

            <button
              onClick={handleShowLeaderboard}
              className="px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-xl flex items-center space-x-2 mx-auto"
            >
              <span>Show Leaderboard</span>
              <BarChart2 className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* State 4: Leaderboard */}
        {gameState === 'LEADERBOARD' && (
          <div className="max-w-xl w-full text-center">
            <h2 className="text-2xl sm:text-3xl font-black text-amber-400 mb-6 flex items-center justify-center space-x-2">
              <Award className="w-7 h-7" />
              <span>Live Leaderboard</span>
            </h2>

            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl mb-8 space-y-2">
              {leaderboard.map((p, idx) => (
                <div
                  key={p.id}
                  className={`p-3.5 rounded-2xl flex items-center justify-between font-bold text-sm ${
                    idx === 0
                      ? 'bg-amber-500/20 border border-amber-500/40 text-amber-200'
                      : idx === 1
                      ? 'bg-slate-300/10 border border-slate-500/30 text-slate-200'
                      : idx === 2
                      ? 'bg-amber-800/20 border border-amber-800/40 text-amber-300'
                      : 'bg-slate-800/40 text-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="w-6 text-center text-xs text-slate-400">#{idx + 1}</span>
                    <span>{p.name}</span>
                  </div>
                  <span className="font-mono text-emerald-400">{p.score} pts</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleNextQuestion}
              className="px-8 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-sm shadow-xl flex items-center space-x-2 mx-auto"
            >
              <span>Next Question</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* State 5: Finished Podium */}
        {gameState === 'FINISHED' && (
          <div className="max-w-xl w-full text-center">
            <div className="w-16 h-16 rounded-3xl bg-amber-400 text-slate-950 flex items-center justify-center mx-auto mb-4 shadow-xl">
              <Award className="w-10 h-10" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">
              Live Quiz Champion!
            </h2>
            <p className="text-xs text-slate-400 mb-8">
              Session concluded successfully.
            </p>

            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl mb-8 space-y-3">
              {leaderboard.slice(0, 3).map((p, idx) => (
                <div
                  key={p.id}
                  className="p-4 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-between text-base font-bold text-amber-200"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</span>
                    <span>{p.name}</span>
                  </div>
                  <span className="font-mono font-black text-white">{p.score} pts</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => router.push('/teacher/quizzes')}
              className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs sm:text-sm"
            >
              Return to Studio
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
