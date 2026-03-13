/**
 * API Route: Server-side ticket ID encryption
 * POST /api/tickets/encrypt
 * Body: { id: string | number }
 * Returns: { encrypted: string }
 *
 * Security H1: Moves encryption to server so NEXT_PUBLIC_TICKET_ID_SECRET
 * is no longer needed in the client bundle.
 */
import { NextRequest, NextResponse } from 'next/server';
import { encryptId } from '@/lib/crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body as { id?: string | number };
    if (id == null || (typeof id !== 'string' && typeof id !== 'number')) {
      return NextResponse.json({ error: 'Missing or invalid id' }, { status: 400 });
    }
    const encrypted = encryptId(id);
    return NextResponse.json({ encrypted });
  } catch {
    return NextResponse.json({ error: 'Encryption failed' }, { status: 500 });
  }
}
