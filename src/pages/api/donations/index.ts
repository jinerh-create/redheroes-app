import type { APIRoute } from 'astro';
import { recordDonation } from '../../../lib/db';

export const POST: APIRoute = async ({ request, locals }) => {
  const db = (locals as any).runtime?.env?.DB;
  const me = (locals as any).user;
  if (!db || !me) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body) return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });

  const { request_id, hospital, units, donated_at } = body;
  if (!hospital) return new Response(JSON.stringify({ error: 'Hospital required' }), { status: 400 });

  await recordDonation(db, {
    id: crypto.randomUUID(),
    donor_id: me.id,
    request_id: request_id ?? null,
    units: units ?? 1,
    hospital,
    donated_at: donated_at ?? new Date().toISOString(),
    verified: 0,
  });

  return new Response(JSON.stringify({ ok: true }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
