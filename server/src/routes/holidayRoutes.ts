import { Router } from 'express';
import { holidayController } from '../controllers/holidayController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { holidaySchema } from '../validators/index.js';

const router = Router();

router.use(authenticate);

router.get('/', (req, res, next) => holidayController.list(req, res, next));
router.post('/', authorize(['HR', 'ADMIN']), validate(holidaySchema), (req, res, next) => holidayController.create(req, res, next));
router.put('/:id', authorize(['HR', 'ADMIN']), validate(holidaySchema.partial()), (req, res, next) => holidayController.update(req, res, next));
router.delete('/:id', authorize(['HR', 'ADMIN']), (req, res, next) => holidayController.delete(req, res, next));

export default router;
