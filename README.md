# ⚡ QuizPulse — Modern Online Quiz System

A production-style, mobile-first Online Quiz and Assessment System with strict server-side grading, anti-cheating proctoring, real-time multiplayer arenas, and automated PDF certification.

---

## 🌟 Key Features

- **🛡️ Server-Side Grading Only**: Correct answers and rationales are strictly withheld on the backend during test delivery, eliminating client-side inspection vulnerabilities.
- **📱 Mobile-First Responsive UX**: Optimized for smartphones and tablets with a dedicated tactile bottom navigation bar, sticky countdown timer, touch-friendly answer selectors, and quick-access palette drawers.
- **👁️ Anti-Cheating Proctoring**: Detects and logs tab-switching and window focus changes (`document.visibilitychange`), prevents concurrent attempts, and randomizes question and option orders.
- **⚡ Multiplayer Live Arena**: Socket.IO-powered real-time live quizzing with a 6-digit Join PIN, question broadcasting, timed answer buzzers, and live leaderboards.
- **📊 Cohort Analytics & CSV Export**: Recharts-based score distribution histogram, top hardest diagnostic questions analysis, and downloadable CSV grade sheets for educators.
- **🏆 Official Verified Certificates**: Built-in verified certificate modal with print-to-PDF support on passing attempts.
- **🤖 AI Question Generator (Feature-Flagged)**: Intelligent question generation stub allowing teachers to auto-generate questions from topic prompts.
- **🌓 Dark Mode**: Built-in persistent dark and light theme toggle with Tailwind CSS.

---

## 🏗️ Architecture & Tech Stack

```text
Quiz System/
├── server/          # Node.js + Express + Prisma ORM + Socket.IO + JWT
└── client/          # Next.js 14+ (App Router) + Tailwind CSS + Recharts + Lucide Icons
```

- **Frontend**: Next.js 14 (App Router), Tailwind CSS, Axios, Lucide React, Recharts, Canvas-Confetti
- **Backend**: Node.js, Express, Prisma ORM, SQLite (local dev) / PostgreSQL (production), Socket.IO, JWT, bcryptjs, Helmet, CORS, Express-Rate-Limit, Zod
- **Testing**: Vitest + Supertest integration suite

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+ or v20+)
- npm

### 1. Backend Setup & Seeding
```bash
cd server

# Install backend dependencies
npm install

# Initialize database schema and generate Prisma client
npx prisma db push

# Seed the database (1 Admin, 2 Teachers, 5 Students, 30 Questions, 3 Quizzes)
npm run seed

# Run automated tests
npm test

# Start backend server (runs on http://localhost:5000)
npm run dev
```

### 2. Frontend Setup
In a new terminal window:
```bash
cd client

# Install frontend dependencies
npm install

# Start Next.js development server (runs on http://localhost:3000)
npm run dev
```

Visit **[http://localhost:3000](http://localhost:3000)** in your browser!

---

## 🔑 Pre-Seeded Demo Credentials

All accounts come pre-configured in the database:

| Role | Email | Password | Access Capabilities |
|---|---|---|---|
| **Admin** | `admin@quizpulse.com` | `Admin123!` | Full user management, role promotion, audit, system stats |
| **Teacher 1** | `teacher1@quizpulse.com` | `Teacher123!` | Create quizzes, manage question bank, view cohort analytics, host live mode |
| **Teacher 2** | `teacher2@quizpulse.com` | `Teacher123!` | Full teacher studio capabilities |
| **Student 1** | `student1@quizpulse.com` | `Student123!` | Take quizzes, resume attempts, view results and certificates |
| **Student 2-5** | `student2@quizpulse.com` ... `student5@quizpulse.com` | `Student123!` | Student accounts |

> 💡 **Tip**: The login screen and landing page feature **1-Click Quick Demo Sign-In** buttons to immediately test any role without manual typing.

---

## 📚 API Reference (`/api/v1`)

| Method | Endpoint | Role | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Public | Register student or teacher |
| `POST` | `/api/v1/auth/login` | Public | Authenticate user, receive JWT access & refresh tokens |
| `POST` | `/api/v1/auth/refresh` | Public | Refresh expired access token |
| `GET` | `/api/v1/auth/me` | Authenticated | Retrieve profile of authenticated user |
| `GET` | `/api/v1/quizzes` | Authenticated | List published quizzes (students) or authored quizzes (teachers) |
| `GET` | `/api/v1/quizzes/:id` | Authenticated | Get quiz details (options sanitized; no `isCorrect` leakage) |
| `POST` | `/api/v1/quizzes` | Teacher/Admin | Create new quiz with scheduling, time limits, and access codes |
| `POST` | `/api/v1/attempts/start/:quizId` | Authenticated | Start/resume attempt with single-attempt lock |
| `GET` | `/api/v1/attempts/:id` | Authenticated | Resume attempt, calculate remaining time |
| `PATCH` | `/api/v1/attempts/:id/save-draft` | Authenticated | Auto-save current answers during the exam |
| `POST` | `/api/v1/attempts/:id/submit` | Authenticated | Strict server-side grading; compute pass/fail & return review |
| `POST` | `/api/v1/attempts/:id/proctor-event` | Authenticated | Log tab-switch / focus-loss events |
| `GET` | `/api/v1/attempts/:id/review` | Authenticated | Detailed score review with correct keys & explanations |
| `GET` | `/api/v1/analytics/quiz/:quizId` | Teacher/Admin | Score distribution chart data, pass rates, hardest questions |
| `GET` | `/api/v1/analytics/quiz/:quizId/export-csv` | Teacher/Admin | Download cohort results as CSV |
| `GET` | `/api/v1/analytics/platform` | Admin | Superuser platform-wide stats |
| `GET` | `/api/v1/users` | Admin | User directory and role promotion/demotion |
| `POST` | `/api/v1/live/create` | Teacher/Admin | Generate 6-digit Join Code for real-time live mode |
| `GET` | `/api/v1/live/session/:pin` | Public | Verify live PIN before joining lobby |

---

## 🧪 Testing

Run backend tests using Vitest:
```bash
cd server
npm test
```
The test suite covers:
- JWT login and invalid credentials rejection
- User registration
- Strict question sanitization (preventing `isCorrect` or explanation leakage)
- Access code protection
- Anti-cheating proctor event logging
- Full server-side grading and scoring verification
