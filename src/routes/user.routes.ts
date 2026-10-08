import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate, optionalAuthenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { updateProfileSchema } from '../validations/user.validation';

const router = Router();

// Profile routes
router.get('/profile', authenticate, UserController.getProfile);
router.get('/profile/:usernameOrId', optionalAuthenticate, UserController.getProfile);
router.patch('/profile', authenticate, validate(updateProfileSchema), UserController.updateProfile);
router.patch('/', authenticate, validate(updateProfileSchema), UserController.updateProfile);

// Follow routes (supporting /follow, /:userId/follow, and /follow/:userId)
router.post('/follow', authenticate, UserController.toggleFollow);
router.post('/follow/:userId', authenticate, UserController.toggleFollow);
router.post('/:userId/follow', authenticate, UserController.toggleFollow);

// Username or ID lookup
router.get('/:usernameOrId', optionalAuthenticate, UserController.getProfile);
router.get('/', optionalAuthenticate, UserController.getProfile);

export default router;
