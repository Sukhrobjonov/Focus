const prisma = require('../utils/prisma');

const getAll = async (userId) => {
  return prisma.category.findMany({
    where: { userId },
    include: { _count: { select: { tasks: true } } },
    orderBy: { createdAt: 'asc' },
  });
};

const create = async (userId, data) => {
  return prisma.category.create({
    data: { ...data, userId },
    include: { _count: { select: { tasks: true } } },
  });
};

const update = async (id, userId, data) => {
  const cat = await prisma.category.findFirst({ where: { id, userId } });
  if (!cat) {
    const err = new Error('Category not found');
    err.statusCode = 404;
    throw err;
  }
  return prisma.category.update({
    where: { id },
    data,
    include: { _count: { select: { tasks: true } } },
  });
};

const remove = async (id, userId) => {
  const cat = await prisma.category.findFirst({ where: { id, userId } });
  if (!cat) {
    const err = new Error('Category not found');
    err.statusCode = 404;
    throw err;
  }
  return prisma.category.delete({ where: { id } });
};

module.exports = { getAll, create, update, remove };
