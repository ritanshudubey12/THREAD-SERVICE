import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import threadRoutes from './thread.routes';
import interactionRoutes from './interaction.routes';

const router = Router();

// Health Check
router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'thread-service',
    timestamp: new Date().toISOString(),
  });
});

// Mount modular sub-routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/threads', threadRoutes);
router.use('/interactions', interactionRoutes);

export default router;
