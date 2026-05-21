import type { APIRoute } from 'astro';
import { verifyPassword, signToken } from '../../../lib/auth';
import { getUserByPhone } from '../../../lib/db';

export const POST: APIRoute = async ({ request, locals }) => {
  const db = (locals as any).runtime?.env?.DB;
  const secret = (locals as any).runtime?.env?.SESSION_SECRET ?? 'dev-secret';
  if (!db) return new Response(JSON.stringify({ error: 'DB unavailable' }), { status: 503 });

  const body = await request.json().catch(() => null);
  if (!body) return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });

  const { phone, password } = body;
  if (!phone || !password) return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 });

  const user = await getUserByPhone(db, phone);
  if (!user) return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 });

  const ok = await verifyPassword(password, (user as any).password_hash);
  if (!ok) return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 });

  const token = await signToken(user.id, secret);
  const cookie = `rh_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 24 * 3600}`;

  return new Response(JSON.stringify({ ok: true, id: user.id, name: user.name }), {
    status: 200,
    headers: { 'Set-Cookie': cookie, 'Content-Type': 'application/json' },
  });
};
