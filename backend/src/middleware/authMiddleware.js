const { verifyToken } = require('../utils/jwt');
const { unauthorized } = require('../utils/response');
const prisma = require('../utils/prisma');
const crypto = require('crypto');

/**
 * Validates Telegram Web App initData
 * @param {string} initData - The raw initData string from Telegram
 */
const validateTelegramInitData = (initData) => {
  const token = process.env.TELEGRAM_TOKEN || process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
  if (!initData || !token) return false;

  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    if (!hash) return false;

    // Create a list of keys and sort them alphabetically
    const keys = Array.from(urlParams.keys())
      .filter(key => key !== 'hash')
      .sort();

    // Construct the data-check-string by joining key=value pairs with newlines
    // URLSearchParams.get() automatically decodes values
    const dataCheckString = keys
      .map(key => `${key}=${urlParams.get(key)}`)
      .join('\n');

    const secretKey = crypto.createHmac('sha256', 'WebAppData')
      .update(token)
      .digest();
      
    const calculatedHash = crypto.createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    return calculatedHash === hash;
  } catch (err) {
    console.error('Telegram validation error:', err);
    return false;
  }
};

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const telegramInitData = req.headers['x-telegram-init-data'];

    // 1. Try Standard JWT Auth First (Highest Priority)
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = verifyToken(token);
        const user = await prisma.user.findUnique({
          where: { id: decoded.id },
          select: { id: true, telegramId: true, email: true, name: true, avatar: true, password: true, isVerified: true, isPremium: true, taskCount24h: true, lastTaskReset: true },
        });

        if (user) {
          req.user = user;
          return next();
        }
      } catch (jwtErr) {
        // If JWT fails but we have Telegram data, let it fall through to Telegram auth
        if (!telegramInitData) {
          if (jwtErr.name === 'TokenExpiredError') {
            return unauthorized(res, 'Token expired — please log in again');
          }
          return unauthorized(res, 'Invalid token');
        }
      }
    }

    // 2. Support Telegram TWA Auth (Second Priority)
    if (telegramInitData) {
      if (!validateTelegramInitData(telegramInitData)) {
        return unauthorized(res, 'Invalid Telegram session');
      }
      
      const urlParams = new URLSearchParams(telegramInitData);
      const tgUserRaw = urlParams.get('user');
      if (!tgUserRaw) return unauthorized(res, 'Telegram user data missing');
      
      const tgUser = JSON.parse(tgUserRaw);
      
      if (tgUser && tgUser.id) {
        let user = await prisma.user.findUnique({
          where: { telegramId: String(tgUser.id) },
          select: { id: true, telegramId: true, email: true, name: true, avatar: true, password: true, isVerified: true, isPremium: true, taskCount24h: true, lastTaskReset: true },
        });

        if (!user) {
          // Auto-register Telegram user
          user = await prisma.user.create({
            data: {
              telegramId: String(tgUser.id),
              name: `${tgUser.first_name} ${tgUser.last_name || ''}`.trim(),
              avatar: tgUser.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${tgUser.id}`,
              isVerified: true,
            },
            select: { id: true, telegramId: true, email: true, name: true, avatar: true, password: true, isVerified: true, isPremium: true, taskCount24h: true, lastTaskReset: true },
          });
        }

        req.user = user;
        return next();
      }
    }

    return unauthorized(res, 'Authentication required');
  } catch (err) {
    console.error('Auth Middleware Error:', err);
    return unauthorized(res, 'Authentication failed');
  }
};

module.exports = authMiddleware;
