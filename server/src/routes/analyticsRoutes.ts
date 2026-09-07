import { Router } from 'express';
import { analyticsController } from '../controllers/analyticsController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/dashboard', (req, res, next) => analyticsController.getDashboardSummary(req, res, next));
router.get('/attendance', (req, res, next) => analyticsController.getAttendanceAnalytics(req, res, next));
router.get('/leaves', (req, res, next) => analyticsController.getLeaveAnalytics(req, res, next));

export default router;
