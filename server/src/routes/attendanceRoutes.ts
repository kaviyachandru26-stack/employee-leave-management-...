import { Router } from 'express';
import { attendanceController } from '../controllers/attendanceController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { checkInSchema, checkOutSchema } from '../validators/index.js';

const router = Router();

router.use(authenticate);

router.get('/today-status', (req, res, next) => attendanceController.getTodayStatus(req, res, next));
router.post('/check-in', validate(checkInSchema), (req, res, next) => attendanceController.checkIn(req, res, next));
router.post('/check-out', validate(checkOutSchema), (req, res, next) => attendanceController.checkOut(req, res, next));
router.get('/', (req, res, next) => attendanceController.list(req, res, next));
router.get('/team', authorize(['MANAGER', 'HR', 'ADMIN']), (req, res, next) => attendanceController.getTeamAttendance(req, res, next));

export default router;
