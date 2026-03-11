/**
 * สร้าง URL สำหรับดู/ดาวน์โหลดไฟล์ Helpdesk: PDF (hdFile) และรูป (hdImgs).
 * Backend ຕ້ອງການ prefix /helpdesk — ຫ້າມລຶບອອກ. ໃຊ້ env.helpdeskApiUrl ປະກອບ URL ໃຫ້ຖືກຕ້ອງ.
 */
import { env } from "@/config/env";

export type HelpdeskFileField = "hdFile" | "hdImgs";

/**
 * ດຶງ apiBase ຈາກ env.helpdeskApiUrl (ຕັດ /api ທ້າຍຖ້າມີ) ເພື່ອປະກອບ path /upload/...
 * ຕົວຢ່າງ: helpdeskApiUrl = https://api-test.edl.com.la/helpdesk/api → apiBase = https://api-test.edl.com.la/helpdesk
 */
function getUploadBaseFromEnv(): string {
  const url = (env.helpdeskApiUrl ?? "").trim();
  if (!url) return "";
  return url.replace(/\/api\/?$/, "").replace(/\/+$/, "");
}

/**
 * คืนค่า URL สำหรับแสดง/ดาวน์โหลดไฟล์ (PDF หรือรูป) ຈາກຊື່ໄຟລ໌ທີ່ API ສົ່ງມາ.
 * คืน Full Absolute URL (https://...) เสมอเมื่อมี env.helpdeskApiUrl — ทำงานได้ทั้ง Client และ Server.
 * ถ้า apiBase ບໍ່ມີ (ບໍ່ຕັ້ງ env): ໃຊ້ proxy path /api/proxy-helpdesk/upload/... ເປັນ fallback.
 */
export function getHelpdeskFileUrl(
  field: HelpdeskFileField,
  filename: string
): string {
  if (!filename || typeof filename !== "string") return "";
  const name = filename.trim().replace(/^\//, "");
  if (!name) return "";
  // Backend ใช้ path segment "hdfile" (ตัว f เล็ก) สำหรับ PDF — ບໍ່ແມ່ນ hdFile
  const pathSegment = field === "hdImgs" ? env.helpdeskImagesPath : "hdfile";
  const apiBase = getUploadBaseFromEnv();
  let result: string;
  if (apiBase) {
    result = `${apiBase}/upload/${pathSegment}/${name}`;
  } else if (env.useHelpdeskProxy) {
    result = `/api/proxy-helpdesk/upload/${pathSegment}/${name}`;
  } else {
    result = "";
  }
  return result;
}

/**
 * คืนค่า Full Absolute URL (https://api-test.edl.com.la/helpdesk/upload/...) สำหรับส่งไปยัง /api/download
 * ໃຊ້ env.helpdeskApiUrl ປະກອບຄ່າ — ໃຫ້ API ໄປ fetch ຈາກ External Backend จริง.
 */
export function getHelpdeskFileUrlAbsolute(field: HelpdeskFileField, filename: string): string {
  if (!filename || typeof filename !== "string") return "";
  const name = filename.trim().replace(/^\//, "");
  if (!name) return "";
  // Backend ใช้ "hdfile" (ตัว f เล็ก) สำหรับ PDF
  const pathSegment = field === "hdImgs" ? env.helpdeskImagesPath : "hdfile";
  const apiBase = getUploadBaseFromEnv();
  if (!apiBase) return "";
  return `${apiBase}/upload/${pathSegment}/${name}`;
}
