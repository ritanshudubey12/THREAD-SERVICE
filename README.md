# 🧵 Thread Service API

A robust, production-ready REST API for a Thread/Social microservice built with **TypeScript**, **Express**, **Prisma ORM**, and **PostgreSQL**.

---

## 🚀 Features

- 🔐 **Authentication**: User Signup & Login with bcrypt password hashing and JWT authentication tokens.
- 👤 **User Profiles & Follow System**: View profiles, follow/unfollow users, update profile info & avatar.
- 📝 **Threads & Posts**: Create threads with text and media attachments, support for parent-child replies (nested conversation threads) and reposts/quotes.
- ❤️ **Interactions**: Like / Unlike threads, bookmark threads, and query bookmarked posts.
- ⚡ **Security & Best Practices**:
  - `helmet` for secure HTTP headers.
  - `cors` configured for cross-origin requests.
  - Request validation using `zod`.
  - Centralized error handling and standardized JSON response envelopes.
  - Graceful shutdown handlers (`SIGINT`, `SIGTERM`).

---

## 📂 Project Structure

```
Thread service/
├── prisma/
│   └── schema.prisma               # Database models & relationships
├── src/
│   ├── config/
│   │   ├── env.ts                  # Environment variables config
│   │   └── prisma.ts               # Prisma client singleton
│   ├── controllers/
│   │   ├── auth.controller.ts      # Authentication handler
│   │   ├── user.controller.ts      # User profile & follow handler
│   │   ├── thread.controller.ts    # Thread CRUD handler
│   │   └── interaction.controller.ts # Likes & bookmarks handler
│   ├── middlewares/
│   │   ├── auth.middleware.ts      # JWT verification & optional auth
│   │   ├── errorHandler.middleware.ts # Global error handler
│   │   └── validate.middleware.ts  # Zod schema validation
│   ├── routes/
│   │   ├── auth.routes.ts          # /api/v1/auth
│   │   ├── user.routes.ts          # /api/v1/users
│   │   ├── thread.routes.ts        # /api/v1/threads
│   │   ├── interaction.routes.ts   # /api/v1/interactions
│   │   └── index.ts                # Master router
│   ├── services/
│   │   ├── auth.service.ts         # Auth business logic
│   │   ├── user.service.ts         # User & follow logic
│   │   ├── thread.service.ts       # Thread CRUD & feed queries
│   │   └── interaction.service.ts  # Likes & bookmarks logic
│   ├── types/
│   │   └── index.ts                # TypeScript interfaces
│   ├── utils/
│   │   ├── hash.ts                 # Password hashing helpers
│   │   ├── jwt.ts                  # JWT token helpers
│   │   └── response.ts             # Standardized API response helpers
│   ├── app.ts                      # Express application setup
│   └── server.ts                   # Entry point
├── .env.example                    # Environment template
├── package.json
└── tsconfig.json
```

---

## 🛠️ Quick Start

### 1. Configure Environment Variables
Copy `.env.example` to `.env` and set your PostgreSQL database connection:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/thread_service_db?schema=public"
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d
CORS_ORIGIN=*
```

### 2. Run Database Migrations
Generate the Prisma Client and migrate your PostgreSQL database:
```bash
npm run prisma:generate
npm run prisma:migrate
```

### 3. Start Development Server
```bash
npm run dev
```

The API will be running at `http://localhost:5000`.

---

## 📡 API Endpoints Overview

### 🩺 Health & Root
- `GET /` - API index and endpoint manifest
- `GET /api/v1/health` - Service health status

### 🔐 Authentication (`/api/v1/auth`)
- `POST /api/v1/auth/signup` - Register a new user
- `POST /api/v1/auth/login` - Login and get JWT Bearer token
- `GET /api/v1/auth/me` - Get current authenticated user profile *(Requires Auth)*

### 👤 Users (`/api/v1/users`)
- `GET /api/v1/users/:usernameOrId` - Get user profile with follower/following stats
- `PATCH /api/v1/users/profile` - Update profile name, bio, avatar *(Requires Auth)*
- `POST /api/v1/users/:userId/follow` - Toggle follow/unfollow *(Requires Auth)*

### 🧵 Threads (`/api/v1/threads`)
- `GET /api/v1/threads` - Get feed (supports `?page=1&limit=20&authorId=...`)
- `GET /api/v1/threads/:id` - Get thread details with nested replies & interaction counts
- `POST /api/v1/threads` - Create thread / reply / quote repost *(Requires Auth)*
- `PATCH /api/v1/threads/:id` - Update thread content *(Requires Auth & Author)*
- `DELETE /api/v1/threads/:id` - Delete thread *(Requires Auth & Author)*

### ❤️ Interactions (`/api/v1/interactions`)
- `POST /api/v1/interactions/threads/:threadId/like` - Toggle like/unlike *(Requires Auth)*
- `POST /api/v1/interactions/threads/:threadId/bookmark` - Toggle bookmark *(Requires Auth)*
- `GET /api/v1/interactions/bookmarks` - Get saved bookmarks feed *(Requires Auth)*

---

## 📜 Scripts
- `npm run dev` - Start dev server with hot-reload via `tsx`
- `npm run build` - Compile TypeScript to `/dist`
- `npm run start` - Start production server from `/dist`
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run migrations in development
- `npm run prisma:studio` - Open Prisma Studio web GUI
