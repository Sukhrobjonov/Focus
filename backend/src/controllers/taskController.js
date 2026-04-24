const taskService = require('../services/taskService');
const { success, created } = require('../utils/response');
const prisma = require('../utils/prisma');

const getAllTasks = async (req, res, next) => {
  try {
    const tasks = await taskService.getAllTasks(req.user.id, req.query);
    success(res, { tasks });
  } catch (err) { 
    console.error('Safe Fail: Falling back to empty tasks array');
    success(res, { tasks: [] }); 
  }
};

const getTask = async (req, res, next) => {
  try {
    const task = await taskService.getTaskById(req.params.id, req.user.id);
    success(res, { task });
  } catch (err) { next(err); }
};

const createTask = async (req, res, next) => {
  try {
    const task = await taskService.createTask(req.user.id, req.body);
    
    // Increment the 24h task counter
    await prisma.user.update({
      where: { id: req.user.id },
      data: { taskCount24h: { increment: 1 } }
    });

    created(res, { task }, 'Task created');
  } catch (err) { next(err); }
};

const updateTask = async (req, res, next) => {
  try {
    const task = await taskService.updateTask(req.params.id, req.user.id, req.body);
    success(res, { task }, 'Task updated');
  } catch (err) { next(err); }
};

const deleteTask = async (req, res, next) => {
  try {
    await taskService.deleteTask(req.params.id, req.user.id);
    success(res, null, 'Task deleted');
  } catch (err) { next(err); }
};

const toggleTask = async (req, res, next) => {
  try {
    const task = await taskService.toggleTask(req.params.id, req.user.id);
    success(res, { task }, 'Task toggled');
  } catch (err) { next(err); }
};

const getStats = async (req, res, next) => {
  try {
    const stats = await taskService.getStats(req.user.id);
    success(res, { stats });
  } catch (err) { 
    console.error('Safe Fail: Falling back to zero stats');
    success(res, { stats: { total: 0, completed: 0, pending: 0, highPriority: 0, completionRate: 0 } });
  }
};

const getTrash = async (req, res, next) => {
  try {
    const trash = await taskService.getTrash(req.user.id);
    success(res, { trash });
  } catch (err) { next(err); }
};

const emptyTrash = async (req, res, next) => {
  try {
    await taskService.emptyTrash(req.user.id);
    success(res, null, 'Trashbox cleared');
  } catch (err) { next(err); }
};

const trashTask = async (req, res, next) => {
  try {
    const task = await taskService.trashTask(req.params.id, req.user.id);
    success(res, { task }, 'Task moved to trash');
  } catch (err) { next(err); }
};

module.exports = { getAllTasks, getTask, createTask, updateTask, deleteTask, toggleTask, getStats, getTrash, emptyTrash, trashTask };
