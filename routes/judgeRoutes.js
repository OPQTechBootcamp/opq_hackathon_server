// routes/judgeRoutes.js
import express from 'express';
import { 
  registerJudge, 
  updateJudgeStatus, 
  getAllJudges, 
  getJudgeById 
} from '../controllers/judgeController.js';
import { protect, allowRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Judge registration - public route
router.post('/register', registerJudge);

// Judge status update - admin only
router.put('/status', protect, allowRoles("admin"), updateJudgeStatus);

// Get all judges - admin and coordinators
router.get('/', protect, getAllJudges);

// Get judge by ID - admin and coordinators
router.get('/:id', protect, getJudgeById);

export default router;