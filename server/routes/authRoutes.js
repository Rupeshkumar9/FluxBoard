import express from 'express';
import { register, login, getMe, refreshToken } from '../controllers/authController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', auth, getMe);
router.post('/refresh', refreshToken);

export default router;
