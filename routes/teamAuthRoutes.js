import express from 'express';
import { registerTeam, loginTeam,createTeamMemberProfile } from '../controllers/teamAuthController.js';
import {protect} from '../middlewares/authMiddleware.js';
const router = express.Router();

router.post('/register', registerTeam);
router.post('/login', loginTeam);
router.post('/member-profile',protect, createTeamMemberProfile);

export default router;
