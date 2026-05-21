import type { APIRoute } from 'astro';
import { hashPassword, signToken } from '../../../lib/auth';
import { getUserByPhone, createUser } from '../../../lib/db';
import { getRankName } from '../../../lib/ranks';

export const POST: APIRoute = async ({ request, locals }) => {
  const db = (locals as any).runtime?.env?.DB;
  const secret = (locals as any).runtime?.env?.SESSION_SECRET ?? 'dev-secret';
  if (!db) return new Response(JSON.stringify({ error: 'DB unavailable' }), { status: 503 });

  const body = await request.json().catch(() => null);
  if (!body) return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });

  const { name, phone, email, password, blood_type, city } = body;
  if (!name || !phone || !password || !blood_type || !city) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
  }

  const existing = await getUserByPhone(db, phone);
  if (existing) return new Response(JSON.stringify({ error: 'Phone already registered' }), { status: 409 });

  const id = crypto.randomUUID();
  const password_hash = await hashPassword(password);
  const now = new Date().toISOString();

  await createUser(db, { id, name, phone, email, password_hash, blood_type, city, joined_at: now, is_donor: 1, is_available: 1 });

  const token = await signToken(id, secret);
  const cookie = `rh_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 24 * 3600}`;

  return new Response(JSON.stringify({ ok: true, id }), {
    status: 200,
    headers: { 'Set-Cookie': cookie, 'Content-Type': 'application/json' },
  });
};
