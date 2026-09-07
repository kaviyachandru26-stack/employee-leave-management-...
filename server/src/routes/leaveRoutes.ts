import { Router } from 'express';
import { leaveController } from '../controllers/leaveController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createLeaveRequestSchema, leaveTypeSchema } from '../validators/index.js';

const router = Router();

router.use(authenticate);

// Leave Types
router.get('/types', (req, res, next) => leaveController.getTypes(req, res, next));
router.post('/types', authorize(['HR', 'ADMIN']), validate(leaveTypeSchema), (req, res, next) => leaveController.createType(req, res, next));

// Calculation preview
router.post('/calculate-days', (req, res, next) => leaveController.calculateDays(req, res, next));

// User's own balance
router.get('/balances/my', (req, res, next) => leaveController.getMyBalances(req, res, next));

// Leave Requests
router.get('/requests', (req, res, next) => leaveController.listRequests(req, res, next));
router.post('/requests', validate(createLeaveRequestSchema), (req, res, next) => leaveController.apply(req, res, next));
router.get('/requests/:id', (req, res, next) => leaveController.getRequestById(req, res, next));
router.post('/requests/:id/approve', authorize(['MANAGER', 'HR', 'ADMIN']), (req, res, next) => leaveController.approve(req, res, next));
router.post('/requests/:id/reject', authorize(['MANAGER', 'HR', 'ADMIN']), (req, res, next) => leaveController.reject(req, res, next));
router.post('/requests/:id/cancel', (req, res, next) => leaveController.cancel(req, res, next));

export default router;
