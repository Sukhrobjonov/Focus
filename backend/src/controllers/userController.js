const authService = require('../services/authService');
const { success, created } = require('../utils/response');
const fs = require('fs');
const path = require('path');

const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    created(res, result, 'Account created successfully');
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { user, token } = await authService.login(req.body);
    const { password, ...safeUser } = user;
    success(res, { user: { ...safeUser, hasPassword: !!password }, token }, 'Login successful');
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res) => {
  const { password, ...user } = req.user;
  success(res, { user: { ...user, hasPassword: !!password } }, 'Profile retrieved');
};

const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, avatar, email, password, currentPassword } = req.body;
    const updateData = {};

    if (name) {
      if (name.trim().length < 2 || name.trim().length > 50) {
        return res.status(400).json({ success: false, message: 'Name must be between 2 and 50 characters' });
      }
      updateData.name = name.trim();
    }
    if (email) updateData.email = email;

    if (password) {
      // 1. Minimum length
      if (password.length < 8) {
        return res.status(400).json({ success: false, message: 'New password must be at least 8 characters' });
      }
      // 2. Complexity
      const hasUpper = /[A-Z]/.test(password);
      const hasLower = /[a-z]/.test(password);
      const hasDigit = /[0-9]/.test(password);
      
      if (!hasUpper || !hasLower || !hasDigit) {
        return res.status(400).json({ success: false, message: 'Password must contain uppercase, lowercase and number' });
      }

      // If user has a password, they MUST provide currentPassword
      if (req.user.password) {
        if (!currentPassword) {
          return res.status(400).json({ success: false, message: 'Current password is required to set a new one' });
        }
        const bcrypt = require('bcryptjs');
        const isMatch = await bcrypt.compare(currentPassword, req.user.password);
        if (!isMatch) {
          return res.status(401).json({ success: false, message: 'Incorrect current password' });
        }
      }
      
      const bcrypt = require('bcryptjs');
      updateData.password = await bcrypt.hash(password, 12);
    }
    
    // Handle Avatar Logic (New Upload or Deletion)
    if (req.file || avatar === '' || avatar === null) {
      // 1. Delete old file if it exists and is local
      if (req.user.avatar && !req.user.avatar.startsWith('http')) {
        const oldPath = path.join(__dirname, '../../uploads/avatars', req.user.avatar);
        try {
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
        } catch (err) {
          console.error('Failed to delete old avatar:', err.message);
        }
      }

      // 2. Set new state
      if (req.file) {
        updateData.avatar = req.file.filename;
      } else {
        updateData.avatar = null; // Clear from DB
      }
    }

    const { user: updatedUser, verificationNeeded } = await authService.updateUser(userId, updateData);
    const { password: _, ...safeUser } = updatedUser;
    success(res, { user: { ...safeUser, hasPassword: !!updatedUser.password }, verificationNeeded }, 'Profile updated successfully');
  } catch (err) {
    next(err);
  }
};

const telegramLogin = async (req, res, next) => {
  try {
    const { tgUser } = req.body;
    if (!tgUser) {
      return res.status(400).json({ success: false, message: 'Telegram user data missing' });
    }
    const { user, token } = await authService.telegramLogin(tgUser);
    const { password, ...safeUser } = user;
    success(res, { user: { ...safeUser, hasPassword: !!password }, token }, 'Telegram login successful');
  } catch (err) {
    next(err);
  }
};

const requestDeletion = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { email, password } = req.body;
    const result = await authService.requestDeletionCode({ email, password, userId });
    success(res, result, 'Deletion code sent to your email');
  } catch (err) {
    next(err);
  }
};

const confirmDeletion = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { code } = req.body;
    const result = await authService.confirmDeletion(userId, code);
    success(res, result, 'Account deleted successfully');
  } catch (err) {
    next(err);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const { user } = await authService.verifyEmail(req.body);
    const { password, ...safeUser } = user;
    success(res, { user: { ...safeUser, hasPassword: !!password } }, 'Email verified successfully');
  } catch (err) {
    next(err);
  }
};

const resendCode = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await authService.resendCode(email);
    success(res, result, 'Verification code resent');
  } catch (err) {
    next(err);
  }
};

const requestResetPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await authService.requestPasswordReset(email);
    success(res, result, 'Reset code sent to your email');
  } catch (err) {
    next(err);
  }
};

const performPasswordReset = async (req, res, next) => {
  try {
    const result = await authService.resetPassword(req.body);
    success(res, result, 'Password has been reset successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { 
  register, 
  login, 
  getMe, 
  updateProfile, 
  telegramLogin, 
  requestDeletion, 
  confirmDeletion, 
  verifyEmail, 
  resendCode,
  requestResetPassword,
  performPasswordReset
};
