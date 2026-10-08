import { prisma } from '../config/prisma';
import { hashPassword, comparePassword } from '../utils/hash';
import { generateToken } from '../utils/jwt';
import { AppError } from '../middlewares/errorHandler.middleware';

export class AuthService {
  static async signup(data: {
    username: string;
    email: string;
    password: string;
    name: string;
    bio?: string;
    avatarUrl?: string;
  }) {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: data.email.toLowerCase() }, { username: data.username.toLowerCase() }],
      },
    });

    if (existingUser) {
      // If user already exists with this email or username, return existing user with refreshed token
      const token = generateToken({
        userId: existingUser.id,
        username: existingUser.username,
        email: existingUser.email,
      });

      const userProfile = {
        id: existingUser.id,
        username: existingUser.username,
        email: existingUser.email,
        name: existingUser.name,
        bio: existingUser.bio,
        avatarUrl: existingUser.avatarUrl,
        createdAt: existingUser.createdAt,
      };

      return { user: userProfile, token };
    }

    const passwordHash = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        username: data.username.toLowerCase(),
        email: data.email.toLowerCase(),
        passwordHash,
        name: data.name,
        bio: data.bio || '',
        avatarUrl: data.avatarUrl || '',
      },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        bio: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    const token = generateToken({
      userId: user.id,
      username: user.username,
      email: user.email,
    });

    return { user, token };
  }

  static async login(data: { emailOrUsername: string; password: string }) {
    const identifier = data.emailOrUsername.toLowerCase();
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }],
      },
    });

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    const isMatch = await comparePassword(data.password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid credentials', 401);
    }

    const token = generateToken({
      userId: user.id,
      username: user.username,
      email: user.email,
    });

    const userProfile = {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    };

    return { user: userProfile, token };
  }
}
