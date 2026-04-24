const { verifyToken } = require('../utils/jwt');
const { unauthorized } = require('../utils/response');
const prisma = require('../utils/prisma');
const crypto = require('crypto');

/**
 * Validates Telegram Web App initData
 * @param {string} initData - The raw initData string from Telegram
 */
const validateTelegramInitData = (initData) => {
  if (!initData || !process.env.TELEGRAM_BOT_TOKEN) return false;

  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get('hash');
  urlParams.delete('hash');
  
  const dataCheckString = Array.from(urlParams.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(process.env.TELEGRAM_BOT_TOKEN).digest();
  const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  return calculatedHash === hash;
};

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const telegramInitData = req.headers['x-telegram-init-data'];

    // 1. Support Telegram TWA Auth
    if (telegramInitData) {
      if (!validateTelegramInitData(telegramInitData)) {
        return unauthorized(res, 'Invalid Telegram session');
      }
      // In a real TWA, we'd extract the user from initData and find/create them in DB
      // For now, we'll continue to JWT if provided, or handle TWA user mapping here
    }

    // 2. Standard JWT Auth
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorized(res, 'No token provided');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, name: true, avatar: true, taskCount24h: true, lastTaskReset: true },
    });

    if (!user) return unauthorized(res, 'User no longer exists');

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return unauthorized(res, 'Token expired — please log in again');
    }
    return unauthorized(res, 'Invalid token');
  }
};

module.exports = authMiddleware;
