import type { APIRoute } from 'astro';

export const POST: APIRoute = async () => {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'Set-Cookie': 'rh_session=; Path=/; HttpOnly; Max-Age=0',
      'Content-Type': 'application/json',
    },
  });
};
