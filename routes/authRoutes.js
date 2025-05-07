import express from 'express';
const router = express.Router();
import { loginUser, registerUser, getProfile } from '../controllers/authController.js';
import { protect, allowRoles } from '../middlewares/authMiddleware.js';

router.post('/login', loginUser);
router.post('/register', protect, allowRoles('admin', 'coordinator'), registerUser);
router.get('/me', protect, getProfile);

export default router;
