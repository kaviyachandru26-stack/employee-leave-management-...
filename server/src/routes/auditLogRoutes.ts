import { Router } from 'express';
import { auditLogController } from '../controllers/auditLogController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// Only HR and ADMIN can inspect system audit logs
router.get('/', authorize(['HR', 'ADMIN']), (req, res, next) => auditLogController.list(req, res, next));

export default router;
