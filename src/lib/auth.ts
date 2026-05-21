const ALGO = { name: 'HMAC', hash: 'SHA-256' };

async function getKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey('raw', enc.encode(secret), ALGO, false, ['sign', 'verify']);
}

export async function signToken(userId: string, secret: string): Promise<string> {
  const payload = `${userId}.${Date.now()}`;
  const key = await getKey(secret);
  const sig = await crypto.subtle.sign(ALGO, key, new TextEncoder().encode(payload));
  const b64 = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return `${payload}.${b64}`;
}

export async function verifyToken(token: string, secret: string): Promise<string | null> {
  try {
    const parts = token.split('.');
    if (parts.length < 3) return null;
    const sig = parts[parts.length - 1];
    const payload = parts.slice(0, -1).join('.');
    const key = await getKey(secret);
    const sigBytes = Uint8Array.from(atob(sig), c => c.charCodeAt(0));
    const ok = await crypto.subtle.verify(ALGO, key, sigBytes, new TextEncoder().encode(payload));
    if (!ok) return null;
    const userId = parts[0];
    const ts = parseInt(parts[1]);
    if (Date.now() - ts > 30 * 24 * 60 * 60 * 1000) return null;
    return userId;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return (await hashPassword(password)) === hash;
}

export function getUserIdFromCookie(cookies: string | null, secret: string): Promise<string | null> {
  if (!cookies) return Promise.resolve(null);
  const match = cookies.match(/rh_session=([^;]+)/);
  if (!match) return Promise.resolve(null);
  return verifyToken(decodeURIComponent(match[1]), secret);
}
