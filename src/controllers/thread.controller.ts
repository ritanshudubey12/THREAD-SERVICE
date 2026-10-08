import { Response, NextFunction } from 'express';
import { ThreadService } from '../services/thread.service';
import { sendSuccess } from '../utils/response';
import { AuthenticatedRequest } from '../types';

export class ThreadController {
  static async createThread(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const thread = await ThreadService.createThread(userId, req.body);
      sendSuccess(res, thread, 'Thread created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async getFeed(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const currentUserId = req.user?.userId;
      const { page, limit, authorId } = req.query;
      const result = await ThreadService.getFeed(currentUserId, {
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        authorId: authorId ? String(authorId) : undefined,
      });
      sendSuccess(res, result, 'Feed fetched successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getThreadById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const currentUserId = req.user?.userId;
      const threadId = (req.params.id || req.params.threadId || req.query.id || req.query.threadId) as string;
      const thread = await ThreadService.getThreadById(threadId, currentUserId);
      sendSuccess(res, thread, 'Thread details fetched successfully');
    } catch (error) {
      next(error);
    }
  }

  static async updateThread(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const threadId = (req.params.id || req.params.threadId || req.body?.threadId || req.body?.id) as string;
      const thread = await ThreadService.updateThread(threadId, userId, req.body);
      sendSuccess(res, thread, 'Thread updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async deleteThread(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const threadId = (req.params.id || req.params.threadId || req.body?.threadId || req.body?.id) as string;
      const result = await ThreadService.deleteThread(threadId, userId);
      sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }
}
