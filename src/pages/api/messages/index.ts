import type { APIRoute } from 'astro';
import { getConversation, sendMessage, markMessagesRead, getConversationList } from '../../../lib/db';

export const GET: APIRoute = async ({ request, locals }) => {
  const db = (locals as any).runtime?.env?.DB;
  const me = (locals as any).user;
  if (!db || !me) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const url = new URL(request.url);
  const otherId = url.searchParams.get('with');

  if (otherId) {
    await markMessagesRead(db, otherId, me.id);
    const msgs = await getConversation(db, me.id, otherId);
    return new Response(JSON.stringify(msgs), { headers: { 'Content-Type': 'application/json' } });
  }

  const list = await getConversationList(db, me.id);
  return new Response(JSON.stringify(list), { headers: { 'Content-Type': 'application/json' } });
};

export const POST: APIRoute = async ({ request, locals }) => {
  const db = (locals as any).runtime?.env?.DB;
  const me = (locals as any).user;
  if (!db || !me) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body?.to_id || !body?.body) return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 });

  await sendMessage(db, {
    id: crypto.randomUUID(),
    from_id: me.id,
    to_id: body.to_id,
    body: body.body,
    read: 0,
    sent_at: new Date().toISOString(),
  });

  return new Response(JSON.stringify({ ok: true }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
