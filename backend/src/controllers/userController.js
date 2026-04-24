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
    const result = await authService.login(req.body);
    success(res, result, 'Login successful');
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res) => {
  success(res, { user: req.user }, 'Profile retrieved');
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

    const user = await authService.updateUser(userId, updateData);
    success(res, { user }, 'Profile updated successfully');
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
    const result = await authService.telegramLogin(tgUser);
    success(res, result, 'Telegram login successful');
  } catch (err) {
    next(err);
  }
};

const deleteProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await authService.deleteUser(userId);
    success(res, null, 'Account deleted successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe, updateProfile, telegramLogin, deleteProfile };
