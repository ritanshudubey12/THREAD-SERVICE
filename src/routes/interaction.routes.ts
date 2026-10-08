import { Router } from 'express';
import { InteractionController } from '../controllers/interaction.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Like routes
router.post('/threads/like', authenticate, InteractionController.toggleLike);
router.post('/threads/:threadId/like', authenticate, InteractionController.toggleLike);
router.post('/like/:threadId', authenticate, InteractionController.toggleLike);
router.post('/like', authenticate, InteractionController.toggleLike);

// Bookmark routes
router.post('/threads/bookmark', authenticate, InteractionController.toggleBookmark);
router.post('/threads/:threadId/bookmark', authenticate, InteractionController.toggleBookmark);
router.post('/bookmark/:threadId', authenticate, InteractionController.toggleBookmark);
router.post('/bookmark', authenticate, InteractionController.toggleBookmark);

// Bookmarks list
router.get('/bookmarks', authenticate, InteractionController.getBookmarks);

export default router;
