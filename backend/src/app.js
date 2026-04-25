require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const taskRoutes = require('./routes/taskRoutes');
const userRoutes = require('./routes/userRoutes');
const { errorHandler } = require('./middleware/errorHandler');
const { initTaskLifecycle } = require('./cron-jobs');

const app = express();

// Initialize Task Lifecycle Service
initTaskLifecycle();

// ── Default User Fallback ──────────────────────────────────
const prisma = require('./utils/prisma');
const bcrypt = require('bcryptjs');

const ensureDefaultUser = async () => {
  try {
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      const hashedPassword = await bcrypt.hash('Focus2026!', 12);
      await prisma.user.create({
        data: {
          name: 'Focus Admin',
          email: 'admin@focus.app',
          password: hashedPassword,
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin'
        }
      });
    }
  } catch (err) {
    console.error('⚠️ Could not create default user:', err.message);
  }
};
if (process.env.NODE_ENV !== 'production') {
  ensureDefaultUser();
}

// ── Security & Parsing ────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(','),
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Static Files ──────────────────────────────────────────
app.use('/uploads', (req, res, next) => { 
  res.set('Cross-Origin-Resource-Policy', 'cross-origin'); 
  next(); 
}, express.static(path.join(__dirname, '../uploads')));

// ── Logging ───────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// ── Health Check ──────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Routes ────────────────────────────────────────────────
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);

// ── 404 ───────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Global Error Handler ──────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  // Silent startup in production
  if (process.env.NODE_ENV !== 'production') {
    console.log(`🍎 Focus API running on http://0.0.0.0:${PORT}`);
  }
});

module.exports = app;
