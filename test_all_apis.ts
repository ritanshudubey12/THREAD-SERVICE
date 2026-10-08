import { createApp } from './src/app';
import { Server } from 'http';

const TEST_PORT = 5055;
const BASE_URL = `http://localhost:${TEST_PORT}`;

async function runTests() {
  const app = createApp();
  let server: Server;

  await new Promise<void>((resolve) => {
    server = app.listen(TEST_PORT, () => {
      console.log(`\n🧪 Test Server running on port ${TEST_PORT}\n`);
      resolve();
    });
  });

  const results: { test: string; status: number; expected: number; passed: boolean; details?: any }[] = [];

  const record = (name: string, status: number, expected: number, data?: any) => {
    const passed = status === expected;
    results.push({ test: name, status, expected, passed, details: data });
    console.log(`${passed ? '✅' : '❌'} [${status} ${status === expected ? 'OK' : 'FAIL'}] ${name}`);
  };

  try {
    // 1. Root Manifest
    const rootRes = await fetch(`${BASE_URL}/`);
    const rootData = (await rootRes.json()) as any;
    record('GET / (Root API Manifest)', rootRes.status, 200, rootData);

    // 2. Health Check
    const healthRes = await fetch(`${BASE_URL}/api/v1/health`);
    const healthData = (await healthRes.json()) as any;
    record('GET /api/v1/health (Health Check)', healthRes.status, 200, healthData);

    // 3. User 1 Signup
    const uniqueSuffix = Date.now();
    const user1Res = await fetch(`${BASE_URL}/api/v1/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: `alice_${uniqueSuffix}`,
        email: `alice_${uniqueSuffix}@example.com`,
        password: 'Password123!',
        name: 'Alice Developer',
        bio: 'Building awesome microservices',
      }),
    });
    const user1Data = (await user1Res.json()) as any;
    record('POST /api/v1/auth/signup (User 1 - Alice)', user1Res.status, 201, user1Data);
    const aliceToken = user1Data.data?.token;
    const aliceId = user1Data.data?.user?.id;

    // 4. User 2 Signup
    const user2Res = await fetch(`${BASE_URL}/api/v1/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: `bob_${uniqueSuffix}`,
        email: `bob_${uniqueSuffix}@example.com`,
        password: 'Password123!',
        name: 'Bob Smith',
        bio: 'Backend enthusiast',
      }),
    });
    const user2Data = (await user2Res.json()) as any;
    record('POST /api/v1/auth/signup (User 2 - Bob)', user2Res.status, 201, user2Data);
    const bobToken = user2Data.data?.token;
    const bobId = user2Data.data?.user?.id;

    // 5. User 1 Login
    const loginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailOrUsername: `alice_${uniqueSuffix}`,
        password: 'Password123!',
      }),
    });
    const loginData = (await loginRes.json()) as any;
    record('POST /api/v1/auth/login (Alice Login)', loginRes.status, 200, loginData);

    // 6. Current User Profile
    const meRes = await fetch(`${BASE_URL}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    const meData = (await meRes.json()) as any;
    record('GET /api/v1/auth/me (Current User Profile)', meRes.status, 200, meData);

    // 7. Get User Profile by Username
    const profileRes = await fetch(`${BASE_URL}/api/v1/users/alice_${uniqueSuffix}`);
    const profileData = (await profileRes.json()) as any;
    record('GET /api/v1/users/:username (Public Profile)', profileRes.status, 200, profileData);

    // 8. Update Profile
    const updateProfileRes = await fetch(`${BASE_URL}/api/v1/users/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${aliceToken}`,
      },
      body: JSON.stringify({
        name: 'Alice D. (Updated)',
        bio: 'Updated Bio: Full Stack Microservices Engineer',
      }),
    });
    const updateProfileData = (await updateProfileRes.json()) as any;
    record('PATCH /api/v1/users/profile (Update Profile)', updateProfileRes.status, 200, updateProfileData);

    // 9. Follow User (Alice follows Bob)
    const followRes = await fetch(`${BASE_URL}/api/v1/users/${bobId}/follow`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    const followData = (await followRes.json()) as any;
    record('POST /api/v1/users/:userId/follow (Follow User)', followRes.status, 200, followData);

    // 10. Create Thread
    const threadRes = await fetch(`${BASE_URL}/api/v1/threads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${aliceToken}`,
      },
      body: JSON.stringify({
        content: 'Hello World! This is my first thread on our Thread Microservice! 🚀',
        mediaUrls: ['https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe'],
      }),
    });
    const threadData = (await threadRes.json()) as any;
    record('POST /api/v1/threads (Create Main Thread)', threadRes.status, 201, threadData);
    const mainThreadId = threadData.data?.id;

    // 11. Create Nested Reply (Bob replies to Alice's thread)
    const replyRes = await fetch(`${BASE_URL}/api/v1/threads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bobToken}`,
      },
      body: JSON.stringify({
        content: 'Awesome thread Alice! Reply threading works seamlessly! 💬',
        parentId: mainThreadId,
      }),
    });
    const replyData = (await replyRes.json()) as any;
    record('POST /api/v1/threads (Create Reply Thread)', replyRes.status, 201, replyData);
    const replyThreadId = replyData.data?.id;

    // 12. Create Quote Repost (Alice reposts)
    const repostRes = await fetch(`${BASE_URL}/api/v1/threads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${aliceToken}`,
      },
      body: JSON.stringify({
        content: 'Check out this discussion! 🔁',
        repostOfId: mainThreadId,
      }),
    });
    const repostData = (await repostRes.json()) as any;
    record('POST /api/v1/threads (Quote / Repost Thread)', repostRes.status, 201, repostData);

    // 13. Get Threads Feed
    const feedRes = await fetch(`${BASE_URL}/api/v1/threads?page=1&limit=10`);
    const feedData = (await feedRes.json()) as any;
    record('GET /api/v1/threads (Get Main Feed)', feedRes.status, 200, feedData);

    // 14. Get Single Thread Details with Replies
    const getThreadRes = await fetch(`${BASE_URL}/api/v1/threads/${mainThreadId}`, {
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    const getThreadData = (await getThreadRes.json()) as any;
    record('GET /api/v1/threads/:id (Get Thread Details & Replies)', getThreadRes.status, 200, getThreadData);

    // 15. Toggle Like on Thread (Bob likes Alice's thread)
    const likeRes = await fetch(`${BASE_URL}/api/v1/interactions/threads/${mainThreadId}/like`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${bobToken}` },
    });
    const likeData = (await likeRes.json()) as any;
    record('POST /api/v1/interactions/threads/:id/like (Toggle Like)', likeRes.status, 200, likeData);

    // 16. Toggle Bookmark on Thread (Bob bookmarks Alice's thread)
    const bookmarkRes = await fetch(`${BASE_URL}/api/v1/interactions/threads/${mainThreadId}/bookmark`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${bobToken}` },
    });
    const bookmarkData = (await bookmarkRes.json()) as any;
    record('POST /api/v1/interactions/threads/:id/bookmark (Toggle Bookmark)', bookmarkRes.status, 200, bookmarkData);

    // 17. Get User Bookmarks (Bob checks bookmarks)
    const getBookmarksRes = await fetch(`${BASE_URL}/api/v1/interactions/bookmarks?page=1&limit=10`, {
      headers: { Authorization: `Bearer ${bobToken}` },
    });
    const getBookmarksData = (await getBookmarksRes.json()) as any;
    record('GET /api/v1/interactions/bookmarks (Get Saved Bookmarks)', getBookmarksRes.status, 200, getBookmarksData);

    // 18. Update Thread (Alice edits her main thread)
    const updateThreadRes = await fetch(`${BASE_URL}/api/v1/threads/${mainThreadId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${aliceToken}`,
      },
      body: JSON.stringify({
        content: 'Hello World! [Edited] This is my first thread on our Thread Microservice! 🚀✨',
      }),
    });
    const updateThreadData = (await updateThreadRes.json()) as any;
    record('PATCH /api/v1/threads/:id (Update Thread Content)', updateThreadRes.status, 200, updateThreadData);

    // 19. Delete Thread (Bob deletes his reply thread)
    const deleteThreadRes = await fetch(`${BASE_URL}/api/v1/threads/${replyThreadId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${bobToken}` },
    });
    const deleteThreadData = (await deleteThreadRes.json()) as any;
    record('DELETE /api/v1/threads/:id (Delete Thread)', deleteThreadRes.status, 200, deleteThreadData);

    // Final Summary
    console.log('\n========================================');
    console.log(`📊 TEST SUMMARY: ${results.filter((r) => r.passed).length}/${results.length} PASSED`);
    const failedTests = results.filter((r) => !r.passed);
    if (failedTests.length > 0) {
      console.log('❌ FAILED TESTS:');
      failedTests.forEach((f) => console.log(`- ${f.test}: got ${f.status}, expected ${f.expected}`, f.details));
    }
    console.log('========================================\n');

    const allPassed = results.every((r) => r.passed);
    if (!allPassed) {
      console.error('❌ Some tests failed.');
      process.exit(1);
    } else {
      console.log('🎉 ALL APIs ARE 100% OPERATIONAL & RETURNING EXPECTED STATUS CODES (200 OK / 201 Created)!');
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  } finally {
    server!.close();
  }
}

runTests();
