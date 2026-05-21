import type { APIRoute } from 'astro';
import { getNotifications, markNotifRead } from '../../../lib/db';

export const GET: APIRoute = async ({ locals }) => {
  const db = (locals as any).runtime?.env?.DB;
  const me = (locals as any).user;
  if (!db || !me) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const notifs = await getNotifications(db, me.id);
  return new Response(JSON.stringify(notifs), { headers: { 'Content-Type': 'application/json' } });
};

export const POST: APIRoute = async ({ request, locals }) => {
  const db = (locals as any).runtime?.env?.DB;
  const me = (locals as any).user;
  if (!db || !me) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const body = await request.json().catch(() => null);
  if (body?.id) await markNotifRead(db, body.id);

  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
};
