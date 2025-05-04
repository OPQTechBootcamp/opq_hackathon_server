import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js'; 
import teamAuthRoutes from './routes/teamAuthRoutes.js';
import teamDashboardRoutes from './routes/teamDashboardRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import evaluationRoutes from './routes/evaluationRoutes.js';
import roundsRoutes from './routes/roundsRoutes.js';
import resultRoutes from './routes/resultRoutes.js';
import sectionRoutes from './routes/sectionRoutes.js';
import hackathonScheduleRoutes from './routes/hackathonScheduleRoutes.js';
import timerRoute from './routes/timerRoute.js';


const app = express();
app.use(cors({
    origin: [
      'http://3.6.233.101', 
      'https://d2bgut31xyvm83.cloudfront.net', 
      'https://hack.opqtech.ai',
      'http://localhost:5173'  
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/team', teamAuthRoutes);
app.use('/api/teamDashboard', teamDashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/judge', evaluationRoutes);
app.use('/api/rounds', roundsRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/section', sectionRoutes);
app.use('/api/schedules', hackathonScheduleRoutes);
app.use('/api', timerRoute);

export default app;
