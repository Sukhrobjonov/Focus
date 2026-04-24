# 🍎 Apple Bento To-Do — Production Blueprint

> **For AI Models**: This document is the single source of truth. Follow it precisely.
> Tech Stack: React (Vite) + Node.js (Express) + PostgreSQL (Prisma ORM)
> Design System: Apple Bento Card UI — Glassmorphism, SF Pro-inspired typography, fluid micro-animations

---

## 📁 Full Project Structure

```
ToDo/
├── INSTRUCTIONS.md                   ← This file (master guide)
│
├── backend/                          ← Node.js + Express API
│   ├── prisma/
│   │   ├── schema.prisma             ← Database models
│   │   └── seed.js                   ← Demo seed data
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── taskController.js     ← CRUD for tasks
│   │   │   ├── categoryController.js ← Category management
│   │   │   └── userController.js     ← Auth + user profile
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js     ← JWT verification
│   │   │   ├── errorHandler.js      ← Global error handler
│   │   │   └── validateRequest.js   ← Zod schema validation
│   │   ├── routes/
│   │   │   ├── taskRoutes.js
│   │   │   ├── categoryRoutes.js
│   │   │   └── userRoutes.js
│   │   ├── services/
│   │   │   ├── taskService.js        ← Business logic layer
│   │   │   ├── categoryService.js
│   │   │   └── authService.js
│   │   ├── utils/
│   │   │   ├── prisma.js             ← Prisma client singleton
│   │   │   ├── jwt.js                ← Token helpers
│   │   │   └── response.js           ← Standard API response
│   │   └── app.js                    ← Express app entry
│   ├── .env                          ← DATABASE_URL, JWT_SECRET, PORT
│   ├── .env.example
│   └── package.json
│
├── frontend/                         ← React + Vite app
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── assets/
│   │   │   └── icons/                ← SF Symbol-style SVG icons
│   │   ├── components/
│   │   │   ├── bento/
│   │   │   │   ├── BentoGrid.jsx     ← Responsive Bento layout container
│   │   │   │   ├── BentoCard.jsx     ← Base Apple-glass card component
│   │   │   │   ├── StatsCard.jsx     ← Completion stats card (1×1)
│   │   │   │   ├── ProgressCard.jsx  ← Daily progress ring card (2×1)
│   │   │   │   ├── QuickAddCard.jsx  ← Inline task creation card (2×1)
│   │   │   │   ├── TaskListCard.jsx  ← Scrollable task list card (2×2)
│   │   │   │   ├── CategoryCard.jsx  ← Category filter card (1×1)
│   │   │   │   └── StreakCard.jsx    ← Habit streak card (1×1)
│   │   │   ├── tasks/
│   │   │   │   ├── TaskItem.jsx      ← Individual task row
│   │   │   │   ├── TaskModal.jsx     ← Full task detail/edit modal
│   │   │   │   └── TaskPriorityBadge.jsx
│   │   │   ├── ui/
│   │   │   │   ├── Button.jsx        ← Apple-style button variants
│   │   │   │   ├── Input.jsx         ← Floating label input
│   │   │   │   ├── Modal.jsx         ← Spring-animated modal portal
│   │   │   │   ├── Checkbox.jsx      ← SF-style animated checkbox
│   │   │   │   ├── Select.jsx        ← Custom dropdown
│   │   │   │   ├── DatePicker.jsx    ← Native date with custom styling
│   │   │   │   ├── Toast.jsx         ← Apple notification toast
│   │   │   │   └── ThemeToggle.jsx   ← Light/Dark mode pill toggle
│   │   │   └── layout/
│   │   │       ├── Sidebar.jsx       ← Collapsible nav sidebar
│   │   │       ├── Header.jsx        ← Top bar with search + avatar
│   │   │       └── AppShell.jsx      ← Root layout wrapper
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx         ← Main Bento grid view
│   │   │   ├── Auth.jsx              ← Login / Register page
│   │   │   └── NotFound.jsx
│   │   ├── hooks/
│   │   │   ├── useTasks.js           ← React Query task hooks
│   │   │   ├── useCategories.js
│   │   │   ├── useAuth.js
│   │   │   └── useTheme.js
│   │   ├── store/
│   │   │   └── authStore.js          ← Zustand auth + user state
│   │   ├── api/
│   │   │   ├── client.js             ← Axios instance with interceptors
│   │   │   ├── tasks.js              ← Task API calls
│   │   │   ├── categories.js
│   │   │   └── auth.js
│   │   ├── styles/
│   │   │   ├── index.css             ← Root: CSS variables, resets
│   │   │   ├── bento.css             ← Bento grid + card styles
│   │   │   ├── animations.css        ← Spring/ease keyframes
│   │   │   └── themes.css            ← Light/Dark theme tokens
│   │   ├── utils/
│   │   │   ├── dateHelpers.js
│   │   │   └── priorityHelpers.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## 🗄️ Database Schema (Prisma)

### Models
- **User**: id, email, name, password (hashed), avatar, createdAt
- **Category**: id, name, color (hex), icon, userId, createdAt
- **Task**: id, title, description, completed, priority (LOW/MEDIUM/HIGH/URGENT), dueDate, userId, categoryId, createdAt, updatedAt
- **Subtask**: id, title, completed, taskId

---

## 🔌 API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get current user |

### Tasks
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/tasks` | List all tasks (filter by category, priority, status) |
| POST | `/api/tasks` | Create new task |
| GET | `/api/tasks/:id` | Get single task with subtasks |
| PATCH | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |
| PATCH | `/api/tasks/:id/toggle` | Toggle completion |

### Categories
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/categories` | List all categories |
| POST | `/api/categories` | Create category |
| PATCH | `/api/categories/:id` | Update category |
| DELETE | `/api/categories/:id` | Delete category |

---

## 🎨 Apple Design System

### Color Tokens
```css
/* Light Mode */
--bg-primary:       #F5F5F7;   /* Apple off-white */
--bg-card:          rgba(255, 255, 255, 0.72);  /* Glass card */
--text-primary:     #1D1D1F;   /* Apple near-black */
--text-secondary:   #6E6E73;   /* Apple gray */
--accent-blue:      #007AFF;   /* iOS blue */
--accent-green:     #34C759;   /* iOS green */
--accent-orange:    #FF9500;   /* iOS orange */
--accent-red:       #FF3B30;   /* iOS red */
--accent-purple:    #AF52DE;   /* iOS purple */
--border-glass:     rgba(255, 255, 255, 0.4);
--shadow-card:      0 4px 24px rgba(0, 0, 0, 0.08);

/* Dark Mode */
--bg-primary:       #000000;
--bg-card:          rgba(28, 28, 30, 0.8);
--text-primary:     #F5F5F7;
--text-secondary:   #98989D;
--border-glass:     rgba(255, 255, 255, 0.08);
--shadow-card:      0 4px 24px rgba(0, 0, 0, 0.4);
```

### Typography
- **Font**: `SF Pro Display` → fallback to `Inter` (Google Fonts)
- **Sizes**: 11px caption / 13px body / 15px subhead / 17px headline / 22px title / 34px large title

### Bento Grid
- CSS Grid: `repeat(4, 1fr)` columns on desktop
- Cards span: `1×1`, `2×1`, `1×2`, `2×2`
- Gap: `16px`
- Breakpoints: 4-col → 2-col (768px) → 1-col (480px)

### Card Anatomy
```
backdrop-filter: blur(20px) saturate(180%)
background: var(--bg-card)
border: 1px solid var(--border-glass)
border-radius: 20px
box-shadow: var(--shadow-card)
padding: 20px
transition: transform 200ms ease, box-shadow 200ms ease
hover: translateY(-2px), shadow deepens
```

### Animations
- **Checkbox tick**: SVG path draw animation, 200ms ease-out
- **Task completion**: Strikethrough + fade, 300ms
- **Card entrance**: staggered `fadeUp` 40ms delay per card
- **Modal**: scale(0.95)→scale(1) + opacity 0→1, 280ms spring
- **Toast**: slide-in from right, auto-dismiss 3s

---

## ⚙️ Environment Variables

### Backend `.env`
```
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/todo_db"
JWT_SECRET="your-256-bit-secret"
JWT_EXPIRES_IN="7d"
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

### Frontend `.env`
```
VITE_API_URL=http://localhost:3001/api
```

---

## 🚀 Implementation Steps (for AI Models)

### Step 1 — Foundation ✅
- [x] Create `INSTRUCTIONS.md`
- [x] Create full folder structure
- [x] Create `prisma/schema.prisma`

### Step 2 — Backend Core
- [ ] `backend/package.json` with all deps
- [ ] `backend/src/app.js` — Express + CORS + middleware
- [ ] `backend/src/utils/prisma.js` — singleton
- [ ] `backend/src/utils/jwt.js` — sign/verify helpers
- [ ] `backend/src/utils/response.js` — standard API format
- [ ] All controllers, routes, services
- [ ] Auth middleware (JWT)
- [ ] Zod validation middleware

### Step 3 — Frontend Foundation
- [ ] Vite + React setup with `package.json`
- [ ] `src/styles/` — full design system CSS
- [ ] Zustand auth store
- [ ] Axios client with JWT interceptor
- [ ] React Query setup

### Step 4 — Components
- [ ] All `ui/` components
- [ ] All `bento/` cards
- [ ] `layout/` components (Sidebar, Header, AppShell)
- [ ] Task components (TaskItem, TaskModal)

### Step 5 — Pages
- [ ] `Auth.jsx` — Login/Register with glass card
- [ ] `Dashboard.jsx` — Full Bento grid
- [ ] `NotFound.jsx`

### Step 6 — Polish
- [ ] Seed data (`prisma/seed.js`)
- [ ] README with setup instructions
- [ ] `.gitignore`

---

## 📦 Key Dependencies

### Backend
```json
{
  "express": "^4.18",
  "prisma": "^5.x",
  "@prisma/client": "^5.x",
  "bcryptjs": "^2.4",
  "jsonwebtoken": "^9.x",
  "zod": "^3.x",
  "cors": "^2.x",
  "dotenv": "^16.x",
  "helmet": "^7.x",
  "morgan": "^1.x"
}
```

### Frontend
```json
{
  "react": "^18.x",
  "react-dom": "^18.x",
  "react-router-dom": "^6.x",
  "@tanstack/react-query": "^5.x",
  "zustand": "^4.x",
  "axios": "^1.x",
  "framer-motion": "^11.x",
  "date-fns": "^3.x"
}
```

---

> **Apple Philosophy**: Every interaction should feel inevitable. No unnecessary elements. Space is a design decision. Motion has purpose.
