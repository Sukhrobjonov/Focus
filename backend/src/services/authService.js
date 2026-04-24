const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma');
const { signToken } = require('../utils/jwt');

const register = async ({ name, email, password }) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const err = new Error('Email already registered');
    err.statusCode = 409;
    throw err;
  }

  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, password: hashed },
    select: { id: true, name: true, email: true, avatar: true, createdAt: true },
  });

  const token = signToken({ id: user.id, email: user.email });
  return { user, token };
};

const login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
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

  const { password: _, ...safeUser } = user;
  const token = signToken({ id: user.id, email: user.email });
  return { user: safeUser, token };
};

const updateUser = async (id, data) => {
  return await prisma.user.update({
    where: { id },
    data,
    select: { id: true, name: true, email: true, avatar: true, updatedAt: true }
  });
};

module.exports = { register, login, updateUser };
