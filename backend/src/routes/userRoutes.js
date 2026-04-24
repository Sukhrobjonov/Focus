const router = require('express').Router();
const { register, login, getMe, updateProfile } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const uploadAvatar = require('../middleware/uploadMiddleware');
const { validate, registerSchema, loginSchema } = require('../middleware/validateRequest');

router.post('/register', validate(registerSchema), register);
router.post('/login',    validate(loginSchema),    login);
router.get('/me',        authMiddleware,            getMe);
router.patch('/profile', authMiddleware, uploadAvatar.single('avatar'), updateProfile);

module.exports = router;
