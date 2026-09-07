import { Router } from 'express';
import { departmentController } from '../controllers/departmentController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { departmentSchema } from '../validators/index.js';

const router = Router();

router.use(authenticate);

router.get('/', (req, res, next) => departmentController.list(req, res, next));
router.get('/:id', (req, res, next) => departmentController.getById(req, res, next));

router.post('/', authorize(['HR', 'ADMIN']), validate(departmentSchema), (req, res, next) => departmentController.create(req, res, next));
router.put('/:id', authorize(['HR', 'ADMIN']), validate(departmentSchema.partial()), (req, res, next) => departmentController.update(req, res, next));
router.delete('/:id', authorize(['HR', 'ADMIN']), (req, res, next) => departmentController.delete(req, res, next));

export default router;
