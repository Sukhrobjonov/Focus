const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Sign a JWT for the given payload
 * @param {object} payload  - data to embed (e.g. { id, email })
 * @returns {string} token
 */
const signToken = (payload) => {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
};

/**
 * Verify and decode a JWT
 * @param {string} token
 * @returns {object} decoded payload
 * @throws JsonWebTokenError | TokenExpiredError
 */
const verifyToken = (token) => {
  return jwt.verify(token, SECRET);
};

module.exports = { signToken, verifyToken };
