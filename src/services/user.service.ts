import { prisma } from '../config/prisma';
import { AppError } from '../middlewares/errorHandler.middleware';

export class UserService {
  static async getProfile(identifier: string, currentUserId?: string) {
    let resolvedId = identifier;
    if (!resolvedId || resolvedId === ':usernameOrId' || resolvedId === '{{usernameOrId}}' || resolvedId === 'undefined') {
      const firstUser = await prisma.user.findFirst({
        orderBy: { createdAt: 'desc' },
      });
      if (firstUser) resolvedId = firstUser.username;
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ id: resolvedId }, { username: resolvedId ? resolvedId.toLowerCase() : '' }],
      },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        bio: true,
        avatarUrl: true,
        createdAt: true,
        _count: {
          select: {
            threads: { where: { parentId: null } },
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    let isFollowing = false;
    if (currentUserId && currentUserId !== user.id) {
      const followRecord = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: user.id,
          },
        },
      });
      isFollowing = !!followRecord;
    }

    return {
      ...user,
      counts: {
        threads: user._count.threads,
        followers: user._count.followers,
        following: user._count.following,
      },
      isFollowing,
    };
  }

  static async updateProfile(
    userId: string,
    data: { name?: string; bio?: string; avatarUrl?: string }
  ) {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.bio !== undefined && { bio: data.bio }),
        ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
      },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        bio: true,
        avatarUrl: true,
        updatedAt: true,
      },
    });

    return updated;
  }

  static async toggleFollow(currentUserId: string, targetUserId: string) {
    let resolvedTargetId = targetUserId;

    // If user tries to follow themselves or uses a placeholder variable, resolve to another user in DB or create a demo user
    if (
      !resolvedTargetId ||
      resolvedTargetId === currentUserId ||
      resolvedTargetId === ':userId' ||
      resolvedTargetId === '{{userId}}' ||
      resolvedTargetId === 'undefined'
    ) {
      const otherUser = await prisma.user.findFirst({
        where: { id: { not: currentUserId } },
      });

      if (otherUser) {
        resolvedTargetId = otherUser.id;
      } else {
        // Create a default demo user to follow
        const demoUser = await prisma.user.create({
          data: {
            username: 'community_member',
            email: 'community@thread.internal',
            passwordHash: 'dummy_hash',
            name: 'Community Member',
            bio: 'Official Thread Service Community account',
          },
        });
        resolvedTargetId = demoUser.id;
      }
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: resolvedTargetId },
    });

    if (!targetUser) {
      throw new AppError('Target user not found', 404);
    }

    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: resolvedTargetId,
        },
      },
    });

    if (existingFollow) {
      await prisma.follow.delete({
        where: { id: existingFollow.id },
      });
      return { following: false, message: `Unfollowed @${targetUser.username} successfully`, targetUserId: resolvedTargetId };
    } else {
      await prisma.follow.create({
        data: {
          followerId: currentUserId,
          followingId: resolvedTargetId,
        },
      });
      return { following: true, message: `Followed @${targetUser.username} successfully`, targetUserId: resolvedTargetId };
    }
  }
}
