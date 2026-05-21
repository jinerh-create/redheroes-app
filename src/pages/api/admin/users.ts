import type { APIRoute } from 'astro';
import { getAllUsers } from '../../../lib/db';

export const GET: APIRoute = async ({ locals }) => {
  const db = (locals as any).runtime?.env?.DB;
  const me = (locals as any).user;
  if (!db || !me?.is_admin) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

  const users = await getAllUsers(db);
  const safe = users.map(({ ...u }: any) => { delete u.password_hash; return u; });
  return new Response(JSON.stringify(safe), { headers: { 'Content-Type': 'application/json' } });
};
