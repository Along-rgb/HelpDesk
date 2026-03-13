/**
 * API Route: Server-side ticket ID decryption
 * POST /api/tickets/decrypt
 * Body: { encrypted: string }
 * Returns: { id: string }
 *
 * Security H1: Uses server-only TICKET_ID_SECRET so the key
 * never appears in the client bundle.
 */
import { NextRequest, NextResponse } from 'next/server';
import { decryptIdServer, decryptId } from '@/lib/crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { encrypted } = body as { encrypted?: string };
    if (!encrypted || typeof encrypted !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid encrypted value' }, { status: 400 });
    }
    const id = decryptIdServer(encrypted) ?? decryptId(encrypted);
    if (!id) {
      return NextResponse.json({ error: 'Decryption failed or invalid token' }, { status: 400 });
    }
    return NextResponse.json({ id });
  } catch {
    return NextResponse.json({ error: 'Decryption failed' }, { status: 500 });
  }
}
