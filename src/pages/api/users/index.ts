import type { APIRoute } from 'astro';
import { getAllDonors, getDonorsByBloodType } from '../../../lib/db';

export const GET: APIRoute = async ({ request, locals }) => {
  const db = (locals as any).runtime?.env?.DB;
  if (!db) return new Response(JSON.stringify({ error: 'DB unavailable' }), { status: 503 });

  const url = new URL(request.url);
  const blood = url.searchParams.get('blood');
  const users = blood ? await getDonorsByBloodType(db, blood) : await getAllDonors(db);
  const safe = users.map(({ ...u }: any) => { delete u.password_hash; return u; });

  return new Response(JSON.stringify(safe), { headers: { 'Content-Type': 'application/json' } });
};
