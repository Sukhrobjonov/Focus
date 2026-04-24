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
    const { name, avatar } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    
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

module.exports = { register, login, getMe, updateProfile };
