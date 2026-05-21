import type { APIRoute } from 'astro';
import { getRequestById, getRequestResponses, createResponse, fulfillRequest, createNotification, getUserById } from '../../../lib/db';

export const GET: APIRoute = async ({ params, locals }) => {
  const db = (locals as any).runtime?.env?.DB;
  if (!db) return new Response(JSON.stringify({ error: 'DB unavailable' }), { status: 503 });

  const req = await getRequestById(db, params.id!);
  if (!req) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });

  const responses = await getRequestResponses(db, params.id!);
  return new Response(JSON.stringify({ ...req, responses }), { headers: { 'Content-Type': 'application/json' } });
};

export const POST: APIRoute = async ({ params, request, locals }) => {
  const db = (locals as any).runtime?.env?.DB;
  const me = (locals as any).user;
  if (!db || !me) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const body = await request.json().catch(() => null);
  const action = body?.action;

  if (action === 'respond') {
    const id = crypto.randomUUID();
    await createResponse(db, {
      id, request_id: params.id!, donor_id: me.id,
      status: 'pending', message: body.message,
      responded_at: new Date().toISOString(),
    });

    const req = await getRequestById(db, params.id!);
    if (req) {
      await createNotification(db, {
        id: crypto.randomUUID(),
        user_id: req.requester_id,
        type: 'response',
        title: 'Donor Responded!',
        body: `${me.name} (${me.blood_type}) can help with your request for ${req.patient_name}`,
        link: `/requests/${params.id}`,
        read: 0,
        created_at: new Date().toISOString(),
      });
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
  }

  if (action === 'fulfill') {
    const req = await getRequestById(db, params.id!);
    if (!req || req.requester_id !== me.id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }
    await fulfillRequest(db, params.id!);
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
  }

  return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400 });
};
