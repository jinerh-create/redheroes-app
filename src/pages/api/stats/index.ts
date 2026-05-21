import type { APIRoute } from 'astro';
import { getLeaderboard, getAdminStats } from '../../../lib/db';

export const GET: APIRoute = async ({ locals }) => {
  const db = (locals as any).runtime?.env?.DB;
  if (!db) return new Response(JSON.stringify({ error: 'DB unavailable' }), { status: 503 });

  const [leaderboard, stats] = await Promise.all([
    getLeaderboard(db, 100),
    getAdminStats(db),
  ]);

  const safe = leaderboard.map(({ ...u }: any) => { delete u.password_hash; return u; });
  return new Response(JSON.stringify({ leaderboard: safe, stats }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
