import { defineMiddleware } from 'astro:middleware';
import { getUserIdFromCookie } from '../lib/auth';
import { getUserById } from '../lib/db';

const PUBLIC_PATHS = ['/', '/login', '/register', '/api/auth/login', '/api/auth/register'];
const PUBLIC_GET = ['/api/requests', '/api/stats'];

export const onRequest = defineMiddleware(async (ctx, next) => {
  const path = new URL(ctx.request.url).pathname;
  const method = ctx.request.method;

  const isPublic = PUBLIC_PATHS.some(p => path === p) ||
    (method === 'GET' && PUBLIC_GET.some(p => path.startsWith(p)));

  const sessionSecret = (ctx.locals as any).runtime?.env?.SESSION_SECRET ?? 'dev-secret';
  const cookies = ctx.request.headers.get('cookie');
  const userId = await getUserIdFromCookie(cookies, sessionSecret);

  if (userId) {
    const db = (ctx.locals as any).runtime?.env?.DB;
    if (db) {
      const user = await getUserById(db, userId);
      if (user) (ctx.locals as any).user = user;
    }
  }

  if (!isPublic && !(ctx.locals as any).user) {
    if (path.startsWith('/api/')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return ctx.redirect('/login');
  }

  return next();
});
