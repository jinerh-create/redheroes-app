import type { APIRoute } from 'astro';
import { getUserById, updateUserAvatar, setUserAvailability } from '../../../lib/db';

export const GET: APIRoute = async ({ params, locals }) => {
  const db = (locals as any).runtime?.env?.DB;
  if (!db) return new Response(JSON.stringify({ error: 'DB unavailable' }), { status: 503 });

  const user = await getUserById(db, params.id!);
  if (!user) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });

  const safe: any = { ...user };
  delete safe.password_hash;
  return new Response(JSON.stringify(safe), { headers: { 'Content-Type': 'application/json' } });
};

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  const db = (locals as any).runtime?.env?.DB;
  const me = (locals as any).user;
  if (!db || !me) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  if (me.id !== params.id && !me.is_admin) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

  const body = await request.json().catch(() => null);
  if (!body) return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });

  if (body.avatar_b64 !== undefined) await updateUserAvatar(db, params.id!, body.avatar_b64);
  if (body.is_available !== undefined) await setUserAvailability(db, params.id!, body.is_available ? 1 : 0);

  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
};
