const router = require('express').Router();
const ctrl = require('../controllers/taskController');
const authMiddleware = require('../middleware/authMiddleware');
const { validate, createTaskSchema, updateTaskSchema } = require('../middleware/validateRequest');
const { taskRateLimit } = require('../middleware/rateLimit');

// All task routes require authentication
router.use(authMiddleware);

router.get('/',           ctrl.getAllTasks);
router.get('/stats',      ctrl.getStats);
router.get('/trash',      ctrl.getTrash);
router.delete('/trash/empty', ctrl.emptyTrash);
router.get('/:id',        ctrl.getTask);
router.post('/',          authMiddleware, taskRateLimit, validate(createTaskSchema), ctrl.createTask);
router.patch('/:id',      validate(updateTaskSchema), ctrl.updateTask);
router.patch('/:id/trash', ctrl.trashTask);
router.delete('/:id',     ctrl.deleteTask);
router.patch('/:id/toggle', ctrl.toggleTask);

module.exports = router;
