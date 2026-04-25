const prisma = require('../utils/prisma');
const { tooManyRequests } = require('../utils/response');

/**
 * Task Creation Rate Limiter
 * Enforces a strict limit of 30 new tasks per 24-hour window.
 */
const taskRateLimit = async (req, res, next) => {
  const user = req.user;
  const now = new Date();
  const resetInterval = 24 * 60 * 60 * 1000; // 24 hours in ms

  try {
    // Check if we need to reset the 24h counter
    const lastReset = new Date(user.lastTaskReset);
    if (now.getTime() - lastReset.getTime() > resetInterval) {
      // Reset counter
      await prisma.user.update({
        where: { id: user.id },
        data: {
          taskCount24h: 0,
          lastTaskReset: now
        }
      });
      // Update local request user for immediate use
      req.user.taskCount24h = 0;
    }

    // Check limit (30 tasks per 24h)
    if (req.user.taskCount24h >= 30) {
      return tooManyRequests(res, 'Daily task limit reached (30 tasks/day)');
    }

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { taskRateLimit };
