import express from 'express';
import { getTeamDashboard, submitToRound,selectProblemStatementId, selectedProblemStatement } from '../controllers/teamDashboardController.js';
import upload from '../middlewares/upload.js';
import {protect} from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/dashboard', protect, getTeamDashboard);
router.post('/submit', protect, upload.single('file'), submitToRound);
router.post('/select-problem-statement/:id', protect,  selectProblemStatementId);
router.post('/selected-problem-statement', protect,  selectedProblemStatement);

export default router;
