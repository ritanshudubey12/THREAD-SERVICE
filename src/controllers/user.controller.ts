import { Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { sendSuccess } from '../utils/response';
import { AuthenticatedRequest } from '../types';

export class UserController {
  static async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const paramId = req.params.usernameOrId;
      const identifier =
        paramId && paramId !== 'profile'
          ? paramId
          : req.user?.username || req.user?.userId || '';
      const currentUserId = req.user?.userId;
      const profile = await UserService.getProfile(String(identifier), currentUserId);
      sendSuccess(res, profile, 'User profile fetched');
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const updated = await UserService.updateProfile(userId, req.body);
      sendSuccess(res, updated, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async toggleFollow(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const currentUserId = req.user!.userId;
      const targetUserId = String(req.params.userId || req.body?.targetUserId || req.body?.userId || '');
      const result = await UserService.toggleFollow(currentUserId, targetUserId);
      sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }
}
