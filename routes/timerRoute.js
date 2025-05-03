import express from 'express';
import { timer } from '../controllers/timer.js';

const router = express.Router();

router.get('/hackathon/time-remaining', timer);

export default router;
