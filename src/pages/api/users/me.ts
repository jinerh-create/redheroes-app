import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ locals }) => {
  const user = (locals as any).user;
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const safe: any = { ...user };
  delete safe.password_hash;
  return new Response(JSON.stringify(safe), { headers: { 'Content-Type': 'application/json' } });
};
