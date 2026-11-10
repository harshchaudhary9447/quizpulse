# 🚀 QuizPulse — Complete Vercel & Neon PostgreSQL Deployment Guide

QuizPulse has been converted into a **full-stack Next.js 14 App Router application** inside `/client`. This allows you to host **both the Frontend and Backend on Vercel with a single 1-click deployment**, directly connected to your **Neon Cloud PostgreSQL database**.

---

## 🏛️ System Architecture

```
┌────────────────────────────────────────────────────────┐
│                      VERCEL                            │
│           (Unified Full-Stack Deployment)              │
│                                                        │
│  ┌────────────────────────┐  ┌──────────────────────┐  │
│  │   Next.js 14 Frontend  │  │ Next.js API Routes   │  │
│  │   (React, Tailwind,    │──│ (/api/quizzes, /auth,│  │
│  │    Live Kahoot-Arena)  │  │  /attempts, /live)   │  │
│  └────────────────────────┘  └──────────────────────┘  │
└───────────────────────────┬────────────────────────────┘
                            │
               Direct Prisma Connection (SSL)
                            ▼
┌────────────────────────────────────────────────────────┐
│                   NEON CLOUD POSTGRESQL                │
│             (Tables, Relations & Seed Data)            │
└────────────────────────────────────────────────────────┘
```

---

## ⚡ Step-by-Step Vercel Deployment

### Step 1: Push Your Code to GitHub

Open terminal in the project root (`Quiz System`):

```bash
# Initialize git if not already initialized
git init

# Stage all files
git add .

# Commit changes
git commit -m "feat: complete next.js full-stack migration for vercel deployment"

# Link to your GitHub repository and push
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo-name>.git
git push -u origin main
```

---

### Step 2: Import Project into Vercel

1. Go to **[https://vercel.com](https://vercel.com)** and sign in with GitHub.
2. Click **Add New…** > **Project**.
3. Select your GitHub repository and click **Import**.

---

### Step 3: Configure Project Settings on Vercel

Before clicking "Deploy", configure these settings:

1. **Root Directory**:
   - Click **Edit** next to **Root Directory**.
   - Select **`client`** and click **Continue**.

2. **Framework Preset**:
   - Vercel will automatically detect **Next.js**.

3. **Environment Variables**:
   Add the following environment variables under **Environment Variables**:

   | Name | Value | Description |
   | :--- | :--- | :--- |
   | `DATABASE_URL` | `postgresql://neondb_owner:npg_C8LhOF3ModSg@ep-quiet-field-bd9571iy-pooler.c-8.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require` | Your Neon Cloud PostgreSQL Database |
   | `JWT_ACCESS_SECRET` | `quizpulse_super_secret_access_key_2026_jwt` | Access Token Secret |
   | `JWT_REFRESH_SECRET` | `quizpulse_super_secret_refresh_key_2026_jwt` | Refresh Token Secret |
   | `JWT_ACCESS_EXPIRY` | `15m` | Token Expiry |
   | `JWT_REFRESH_EXPIRY` | `7d` | Refresh Expiry |
   | `NEXT_PUBLIC_API_URL` | `/api` | Same-origin API routes |

4. Click **Deploy**.

---

### Step 4: Verification & Live Link

Vercel will run `prisma generate` and `next build` automatically. Once finished (typically 45–60 seconds), Vercel will provide your live URL:

```
https://<your-project-name>.vercel.app
```

---

## 🔑 Default Seed Accounts on Your Neon Database

Your Neon PostgreSQL database is already seeded and ready with these verified credentials:

| Role | Email | Password | Dashboard URL |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@quizpulse.com` | `Admin123!` | `/admin/platform` |
| **Teacher 1** | `teacher1@quizpulse.com` | `Teacher123!` | `/teacher/quizzes` |
| **Teacher 2** | `teacher2@quizpulse.com` | `Teacher123!` | `/teacher/quizzes` |
| **Student 1** | `student1@quizpulse.com` | `Student123!` | `/quizzes` |
| **Student 2** | `student2@quizpulse.com` | `Student123!` | `/quizzes` |

---

## 🎮 Features Ready on Vercel

1. **Full-Stack on Single Host**: No separate backend hosting needed — frontend and API run together on Vercel.
2. **Neon Cloud PostgreSQL**: Prisma connects securely via connection pooling with SSL.
3. **Live Arena**: Real-time multiplayer Kahoot-style quiz arena with Server-Sent Events (SSE) that work seamlessly on Vercel serverless architecture without requiring a dedicated WebSocket server.
4. **Anti-Cheating Proctoring**: Automatic tab-switch and window-blur violation tracking saved to Neon DB.
5. **PDF & Certificate Generation**: Instant award certificate modal with confetti on exam completion.
