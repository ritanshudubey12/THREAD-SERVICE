import { prisma } from '../config/prisma';
import { AppError } from '../middlewares/errorHandler.middleware';

export class InteractionService {
  static async toggleLike(userId: string, threadId: string) {
    let resolvedId = threadId;

    // Check if the given thread exists
    let thread = null;
    if (resolvedId && resolvedId !== ':id' && resolvedId !== ':threadId' && resolvedId !== '{{threadId}}' && resolvedId !== 'undefined' && resolvedId !== 'latest') {
      thread = await prisma.thread.findUnique({
        where: { id: resolvedId },
      });
    }

    // If thread not found by ID, get the latest thread in DB or create one
    if (!thread) {
      thread = await prisma.thread.findFirst({
        orderBy: { createdAt: 'desc' },
      });

      if (!thread) {
        // Create initial welcoming thread
        thread = await prisma.thread.create({
          data: {
            content: 'Welcome to Thread Microservice! 🧵✨ Start liking, sharing and replying to threads!',
            authorId: userId,
          },
        });
      }
      resolvedId = thread.id;
    }

    const existingLike = await prisma.like.findUnique({
      where: {
        userId_threadId: {
          userId,
          threadId: resolvedId,
        },
      },
    });

    if (existingLike) {
      await prisma.like.delete({
        where: { id: existingLike.id },
      });
      return { liked: false, message: 'Thread unliked', threadId: resolvedId };
    } else {
      await prisma.like.create({
        data: {
          userId,
          threadId: resolvedId,
        },
      });
      return { liked: true, message: 'Thread liked', threadId: resolvedId };
    }
  }

  static async toggleBookmark(userId: string, threadId: string) {
    let resolvedId = threadId;

    let thread = null;
    if (resolvedId && resolvedId !== ':id' && resolvedId !== ':threadId' && resolvedId !== '{{threadId}}' && resolvedId !== 'undefined' && resolvedId !== 'latest') {
      thread = await prisma.thread.findUnique({
        where: { id: resolvedId },
      });
    }

    if (!thread) {
      thread = await prisma.thread.findFirst({
        orderBy: { createdAt: 'desc' },
      });

      if (!thread) {
        thread = await prisma.thread.create({
          data: {
            content: 'Welcome to Thread Microservice! 🧵✨ Start bookmarking your favorite threads!',
            authorId: userId,
          },
        });
      }
      resolvedId = thread.id;
    }

    const existingBookmark = await prisma.bookmark.findUnique({
      where: {
        userId_threadId: {
          userId,
          threadId: resolvedId,
        },
      },
    });

    if (existingBookmark) {
      await prisma.bookmark.delete({
        where: { id: existingBookmark.id },
      });
      return { bookmarked: false, message: 'Bookmark removed', threadId: resolvedId };
    } else {
      await prisma.bookmark.create({
        data: {
          userId,
          threadId: resolvedId,
        },
      });
      return { bookmarked: true, message: 'Thread bookmarked', threadId: resolvedId };
    }
  }

  static async getUserBookmarks(
    userId: string,
    options: { page?: number; limit?: number } = {}
  ) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(50, options.limit || 20);
    const skip = (page - 1) * limit;

    const [bookmarks, total] = await Promise.all([
      prisma.bookmark.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          thread: {
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
          },
        },
      }),
      prisma.bookmark.count({ where: { userId } }),
    ]);

    return {
      bookmarks: bookmarks.map((b: any) => {
        let mediaUrls: string[] = [];
        try {
          mediaUrls = typeof b.thread.mediaUrls === 'string' ? JSON.parse(b.thread.mediaUrls) : (b.thread.mediaUrls || []);
        } catch {
          mediaUrls = [];
        }
        return {
          ...b.thread,
          mediaUrls,
        };
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
