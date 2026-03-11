/**
 * Mapping ระหว่าง helpdeskStatus.id (จาก /api/helpdeskstatus/selecthelpdeskstatus) กับสถานะ assignment.
 * ใช้เทียบ ID จาก endpoint นี้เท่านั้น — ไม่ hardcode ID ในที่อื่น
 * แหล่งข้อมูลเดียว: app/store/helpdesk/helpdeskStatusStore (list + statusIdMap)
 */

export type AssigneeStatus = "doing" | "done" | "waiting";

const NAME_DOING = "ກຳລັງດຳເນີນການ";
const NAME_DONE = "ແກ້ໄຂແລ້ວ";
const NAME_DONE_ALT = "ປິດວຽກແລ້ວ";
const NAMES_WAITING = ["ລໍຖ້າຮັບວຽກ", "ລໍຖ້າຮັບເລື່ອງ"] as const;

function normalizeName(name: string | undefined): string {
  return (name ?? "").trim();
}

/**
 * สร้าง map id → AssigneeStatus จากรายการ helpdeskstatus/selecthelpdeskstatus
 * ใช้ใน store/helpdesk/helpdeskStatusStore เป็นหลัก
 */
export function buildStatusIdToAssigneeStatus(
  list: { id: number; name: string }[]
): Record<number, AssigneeStatus> {
  const map: Record<number, AssigneeStatus> = {};
  for (const item of list) {
    const id = Number(item.id);
    if (!Number.isFinite(id)) continue;
    const name = normalizeName(item.name);
    if (name === NAME_DOING) map[id] = "doing";
    else if (name === NAME_DONE || name === NAME_DONE_ALT) map[id] = "done";
    else if (NAMES_WAITING.includes(name as (typeof NAMES_WAITING)[number])) map[id] = "waiting";
  }
  return map;
}

/**
 * แปลง helpdeskStatus.id เป็น AssigneeStatus
 * ส่ง map จาก store (useHelpdeskStatusStore.getState().statusIdMap) หรือจาก argument
 */
export function getAssigneeStatusFromId(
  statusId: number | undefined,
  map?: Record<number, AssigneeStatus>
): AssigneeStatus {
  const id = statusId != null && Number.isFinite(Number(statusId)) ? Number(statusId) : null;
  if (id == null) return "waiting";
  if (!map) return "waiting";
  return map[id] ?? "waiting";
}

/** เช็คว่าสถานะ ID นี้เป็น "รอรับงาน" (waiting) หรือไม่ */
export function isWaitingStatusId(
  statusId: number | undefined,
  map?: Record<number, AssigneeStatus>
): boolean {
  return getAssigneeStatusFromId(statusId, map) === "waiting";
}
