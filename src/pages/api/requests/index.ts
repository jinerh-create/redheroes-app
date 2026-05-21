import type { APIRoute } from 'astro';
import { getOpenRequests, createRequest } from '../../../lib/db';

export const GET: APIRoute = async ({ locals }) => {
  const db = (locals as any).runtime?.env?.DB;
  if (!db) return new Response(JSON.stringify({ error: 'DB unavailable' }), { status: 503 });

  const requests = await getOpenRequests(db);
  return new Response(JSON.stringify(requests), { headers: { 'Content-Type': 'application/json' } });
};

export const POST: APIRoute = async ({ request, locals }) => {
  const db = (locals as any).runtime?.env?.DB;
  const me = (locals as any).user;
  if (!db || !me) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body) return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });

  const { patient_name, blood_type, units_needed, hospital, city, urgency, message, lat, lng } = body;
  if (!patient_name || !blood_type || !hospital || !city) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
  }

  const id = crypto.randomUUID();
  await createRequest(db, {
    id, requester_id: me.id, patient_name, blood_type,
    units_needed: units_needed ?? 1, hospital, city,
    lat, lng, urgency: urgency ?? 'normal',
    message, created_at: new Date().toISOString(),
  });

  return new Response(JSON.stringify({ ok: true, id }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
