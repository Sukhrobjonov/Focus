# 🍎 Apple Bento To-Do

A production-ready, high-aesthetic To-Do application inspired by Apple's Bento Card design language.

## ✨ Features
- **Bento Grid UI**: Dynamic, responsive card-based layout.
- **Glassmorphism**: Apple-style blur, saturation, and translucency.
- **Micro-animations**: Smooth spring-based transitions and stagger entries.
- **Full-Stack**: React (Vite), Node.js (Express), and PostgreSQL (Prisma).
- **JWT Auth**: Secure login/registration with persistent sessions.

## 🚀 Setup Instructions

### 1. Prerequisites
- Node.js (v18+)
- PostgreSQL database running

### 2. Backend Setup
1. `cd backend`
2. `npm install`
3. Update `.env` with your `DATABASE_URL`.
4. `npx prisma migrate dev --name init`
5. `npm run db:seed` (Optional: seed demo data)
6. `npm run dev`

### 3. Frontend Setup
1. `cd frontend`
2. `npm install`
3. `npm run dev`

### 4. Demo Login
- **Email**: `demo@appletodo.com`
- **Password**: `Demo1234!`

## 📁 Project Structure
- `/backend`: Express API, Prisma ORM, JWT Auth.
- `/frontend`: React, Vite, Zustand, React Query, Vanilla CSS Design System.

## 🎨 Design Philosophy
- **Space is Luxury**: Generous padding and gaps.
- **Hierarchy through Contrast**: Bold titles, subtle secondary text.
- **Tactile Feedback**: Interactive elements scale and shift on hover/click.
