const router = require('express').Router();
const ctrl = require('../controllers/categoryController');
const authMiddleware = require('../middleware/authMiddleware');
const { validate, createCategorySchema } = require('../middleware/validateRequest');

router.use(authMiddleware);

router.get('/',      ctrl.getAll);
router.post('/',     validate(createCategorySchema), ctrl.create);
router.patch('/:id', validate(createCategorySchema.partial()), ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
