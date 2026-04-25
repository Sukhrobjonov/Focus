const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma');
const { signToken } = require('../utils/jwt');
const { sendVerificationEmail } = require('./mailService');

const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

const register = async ({ name, email, password }) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const err = new Error('Email already registered');
    err.statusCode = 409;
    throw err;
  }

  const hashed = await bcrypt.hash(password, 12);
  const code = generateCode();
  const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
  console.log('📧 Verification Code for', email, 'is:', code, '(Expires at:', expires, ')');
  
  const user = await prisma.user.create({
    data: { 
      name, 
      email, 
      password: hashed, 
      verificationCode: code,
      verificationCodeExpires: expires
    },
    select: { id: true, telegramId: true, name: true, email: true, avatar: true, isPremium: true, createdAt: true },
  });

  try {
    await sendVerificationEmail(email, code);
  } catch (err) {
    console.error('Failed to send verification email:', err.message);
  }

  return { user }; // No token until verified
};

const verifyEmail = async ({ email, code }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  if (user.verificationCode !== code) {
    const err = new Error('Invalid verification code');
    err.statusCode = 400;
    throw err;
  }

  if (user.verificationCodeExpires && new Date() > user.verificationCodeExpires) {
    const err = new Error('Verification code has expired. Please request a new one.');
    err.statusCode = 400;
    throw err;
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { 
      isVerified: true, 
      verificationCode: null, 
      verificationCodeExpires: null 
    },
    select: { id: true, telegramId: true, name: true, email: true, avatar: true, password: true, isVerified: true, isPremium: true, taskCount24h: true, lastTaskReset: true, createdAt: true },
  });

  const token = signToken({ id: updatedUser.id, email: updatedUser.email });
  return { user: updatedUser, token };
};

const resendCode = async (email) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('User not found');
  
  const code = generateCode();
  const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
  console.log('📧 Resent Verification Code for', email, 'is:', code, '(Expires at:', expires, ')');
  
  await prisma.user.update({
    where: { id: user.id },
    data: { 
      verificationCode: code,
      verificationCodeExpires: expires
    }
  });

  try {
    await sendVerificationEmail(email, code);
  } catch (err) {
    console.error('Failed to resend verification email:', err.message);
  }
  
  return { success: true };
};

const login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  if (!user.password) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  if (!user.isVerified && !user.telegramId) {
    const err = new Error('Email not verified. Please verify your email first.');
    err.statusCode = 403;
    throw err;
  }

  const token = signToken({ id: user.id, email: user.email });
  return { user, token };
};

const updateUser = async (userId, data) => {
  const { name, email, avatar, password } = data;
  const currentUser = await prisma.user.findUnique({ where: { id: userId } });
  
  let updateData = { name, avatar };
  if (password) updateData.password = password; // Hashed password from controller

  let verificationNeeded = false;

  if (email && email !== currentUser.email) {
    const code = generateCode();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
    
    updateData.email = email;
    updateData.isVerified = false;
    updateData.verificationCode = code;
    updateData.verificationCodeExpires = expires;
    verificationNeeded = true;

    console.log('📧 New Verification Code for', email, 'is:', code);
    
    try {
      await sendVerificationEmail(email, code);
    } catch (err) {
      console.error('Failed to send verification email:', err.message);
    }
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  return { user, verificationNeeded };
};

const telegramLogin = async (tgUser) => {
  let user = await prisma.user.findUnique({
    where: { telegramId: String(tgUser.id) },
    select: { id: true, telegramId: true, name: true, email: true, avatar: true, password: true, isVerified: true, isPremium: true, taskCount24h: true, lastTaskReset: true, createdAt: true },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        telegramId: String(tgUser.id),
        name: `${tgUser.first_name} ${tgUser.last_name || ''}`.trim(),
        avatar: tgUser.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${tgUser.id}`,
        isVerified: true, // Telegram users are verified by default
      },
      select: { id: true, telegramId: true, name: true, email: true, avatar: true, password: true, isVerified: true, isPremium: true, taskCount24h: true, lastTaskReset: true, createdAt: true },
    });
  }

  const token = signToken({ id: user.id, email: user.email });
  return { user, token };
};

const requestDeletionCode = async ({ email, password, userId }) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  // If not a telegram user, verify password
  if (!user.telegramId) {
    if (!email || !password) throw new Error('Email and password are required for deletion');
    if (user.email !== email) throw new Error('Invalid email');
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error('Invalid password');
  }

  if (user.email) {
    const code = generateCode();
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        deletionCode: code,
        deletionCodeExpires: expires
      }
    });

    console.log('🗑️ Deletion Code for', user.email, 'is:', code, '(Expires at:', expires, ')');
    
    try {
      await sendVerificationEmail(user.email, code, 'DELETE'); 
    } catch (err) {
      console.error('Failed to send deletion email:', err.message);
    }
  } else {
    console.log('🗑️ Deletion requested for Telegram user', user.telegramId, '(No email, will require "DELETE" confirmation)');
  }
  
  return { success: true, hasEmail: !!user.email };
};

const confirmDeletion = async (userId, code) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  if (user.email) {
    if (user.deletionCode !== code) {
      const err = new Error('Invalid deletion code');
      err.statusCode = 400;
      throw err;
    }

    if (user.deletionCodeExpires && new Date() > user.deletionCodeExpires) {
      const err = new Error('Deletion code has expired. Please request a new one.');
      err.statusCode = 400;
      throw err;
    }
  } else if (user.password) {
    // If no email but has password, "code" is actually the password
    const isMatch = await bcrypt.compare(code, user.password);
    if (!isMatch) {
      const err = new Error('Incorrect password');
      err.statusCode = 400;
      throw err;
    }
  } else {
    // Telegram user with no email/password must type "DELETE"
    if (code !== 'DELETE') {
      const err = new Error('Please type "DELETE" to confirm');
      err.statusCode = 400;
      throw err;
    }
  }

  await prisma.user.delete({ where: { id: userId } });
  return { success: true };
};

const requestPasswordReset = async (email) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('No user found with this email address');
  if (user.telegramId && !user.password) throw new Error('This account is linked to Telegram. Please log in via Telegram.');

  const code = generateCode();
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  
  await prisma.user.update({
    where: { id: user.id },
    data: { 
      resetPasswordCode: code,
      resetPasswordExpires: expires
    }
  });

  console.log('🔑 Password Reset Code for', email, 'is:', code, '(Expires at:', expires, ')');
  
  try {
    await sendVerificationEmail(email, code, 'RESET');
  } catch (err) {
    console.error('Failed to send reset email:', err.message);
  }
  
  return { success: true };
};

const resetPassword = async ({ email, code, newPassword }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('User not found');

  if (user.resetPasswordCode !== code) {
    const err = new Error('Invalid reset code');
    err.statusCode = 400;
    throw err;
  }

  if (user.resetPasswordExpires && new Date() > user.resetPasswordExpires) {
    const err = new Error('Reset code has expired. Please request a new one.');
    err.statusCode = 400;
    throw err;
  }

  const hashed = await bcrypt.hash(newPassword, 12);
  
  await prisma.user.update({
    where: { id: user.id },
    data: { 
      password: hashed,
      resetPasswordCode: null,
      resetPasswordExpires: null
    }
  });

  return { success: true };
};

module.exports = { 
  register, 
  login, 
  updateUser, 
  telegramLogin, 
  verifyEmail, 
  resendCode,
  requestDeletionCode,
  confirmDeletion,
  requestPasswordReset,
  resetPassword
};
