const router = require('express').Router();
const { register, login, getMe, updateProfile, telegramLogin, requestDeletion, confirmDeletion, verifyEmail, resendCode, requestResetPassword, performPasswordReset } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const uploadAvatar = require('../middleware/uploadMiddleware');
const { validate, registerSchema, loginSchema } = require('../middleware/validateRequest');

router.post('/register', validate(registerSchema), register);
router.post('/login',    validate(loginSchema),    login);
router.post('/verify',   verifyEmail);
router.post('/resend-code', resendCode);
router.post('/telegram', telegramLogin);
router.post('/request-reset', requestResetPassword);
router.post('/perform-reset', performPasswordReset);
router.get('/me',        authMiddleware,            getMe);
router.patch('/profile', authMiddleware, uploadAvatar.single('avatar'), updateProfile);
router.post('/request-deletion', authMiddleware, requestDeletion);
router.post('/confirm-deletion', authMiddleware, confirmDeletion);

module.exports = router;
