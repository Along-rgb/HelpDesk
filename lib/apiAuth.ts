/**
 * Shared JWT verification for API routes.
 * Use for routes that require authenticated user (e.g. upload, change password).
 */
import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET?.trim() || process.env.HELPDESK_JWT_SECRET?.trim();

/**
 * Verifies Bearer token and returns userId. Returns null if missing/invalid.
 */
export async function verifyBearerUserId(request: NextRequest): Promise<number | null> {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7).trim();
  if (!token || !JWT_SECRET) return null;
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.sub ?? payload.userId ?? payload.id;
    if (userId == null) return null;
    const id = typeof userId === 'number' ? userId : Number(userId);
    return Number.isNaN(id) || id < 1 ? null : id;
  } catch {
    return null;
  }
}
