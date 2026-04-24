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
      .update(process.env.TELEGRAM_BOT_TOKEN)
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

    // 1. Support Telegram TWA Auth
    if (telegramInitData) {
      if (!validateTelegramInitData(telegramInitData)) {
        return unauthorized(res, 'Invalid Telegram session');
      }
      
      const urlParams = new URLSearchParams(telegramInitData);
      const tgUser = JSON.parse(urlParams.get('user'));
      
      if (tgUser && tgUser.id) {
        let user = await prisma.user.findUnique({
          where: { telegramId: String(tgUser.id) },
          select: { id: true, telegramId: true, email: true, name: true, avatar: true, password: true, taskCount24h: true, lastTaskReset: true },
        });

        if (!user) {
          // Auto-register Telegram user
          user = await prisma.user.create({
            data: {
              telegramId: String(tgUser.id),
              name: `${tgUser.first_name} ${tgUser.last_name || ''}`.trim(),
              avatar: tgUser.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${tgUser.id}`,
              // Generate a dummy email for unique constraint if needed, 
              // but we made it optional in schema
            },
            select: { id: true, telegramId: true, email: true, name: true, avatar: true, password: true, taskCount24h: true, lastTaskReset: true },
          });
        }

        req.user = user;
        return next(); // Successfully authenticated via Telegram
      }
    }

    // 2. Standard JWT Auth
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorized(res, 'No token provided');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, telegramId: true, email: true, name: true, avatar: true, password: true, taskCount24h: true, lastTaskReset: true },
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
