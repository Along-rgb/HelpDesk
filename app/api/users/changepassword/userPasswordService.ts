/**
 * User password service — ใช้สำหรับ API เปลี่ยนรหัสผ่าน
 * ปัจจุบันเป็น Mock (in-memory); ใน production แทนที่ด้วย Prisma หรือ DB จริง
 */
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

/** Mock: เก็บ hash ต่อ userId (in-memory). ถ้ายังไม่มี จะคืน hash ของรหัสผ่านเริ่มต้นสำหรับ demo */
const passwordHashByUserId = new Map<number, string>();

/** Hash รหัสผ่านเริ่มต้นสำหรับ demo (a12345) — ใช้เมื่อ userId ยังไม่มีใน Map */
let defaultHash: string | null = null;

async function getDefaultHash(): Promise<string> {
  if (defaultHash) return defaultHash;
  defaultHash = await bcrypt.hash('a12345', SALT_ROUNDS);
  return defaultHash;
}

/**
 * ดึง password hash ของ user จากฐานข้อมูล (Mock: in-memory หรือ hash เริ่มต้น)
 * Production: แทนที่ด้วย Prisma เช่น prisma.user.findUnique({ where: { id: userId }, select: { password: true } })
 */
export async function getPasswordHashByUserId(userId: number): Promise<string | null> {
  const stored = passwordHashByUserId.get(userId);
  if (stored) return stored;
  return getDefaultHash();
}

/**
 * อัปเดตรหัสผ่านใหม่ (hash แล้ว) ลงฐานข้อมูล
 * Production: แทนที่ด้วย Prisma เช่น prisma.user.update({ where: { id: userId }, data: { password: newHash } })
 */
export async function updatePasswordById(userId: number, newPasswordHash: string): Promise<void> {
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
