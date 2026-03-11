/**
 * Service สำหรับส่งข้อมูลລາຍງານວຽກ (Report Work).
 * เมื่อมี API endpoint สำหรับบันทึกรายงานงานแล้ว ให้เรียก API ที่นี่ (POST + FormData หรือ JSON).
 */
import type { ReportWorkFormData } from "./types";

export interface ReportWorkPayload {

  
  helpdeskRequestId: number;
  workDetail: string;
  completedDate: string | null; // ISO date string
  imageFiles?: File[];
}

/**
 * เตรียม payload จาก form data สำหรับส่งไปยัง API (หรือเก็บไว้ใช้เมื่อมี endpoint).
 * ปัจจุบันยังไม่มีการเรียก API จริง — เมื่อมี endpoint ให้เพิ่มการเรียก POST ที่นี่.
 */
export function buildReportWorkPayload(
  ticketId: string | number,
  data: ReportWorkFormData
): ReportWorkPayload {
  const id = Number(ticketId);
  return {
    helpdeskRequestId: Number.isFinite(id) ? id : 0,
    workDetail: data.workDetail,
    completedDate: data.completedDate ? data.completedDate.toISOString().slice(0, 10) : null,
    imageFiles: data.imageFiles?.length ? data.imageFiles : undefined,
  };
}

/**
 * ส่งข้อมูลລາຍງານວຽກ (เมื่อมี API แล้วให้เรียก POST ที่นี่).
 */
export async function submitReportWork(
  ticketId: string | number,
  data: ReportWorkFormData
): Promise<void> {
  const payload = buildReportWorkPayload(ticketId, data);
  // TODO: เมื่อมี endpoint เช่น POST helpdeskrequests/reportwork หรือ similar
  // ให้เรียก axiosClientsHelpDesk.post(ENDPOINT, formData หรือ JSON) ที่นี่
  // payload ประกอบด้วย helpdeskRequestId, workDetail, completedDate, imageFiles
  void payload;
}
