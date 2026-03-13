/**
 * Service สำหรับส่งข้อมูลລາຍງານວຽກ (Report Work).
 * เรียก POST helpdeskrequests/:id/reportwork (multipart/form-data).
 */
import axiosClientsHelpDesk from "@/config/axiosClientsHelpDesk";
import { HELPDESK_ENDPOINTS } from "@/config/endpoints";
import type { ReportWorkFormData } from "./types";

export interface ReportWorkPayload {
  helpdeskRequestId: number;
  workDetail: string;
  completedDate: string | null; // ISO date string
  imageFiles?: File[];
}

/**
 * เตรียม payload จาก form data (ใช้ใน buildFormData และสำหรับอ้างอิง).
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

/** ชื่อ field ใน FormData — ต้องตรงกับ Backend */
const FORM_KEY_WORK_DETAIL = "workDetail";
const FORM_KEY_COMPLETED_DATE = "completedDate";
const FORM_KEY_IMAGES = "imageFiles";

/**
 * สร้าง FormData สำหรับ POST reportwork (workDetail, completedDate, imageFiles).
 */
function buildReportWorkFormData(payload: ReportWorkPayload): FormData {
  const formData = new FormData();
  formData.append("helpdeskRequestId", String(payload.helpdeskRequestId));
  formData.append(FORM_KEY_WORK_DETAIL, payload.workDetail ?? "");
  formData.append(FORM_KEY_COMPLETED_DATE, payload.completedDate ?? "");
  if (payload.imageFiles?.length) {
    payload.imageFiles.forEach((file) => formData.append(FORM_KEY_IMAGES, file));
  }
  return formData;
}

/**
 * ส่งข้อมูลລາຍງານວຽກ ไปยัง Backend (POST multipart/form-data).
 */
export async function submitReportWork(
  ticketId: string | number,
  data: ReportWorkFormData
): Promise<void> {
  const id = Number(ticketId);
  if (!Number.isFinite(id)) {
    throw new Error("Invalid ticket id for report work");
  }
  const payload = buildReportWorkPayload(ticketId, data);
  const formData = buildReportWorkFormData(payload);
  const endpoint = HELPDESK_ENDPOINTS.reportWork(id);
  await axiosClientsHelpDesk.post(endpoint, formData);
}

/** PUT /api/assignments/:id (multipart/form-data) — สถานะ, comment, พิกัด, รูป (เส้นเดียวแบบ Postman) */
export interface AssignmentCommentFormData {
  comment: string;
  lat: number | null;
  lng: number | null;
  commentImg?: File | null;
}

const FORM_KEY_HELPDESK_STATUS_ID = "helpdeskStatusId";
const FORM_KEY_COMMENT = "comment";
const FORM_KEY_LAT = "lat";
const FORM_KEY_LNG = "lng";
const FORM_KEY_COMMENT_IMG = "commentImg";

/**
 * PUT /api/assignments/:assignmentId เท่านั้น — ใช้ Assignment ID (เช่น 64) ห้ามใช้ Ticket ID (74).
 * FormData: helpdeskStatusId, comment, lat, lng, commentImg (ตรง Backend).
 */
export async function submitAssignmentComment(
  assignmentId: number | string,
  data: AssignmentCommentFormData,
  helpdeskStatusId: number = 4
): Promise<void> {
  const formData = new FormData();
  formData.append(FORM_KEY_HELPDESK_STATUS_ID, String(helpdeskStatusId));
  formData.append(FORM_KEY_COMMENT, data.comment ?? "");
  if (data.lat != null && Number.isFinite(data.lat)) formData.append(FORM_KEY_LAT, String(data.lat));
  if (data.lng != null && Number.isFinite(data.lng)) formData.append(FORM_KEY_LNG, String(data.lng));
  if (data.commentImg != null) formData.append(FORM_KEY_COMMENT_IMG, data.commentImg);
  const url = `${HELPDESK_ENDPOINTS.ASSIGNMENTS}/${assignmentId}`;
  try {
    await axiosClientsHelpDesk.put(url, formData);
  } catch (err: unknown) {
    const ax = err as { response?: { data?: { message?: string; error?: string }; status?: number } };
    const msg =
      ax?.response?.data?.message ??
      ax?.response?.data?.error ??
      (ax?.response?.status ? `ຜິດພາດ (${ax.response.status})` : null) ??
      'ບັນທຶກບໍ່ສຳເລັດ';
    throw new Error(msg);
  }
}
