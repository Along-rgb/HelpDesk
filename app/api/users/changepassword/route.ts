/**
 * API Route: เปลี่ยนรหัสผ่าน (Change Password)
 * POST /api/users/changepassword
 * Body: { oldpassword, password1, password2 }
 * Auth: Bearer JWT ใน Authorization Header — แกะ userId จาก token
 */
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import {
  getPasswordHashByUserId,
  updatePasswordById,
  hashPassword,
  comparePassword,
  MockPasswordServiceDisabledError,
} from './userPasswordService';

const MIN_PASSWORD_LENGTH = 6;
const JWT_SECRET = process.env.JWT_SECRET?.trim() || process.env.HELPDESK_JWT_SECRET?.trim();

/** Security M2: Simple in-memory rate limiter per IP */
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 5; // max attempts per window
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX;
}

export type ChangePasswordBody = {
  oldpassword?: string;
  password1?: string;
  password2?: string;
};

async function getBearerUserId(
  request: NextRequest
): Promise<{ userId: number } | { error: NextResponse }> {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) {
    return {
      error: NextResponse.json(
        { message: 'ບໍ່ພົບ Token (Missing or invalid Authorization header)' },
        { status: 401 }
      ),
    };
  }
  const token = auth.slice(7).trim();
  if (!token) {
    return {
      error: NextResponse.json(
        { message: 'Token ບໍ່ຖືກຕ້ອງ (Invalid token)' },
        { status: 401 }
      ),
    };
  }

  if (!JWT_SECRET) {
    return {
      error: NextResponse.json(
        { message: 'Server ຍັງບໍ່ໄດ້ຕັ້ງຄ່າ JWT_SECRET' },
        { status: 500 }
      ),
    };
  }

  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.sub ?? payload.userId ?? payload.id;
    if (userId == null) {
      return {
        error: NextResponse.json(
          { message: 'Token ບໍ່ມີ userId (Invalid token payload)' },
          { status: 401 }
        ),
      };
    }
    const id = typeof userId === 'number' ? userId : Number(userId);
    if (Number.isNaN(id) || id < 1) {
      return {
        error: NextResponse.json(
          { message: 'Token ບໍ່ຖືກຕ້ອງ (Invalid userId in token)' },
          { status: 401 }
        ),
      };
    }
    return { userId: id };
  } catch {
    return {
      error: NextResponse.json(
        { message: 'Token ໝົດອາຍຸ ຫຼື ບໍ່ຖືກຕ້ອງ (Token expired or invalid)' },
        { status: 401 }
      ),
    };
  }
}

function validateBody(body: ChangePasswordBody): { ok: true } | { ok: false; message: string; status: number } {
  const { oldpassword, password1, password2 } = body;
  if (oldpassword == null || typeof oldpassword !== 'string' || !oldpassword.trim()) {
    return { ok: false, message: 'ກະລຸນາໃສ່ລະຫັດຜ່ານປະຈຸບັນ', status: 400 };
  }
  if (password1 == null || typeof password1 !== 'string') {
    return { ok: false, message: 'ກະລຸນາໃສ່ລະຫັດຜ່ານໃໝ່', status: 400 };
  }
  if (password2 == null || typeof password2 !== 'string') {
    return { ok: false, message: 'ກະລຸນາໃສ່ຢືນຢັນລະຫັດຜ່ານໃໝ່', status: 400 };
  }
  if (password1 !== password2) {
    return { ok: false, message: 'ລະຫັດຜ່ານໃໝ່ບໍ່ກົງກັນ', status: 400 };
  }
  if (password1.length < MIN_PASSWORD_LENGTH) {
    return {
      ok: false,
      message: `ລະຫັດຜ່ານໃໝ່ຕ້ອງມີຢ່າງໜ້ອຍ ${MIN_PASSWORD_LENGTH} ຕົວອັກສອນ`,
      status: 400,
    };
  }
  return { ok: true };
}

export async function POST(request: NextRequest) {
  /** Security M2: Rate limiting */
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (isRateLimited(clientIp)) {
    return NextResponse.json(
      { message: 'ເກີນຈຳນວນຄັ້ງທີ່ອະນຸຍາດ ກະລຸນາລໍຖ້າ 15 ນາທີ (Too many attempts)' },
      { status: 429 }
    );
  }

  const authResult = await getBearerUserId(request);
  if ('error' in authResult) return authResult.error;
  const { userId } = authResult;

  let body: ChangePasswordBody;
  try {
    body = (await request.json()) as ChangePasswordBody;
  } catch {
    return NextResponse.json(
      { message: 'ຂໍ້ມູນບໍ່ຖືກຕ້ອງ (Invalid JSON body)' },
      { status: 400 }
    );
  }

  const validation = validateBody(body);
  if (!validation.ok) {
    return NextResponse.json({ message: validation.message }, { status: validation.status });
  }

  const { oldpassword, password1 } = body as { oldpassword: string; password1: string };

  try {
    const currentHash = await getPasswordHashByUserId(userId);
    if (!currentHash) {
      return NextResponse.json(
        { message: 'ບໍ່ພົບຜູ້ໃຊ້ (User not found)' },
        { status: 404 }
      );
    }

    const isOldCorrect = await comparePassword(oldpassword, currentHash);
    if (!isOldCorrect) {
      return NextResponse.json(
        { message: 'ລະຫັດຜ່ານປະຈຸບັນບໍ່ຖືກຕ້ອງ' },
        { status: 400 }
      );
    }

    const newHash = await hashPassword(password1);
    await updatePasswordById(userId, newHash);

    return NextResponse.json(
      { message: 'ປ່ຽນລະຫັດຜ່ານສຳເລັດ' },
      { status: 200 }
    );
  } catch (err) {
    /* ── Fail closed: if mock service is disabled, return 503 ── */
    if (err instanceof MockPasswordServiceDisabledError) {
      return NextResponse.json(
        { message: 'ບໍລິການປ່ຽນລະຫັດຜ່ານຍັງບໍ່ພ້ອມ (Password service unavailable)' },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { message: 'ເກີດຂໍ້ຜິດພາດ (Internal server error)' },
      { status: 500 }
    );
  }
}
