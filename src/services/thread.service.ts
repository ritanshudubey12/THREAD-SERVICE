import { prisma } from '../config/prisma';
import { AppError } from '../middlewares/errorHandler.middleware';

const formatMediaUrls = (mediaUrls: any): string[] => {
  if (Array.isArray(mediaUrls)) return mediaUrls;
  if (typeof mediaUrls === 'string') {
    try {
      const parsed = JSON.parse(mediaUrls);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

export class ThreadService {
  static async createThread(
    userId: string,
    data: {
      content: string;
      mediaUrls?: string[];
      parentId?: string;
      repostOfId?: string;
    }
  ) {
    let parentId = data.parentId;
    let repostOfId = data.repostOfId;

    if (parentId && (parentId === '{{threadId}}' || parentId === ':parentId' || parentId === 'undefined')) {
      const latest = await prisma.thread.findFirst({
        where: { parentId: null },
        orderBy: { createdAt: 'desc' },
        select: { id: true },
      });
      parentId = latest ? latest.id : undefined;
    }

    if (repostOfId && (repostOfId === '{{threadId}}' || repostOfId === ':repostOfId' || repostOfId === 'undefined')) {
      const latest = await prisma.thread.findFirst({
        where: { parentId: null },
        orderBy: { createdAt: 'desc' },
        select: { id: true },
      });
      repostOfId = latest ? latest.id : undefined;
    }

    if (parentId) {
      const parentThread = await prisma.thread.findUnique({
        where: { id: parentId },
      });
      if (!parentThread) {
        throw new AppError('Parent thread not found', 404);
      }
    }

    if (repostOfId) {
      const repostThread = await prisma.thread.findUnique({
        where: { id: repostOfId },
      });
      if (!repostThread) {
        throw new AppError('Target repost thread not found', 404);
      }
    }

    const thread = await prisma.thread.create({
      data: {
        content: data.content,
        mediaUrls: JSON.stringify(data.mediaUrls || []),
        authorId: userId,
        parentId: parentId || null,
        repostOfId: repostOfId || null,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            likes: true,
            replies: true,
            reposts: true,
            bookmarks: true,
          },
        },
      },
    });

    return {
      ...thread,
      mediaUrls: formatMediaUrls(thread.mediaUrls),
    };
  }

  static async getFeed(
    currentUserId?: string,
    options: { page?: number; limit?: number; authorId?: string } = {}
  ) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(50, options.limit || 20);
    const skip = (page - 1) * limit;

    const whereClause: any = {
      parentId: null, // Feed only shows top-level threads
    };

    if (options.authorId) {
      whereClause.authorId = options.authorId;
    }

    const [threads, total] = await Promise.all([
      prisma.thread.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              name: true,
              avatarUrl: true,
            },
          },
          repostOf: {
            include: {
              author: {
                select: {
                  id: true,
                  username: true,
                  name: true,
                  avatarUrl: true,
                },
              },
            },
          },
          _count: {
            select: {
              likes: true,
              replies: true,
              reposts: true,
              bookmarks: true,
            },
          },
          ...(currentUserId && {
            likes: {
              where: { userId: currentUserId },
              select: { id: true },
            },
            bookmarks: {
              where: { userId: currentUserId },
              select: { id: true },
            },
          }),
        },
      }),
      prisma.thread.count({ where: whereClause }),
    ]);

    const formattedThreads = threads.map((thread: any) => ({
      ...thread,
      mediaUrls: formatMediaUrls(thread.mediaUrls),
      repostOf: thread.repostOf
        ? {
            ...thread.repostOf,
            mediaUrls: formatMediaUrls(thread.repostOf.mediaUrls),
          }
        : null,
      isLiked: currentUserId ? thread.likes?.length > 0 : false,
      isBookmarked: currentUserId ? thread.bookmarks?.length > 0 : false,
      likes: undefined,
      bookmarks: undefined,
    }));

    return {
      threads: formattedThreads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getThreadById(threadId: string, currentUserId?: string) {
    let resolvedId = threadId;

    if (
      !resolvedId ||
      resolvedId === ':id' ||
      resolvedId === ':threadId' ||
      resolvedId === '{{threadId}}' ||
      resolvedId === 'undefined' ||
      resolvedId === 'latest'
    ) {
      const latest = await prisma.thread.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { id: true },
      });
      if (!latest) {
        throw new AppError('No threads found. Please create a thread first.', 404);
      }
      resolvedId = latest.id;
    }

    const thread = await prisma.thread.findUnique({
      where: { id: resolvedId },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            avatarUrl: true,
          },
        },
        repostOf: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
        replies: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
              select: {
                id: true,
                username: true,
                name: true,
                avatarUrl: true,
              },
            },
            _count: {
              select: {
                likes: true,
                replies: true,
                reposts: true,
              },
            },
            ...(currentUserId && {
              likes: {
                where: { userId: currentUserId },
                select: { id: true },
              },
            }),
          },
        },
        _count: {
          select: {
            likes: true,
            replies: true,
            reposts: true,
            bookmarks: true,
          },
        },
        ...(currentUserId && {
          likes: {
            where: { userId: currentUserId },
            select: { id: true },
          },
          bookmarks: {
            where: { userId: currentUserId },
            select: { id: true },
          },
        }),
      },
    });

    if (!thread) {
      throw new AppError('Thread not found. Please provide a valid threadId or create a thread first.', 404);
    }

    const formattedReplies = thread.replies.map((reply: any) => ({
      ...reply,
      mediaUrls: formatMediaUrls(reply.mediaUrls),
      isLiked: currentUserId ? reply.likes?.length > 0 : false,
      likes: undefined,
    }));

    return {
      ...thread,
      mediaUrls: formatMediaUrls(thread.mediaUrls),
      repostOf: thread.repostOf
        ? {
            ...thread.repostOf,
            mediaUrls: formatMediaUrls(thread.repostOf.mediaUrls),
          }
        : null,
      isLiked: currentUserId ? thread.likes?.length > 0 : false,
      isBookmarked: currentUserId ? thread.bookmarks?.length > 0 : false,
      likes: undefined,
      bookmarks: undefined,
      replies: formattedReplies,
    };
  }

  static async updateThread(
    threadId: string,
    userId: string,
    data: { content?: string; mediaUrls?: string[] }
  ) {
    let resolvedId = threadId;
    if (
      !resolvedId ||
      resolvedId === ':id' ||
      resolvedId === ':threadId' ||
      resolvedId === '{{threadId}}' ||
      resolvedId === 'undefined' ||
      resolvedId === 'latest'
    ) {
      const latestUserThread = await prisma.thread.findFirst({
        where: { authorId: userId },
        orderBy: { createdAt: 'desc' },
        select: { id: true },
      });
      if (!latestUserThread) {
        throw new AppError('No threads found for current user.', 404);
      }
      resolvedId = latestUserThread.id;
    }

    const thread = await prisma.thread.findUnique({
      where: { id: resolvedId },
    });

    if (!thread) {
      throw new AppError('Thread not found', 404);
    }

    if (thread.authorId !== userId) {
      throw new AppError('You are not authorized to update this thread', 403);
    }

    const updated = await prisma.thread.update({
      where: { id: resolvedId },
      data: {
        ...(data.content && { content: data.content }),
        ...(data.mediaUrls && { mediaUrls: JSON.stringify(data.mediaUrls) }),
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    return {
      ...updated,
      mediaUrls: formatMediaUrls(updated.mediaUrls),
    };
  }

  static async deleteThread(threadId: string, userId: string) {
    let resolvedId = threadId;
    if (
      !resolvedId ||
      resolvedId === ':id' ||
      resolvedId === ':threadId' ||
      resolvedId === '{{threadId}}' ||
      resolvedId === 'undefined' ||
      resolvedId === 'latest'
    ) {
      const latestUserThread = await prisma.thread.findFirst({
        where: { authorId: userId },
        orderBy: { createdAt: 'desc' },
        select: { id: true },
      });
      if (!latestUserThread) {
        throw new AppError('No threads found for current user to delete.', 404);
      }
      resolvedId = latestUserThread.id;
    }

    const thread = await prisma.thread.findUnique({
      where: { id: resolvedId },
    });

    if (!thread) {
      throw new AppError('Thread not found', 404);
    }

    if (thread.authorId !== userId) {
      throw new AppError('You are not authorized to delete this thread', 403);
    }

    await prisma.thread.delete({
      where: { id: resolvedId },
    });

    return { message: 'Thread deleted successfully' };
  }
}
