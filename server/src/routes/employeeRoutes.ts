import { Router } from 'express';
import { employeeController } from '../controllers/employeeController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createEmployeeSchema, updateEmployeeSchema } from '../validators/index.js';

const router = Router();

router.use(authenticate);

// All authenticated users can list employees (for directories, managers, HR)
router.get('/', (req, res, next) => employeeController.list(req, res, next));
router.get('/:id', (req, res, next) => employeeController.getById(req, res, next));
router.get('/:id/balances', (req, res, next) => employeeController.getBalances(req, res, next));

// Only HR and ADMIN can create, update, or delete employee records
router.post('/', authorize(['HR', 'ADMIN']), validate(createEmployeeSchema), (req, res, next) => employeeController.create(req, res, next));
router.put('/:id', authorize(['HR', 'ADMIN']), validate(updateEmployeeSchema), (req, res, next) => employeeController.update(req, res, next));
router.delete('/:id', authorize(['ADMIN']), (req, res, next) => employeeController.delete(req, res, next));

export default router;
