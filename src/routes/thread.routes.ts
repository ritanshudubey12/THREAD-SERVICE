import { Router } from 'express';
import { ThreadController } from '../controllers/thread.controller';
import { authenticate, optionalAuthenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createThreadSchema,
  updateThreadSchema,
  getThreadsQuerySchema,
} from '../validations/thread.validation';

const router = Router();

router.get('/', optionalAuthenticate, validate(getThreadsQuerySchema), ThreadController.getFeed);
router.get('/:id', optionalAuthenticate, ThreadController.getThreadById);
router.post('/', authenticate, validate(createThreadSchema), ThreadController.createThread);
router.patch('/:id', authenticate, validate(updateThreadSchema), ThreadController.updateThread);
router.patch('/', authenticate, validate(updateThreadSchema), ThreadController.updateThread);
router.delete('/:id', authenticate, ThreadController.deleteThread);
router.delete('/', authenticate, ThreadController.deleteThread);

export default router;
