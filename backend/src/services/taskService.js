const prisma = require('../utils/prisma');

const TASK_SELECT = {
  id: true,
  title: true,
  description: true,
  priority: true,
  isCompleted: true,
  completedAt: true,
  isDeleted: true,
  deletedAt: true,
  pinned: true,
  createdAt: true,
  updatedAt: true,
};

const getAllTasks = async (userId, filters = {}) => {
  const { isCompleted, priority, search, pinned, isDeleted = 'false' } = filters;
  const where = { userId };

  // Filter by Trashbox status
  where.isDeleted = isDeleted === 'true';

  if (isCompleted !== undefined) where.isCompleted = isCompleted === 'true';
  if (priority)    where.priority    = priority;
  if (pinned !== undefined) where.pinned = pinned === 'true';
  
  if (search) {
    where.OR = [
      { title:       { contains: search } },
      { description: { contains: search } },
    ];
  }

  return prisma.task.findMany({
    where,
    select: TASK_SELECT,
    orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
  });
};

const getTaskById = async (id, userId) => {
  const task = await prisma.task.findFirst({
    where: { id, userId },
    select: TASK_SELECT,
  });
  if (!task) {
    const err = new Error('Task not found');
    err.statusCode = 404;
    throw err;
  }
  return task;
};

const createTask = async (userId, data) => {
  return prisma.task.create({
    data: { ...data, userId },
    select: TASK_SELECT,
  });
};

const updateTask = async (id, userId, data) => {
  await getTaskById(id, userId);
  return prisma.task.update({
    where: { id },
    data: { ...data, updatedAt: new Date() },
    select: TASK_SELECT,
  });
};

const deleteTask = async (id, userId) => {
  await getTaskById(id, userId);
  // Permanent delete from DB
  return prisma.task.delete({ where: { id } });
};

const toggleTask = async (id, userId) => {
  const task = await getTaskById(id, userId);
  const nextState = !task.isCompleted;
  
  return prisma.task.update({
    where: { id },
    data: {
      isCompleted: nextState,
      completedAt: nextState ? new Date() : null,
      // If uncompleting, pull back from potential trash movement
      isDeleted: false,
      deletedAt: null
    },
    select: TASK_SELECT,
  });
};

const getStats = async (userId) => {
  const [total, completed, pending, highPriority] = await Promise.all([
    prisma.task.count({ where: { userId, isDeleted: false } }),
    prisma.task.count({ where: { userId, isCompleted: true, isDeleted: false } }),
    prisma.task.count({ where: { userId, isCompleted: false, isDeleted: false } }),
    prisma.task.count({ where: { userId, priority: { in: ['HIGH', 'URGENT'] }, isCompleted: false, isDeleted: false } }),
  ]);

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { total, completed, pending, highPriority, completionRate };
};

const getTrash = async (userId) => {
  return prisma.task.findMany({
    where: { userId, isDeleted: true },
    select: TASK_SELECT,
    orderBy: { deletedAt: 'desc' },
  });
};

const emptyTrash = async (userId) => {
  return prisma.task.deleteMany({
    where: { userId, isDeleted: true },
  });
};

const trashTask = async (id, userId) => {
  return prisma.task.update({
    where: { id, userId },
    data: {
      isDeleted: true,
      deletedAt: new Date()
    },
    select: TASK_SELECT
  });
};

module.exports = { getAllTasks, getTaskById, createTask, updateTask, deleteTask, toggleTask, getStats, getTrash, emptyTrash, trashTask };
