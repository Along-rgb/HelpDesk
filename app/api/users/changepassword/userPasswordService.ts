/**
 * User password service — ใช้สำหรับ API เปลี่ยนรหัสผ่าน
 *
 * ⚠️  PRODUCTION TODO (Security H5):
 * Replace the in-memory Map below with a real database (e.g. Prisma).
 * Example:
 *   getPasswordHashByUserId → prisma.user.findUnique({ where: { id }, select: { password: true } })
 *   updatePasswordById      → prisma.user.update({ where: { id }, data: { password: hash } })
 *
 * Security: Disabled by default. Set ENABLE_INMEMORY_PASSWORD_SERVICE=true in .env.local
 * to enable for local development ONLY. Always disabled in production (NODE_ENV=production).
 * Data is lost on every server restart.
 */
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

/**
 * Thrown when the mock password service is disabled.
 * The route handler should catch this and return 503.
 */
export class MockPasswordServiceDisabledError extends Error {
  constructor() {
    super('In-memory password service is disabled. Connect a real database.');
    this.name = 'MockPasswordServiceDisabledError';
  }
}

function isMockEnabled(): boolean {
  // Never allow in production
  if (process.env.NODE_ENV === 'production') return false;
  return process.env.ENABLE_INMEMORY_PASSWORD_SERVICE?.trim().toLowerCase() === 'true';
}

/** Mock: เก็บ hash ต่อ userId (in-memory). ใช้เฉพาะ dev เท่านั้น */
const passwordHashByUserId = new Map<number, string>();

/**
 * ดึง password hash ของ user จากฐานข้อมูล (Mock: in-memory)
 * Production: แทนที่ด้วย Prisma เช่น prisma.user.findUnique({ where: { id: userId }, select: { password: true } })
 */
export async function getPasswordHashByUserId(userId: number): Promise<string | null> {
  if (!isMockEnabled()) throw new MockPasswordServiceDisabledError();
  // No default hash fallback — user must exist in the map
  return passwordHashByUserId.get(userId) ?? null;
}

/**
 * อัปเดตรหัสผ่านใหม่ (hash แล้ว) ลงฐานข้อมูล
 * Production: แทนที่ด้วย Prisma เช่น prisma.user.update({ where: { id: userId }, data: { password: newHash } })
 */
export async function updatePasswordById(userId: number, newPasswordHash: string): Promise<void> {
  if (!isMockEnabled()) throw new MockPasswordServiceDisabledError();
  passwordHashByUserId.set(userId, newPasswordHash);
}

/**
 * Hash รหัสผ่านด้วย bcrypt (สำหรับบันทึกลง DB)
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

/**
 * ตรวจสอบรหัสผ่านกับ hash
 */
export async function comparePassword(plainPassword: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, hash);
}
