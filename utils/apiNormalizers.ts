/**
 * Shared API response normalizers — handle both raw array and { data: [] } shape.
 */

/** แปลง response ที่อาจเป็น array ตรงๆ หรือ { data: T[] } เป็น T[] */
export function normalizeDataList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object' && 'data' in data) {
    const d = (data as { data: unknown }).data;
    if (Array.isArray(d)) return d as T[];
  }
  return [];
}

/** สำหรับ list ที่เป็น { id: number; name: string }[] (status, priority ฯลฯ) */
export function normalizeIdNameList(data: unknown): { id: number; name: string }[] {
  return normalizeDataList<{ id: number; name: string }>(data);
}
