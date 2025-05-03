import express from 'express';
const router = express.Router();
import { submitEvaluation, getAssignedTeamsForJudge, fetchAllTeamsRatings } from '../controllers/evaluationController.js';
import { protect, allowRoles } from '../middlewares/authMiddleware.js';
// Submit an evaluation
router.post('/submit',protect, allowRoles('judge'), submitEvaluation);
router.get('/assigned-teams/:judgeId', protect, allowRoles('judge'), getAssignedTeamsForJudge);
router.get('/all-teams-ratings', protect, fetchAllTeamsRatings);
export default router;
