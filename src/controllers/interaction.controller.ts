import { Response, NextFunction } from 'express';
import { InteractionService } from '../services/interaction.service';
import { sendSuccess } from '../utils/response';
import { AuthenticatedRequest } from '../types';

export class InteractionController {
  static async toggleLike(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const threadId = (req.params.threadId || req.params.id || req.body?.threadId) as string;
      const result = await InteractionService.toggleLike(userId, threadId);
      sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  static async toggleBookmark(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const threadId = (req.params.threadId || req.params.id || req.body?.threadId) as string;
      const result = await InteractionService.toggleBookmark(userId, threadId);
      sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  static async getBookmarks(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { page, limit } = req.query;
      const result = await InteractionService.getUserBookmarks(userId, {
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });
      sendSuccess(res, result, 'Bookmarks fetched successfully');
    } catch (error) {
      next(error);
    }
  }
}
