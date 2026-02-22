import { z } from 'zod';
import type { CreateBuildingPayload } from '../types';

// ============================================================
// API Response Schemas (validate ข้อมูลที่ตอบกลับจาก API)
// ============================================================

/** รูปแบบ JSON จาก GET /floors */
export const FloorRowSchema = z.object({
  id: z.number(),
  buildingId: z.number().optional(),
  name: z.string(),
  code: z.string().optional(),
  status: z.string().optional(),
  building: z
    .object({
      id: z.number(),
      name: z.string(),
    })
    .optional(),
});

/** รูปแบบ JSON จาก GET /buildings (API อาจคืนแค่ id, name สำหรับ tab ຕຶກ/ອາຄານ) */
export const BuildingDataSchema = z.object({
  id: z.number(),
  name: z.string(),
  code: z.string().optional(),
  status: z.string().optional(),
  createdAt: z.string().optional(),
  parentId: z.number().optional(),
  parentName: z.string().optional(),
  levelName: z.string().optional(),
});

// ============================================================
// Payload Schemas (validate ก่อนส่งไป API)
// ============================================================

/** Payload สำหรับสร้าง/แก้ Floor (POST/PUT /floors) */
export const FloorSavePayloadSchema = z.union([
  z.object({ buildingId: z.number(), name: z.string() }),
  z.object({ name: z.string() }),
]);

/** Payload สำหรับสร้าง Building (POST /buildings ไม่ส่ง type ใน body) */
export const BuildingSavePayloadSchema = z.object({
  name: z.string(),
});

/** Payload เต็มจากฟอร์ม (ใช้กับ Room / อื่นๆ) */
export const CreateBuildingPayloadSchema = z.object({
  name: z.string(),
  code: z.string(),
  status: z.string(),
  parentId: z.number().nullable().optional(),
});

// ============================================================
// Inferred Types
// ============================================================

export type FloorRow = z.infer<typeof FloorRowSchema>;
export type BuildingDataValidated = z.infer<typeof BuildingDataSchema>;
export type FloorSavePayload = z.infer<typeof FloorSavePayloadSchema>;
export type BuildingSavePayload = z.infer<typeof BuildingSavePayloadSchema>;
export type CreateBuildingPayloadValidated = z.infer<typeof CreateBuildingPayloadSchema>;

/** Union ของ payload ที่ส่งไปยัง API (floors / buildings) — ใช้กับ useCoreApi<P> */
export type BuildingApiPayload = FloorSavePayload | BuildingSavePayload | CreateBuildingPayload;

// ============================================================
// Type Guards (ใช้แทน as เมื่อต้องการเช็คแบบ runtime)
// ============================================================

export function isFloorRow(value: unknown): value is FloorRow {
  return FloorRowSchema.safeParse(value).success;
}

export function isBuildingData(value: unknown): value is BuildingDataValidated {
  return BuildingDataSchema.safeParse(value).success;
}

/** Parse array จาก API เป็น FloorRow[] — คืนเฉพาะรายการที่ valid */
export function parseFloorRows(raw: unknown): FloorRow[] {
  const arr = Array.isArray(raw) ? raw : [];
  return arr.filter((item): item is FloorRow => isFloorRow(item));
}

/** Parse array จาก API เป็น BuildingDataValidated[] — คืนเฉพาะรายการที่ valid */
export function parseBuildingDataArray(raw: unknown): BuildingDataValidated[] {
  const arr = Array.isArray(raw) ? raw : [];
  return arr.filter((item): item is BuildingDataValidated => isBuildingData(item));
}
