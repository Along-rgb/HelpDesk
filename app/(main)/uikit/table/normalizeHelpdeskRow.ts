// table/normalizeHelpdeskRow.ts — shared normalizer for Helpdesk API row → Ticket
import { formatDateTime } from "@/utils/dateUtils";
import type { Ticket, Assignee, HelpdeskRequestRow } from "./types";
import type { AssignmentItem } from "./types";

/** ລາຍການຮູບຈາກ API hdImgs */
export type HdImgItem = { id: number; helpdeskRequestId: number; hdImg: string };

/** Row from list (admin) or single GET helpdeskrequests/[id]; detail may have extra fields. */
export type HelpdeskRowInput = HelpdeskRequestRow & {
  email?: string | null;
  building?: { name?: string } | null;
  floor?: { name?: string } | null;
  turning?: { id?: number; name?: string } | null;
  turningId?: number | null;
  room?: string | null;
  numberSKT?: string | number | null;
  updatedAt?: string | null;
  /** ຊື່ໄຟລ໌ PDF (hdFile) */
  hdFile?: string | null;
  /** ລາຍການຮູບ (hdImgs) */
  hdImgs?: HdImgItem[] | null;
  createdBy?: HelpdeskRequestRow["createdBy"] & {
    email?: string | null;
    employee?: { department?: { department_name?: string }; division?: { division_name?: string }; email?: string };
  };
};

export function normalizeHelpdeskRow(row: HelpdeskRequestRow | HelpdeskRowInput): Ticket {
  const emp = row.createdBy?.employee;
  const first = (emp as { first_name?: string })?.first_name ?? "";
  const last = (emp as { last_name?: string })?.last_name ?? "";
  const requester = [first, last].filter(Boolean).join(" ").trim() || undefined;
  const assignees: Assignee[] = (row.assignments ?? []).map((a: AssignmentItem) => {
    const e = a.assignedTo?.employee ?? a.employee;
    const name = e ? [(e as { first_name?: string }).first_name, (e as { last_name?: string }).last_name].filter(Boolean).join(" ").trim() : "";
    /** id ສຳລັບ lookup: ໃຊ້ assignedToId (User ID) ຫຼື assignedTo.id ກ່ອນ, ຫຼັງຈາກນັ້ນ employee.id (Employee ID) ເພື່ອຮອງຮັບ staffEmpCodeMap ທີ່ມີທັງ 466 ແລະ 5325 */
    const id =
      a.assignedToId ??
      (a.assignedTo as { id?: number } | undefined)?.id ??
      (e as { id?: number })?.id ??
      a.id ??
      0;
    /** emp_code: ກວດ a.assignedTo?.employee?.emp_code ກ່ອນ (Ticket ທີ່ມອບໝາຍໃຫ້ Admin), ຫຼັງຈາກນັ້ນ e.emp_code, employeeCode, a.employee */
    const fromAssignedTo = (a.assignedTo as { employee?: { emp_code?: string | number } } | undefined)?.employee?.emp_code;
    const rawEmpCode =
      fromAssignedTo != null
        ? fromAssignedTo
        : e && (e as { emp_code?: string | number }).emp_code != null
          ? (e as { emp_code?: string | number }).emp_code
          : e && (e as { employeeCode?: string | number }).employeeCode != null
            ? (e as { employeeCode?: string | number }).employeeCode
            : (a as { employee?: { emp_code?: string | number } }).employee?.emp_code;
    const emp_code = rawEmpCode != null && String(rawEmpCode).trim() !== "" ? String(rawEmpCode).trim() : undefined;
    const phone = e && typeof (e as { tel?: string }).tel !== "undefined" ? String((e as { tel?: string }).tel ?? "").trim() || undefined : undefined;
    /** ສະຖານະແຍກຕາມ assignment — ໃຊ້ helpdeskStatusId/helpdeskStatus ຂອງ assignment ນີ້ (ບໍ່ໃຊ້ຂອງ helpdeskRequest) */
    /** ⭐ ດຶງຈາກ helpdeskStatus.id ກ່ອນເສມອ (API ສົ່ງມາແບບນີ້) ຫຼັງຈາກນັ້ນຈຶ່ງ fallback ໄປ helpdeskStatusId */
    const statusId =
      (a.helpdeskStatus?.id != null && Number.isFinite(Number(a.helpdeskStatus.id)))
        ? Number(a.helpdeskStatus.id)
        : (a.helpdeskStatusId != null && Number.isFinite(Number(a.helpdeskStatusId)))
          ? Number(a.helpdeskStatusId)
          : undefined;
    
    return {
      id,
      name: name || "—",
      emp_code,
      status: (a.status as Assignee["status"]) || "waiting",
      statusId,
      assignmentId: a.id != null && Number.isFinite(Number(a.id)) ? Number(a.id) : undefined,
      image: (e as { empimg?: string })?.empimg ?? undefined,
      phone,
    };
  });
  const detailRow = row as HelpdeskRowInput;
  const detailEmp = detailRow.createdBy?.employee as { department?: { department_name?: string }; division?: { division_name?: string } } | undefined;
  const createdBy = row.createdBy as { id?: number; email?: string } | null | undefined;
  const requesterUserId = createdBy?.id ?? (emp as { id?: number })?.id;
  /** ອີເມວ: ลองหลาย path ตามที่ API อาจส่ง — request.email, createdBy.email, createdBy.employee.email */
  const detail = row as HelpdeskRowInput;
  const requesterEmail =
    detail.email != null && String(detail.email).trim() !== ""
      ? String(detail.email).trim()
      : createdBy?.email != null && String(createdBy.email).trim() !== ""
        ? String(createdBy.email).trim()
        : emp?.email != null && String(emp.email).trim() !== ""
          ? String(emp.email).trim()
          : undefined;
  return {
    id: row.id,
    title: row.ticket?.title ?? "",
    date: row.createdAt ? formatDateTime(row.createdAt) : "",
    firstname_req: first || undefined,
    lastname_req: last || undefined,
    requester,
    emp_code: (() => {
      const raw =
        (emp as { emp_code?: string | number })?.emp_code ??
        (emp as { employeeCode?: string | number })?.employeeCode;
      return raw != null && String(raw).trim() !== "" ? String(raw).trim() : undefined;
    })(),
    employeeId: requesterUserId != null ? requesterUserId : undefined,
    contactPhone: row.telephone != null ? String(row.telephone) : undefined,
    status: row.helpdeskStatus?.name ?? "",
    statusId: row.helpdeskStatus?.id != null && Number.isFinite(Number(row.helpdeskStatus.id)) ? Number(row.helpdeskStatus.id) : undefined,
    priority: row.priority?.name ?? "ບໍ່ລະບຸ",
    priorityId: row.priority?.id,
    verified: false,
    assignees,
    assignDate: detailRow.updatedAt ? formatDateTime(detailRow.updatedAt) : undefined,
    /** ລາຍລະອຽດ: API ອາດສົ່ງມາເປັນ ticket.description ຫຼື details (ທັງແຖບ request ແລະ ticket) */
    description:
      row.ticket?.description ??
      (row.ticket as { details?: string } | undefined)?.details ??
      (detailRow as { details?: string }).details ??
      undefined,
    details:
      (row.ticket as { details?: string } | undefined)?.details != null
        ? String((row.ticket as { details?: string }).details)
        : (detailRow as { details?: string }).details != null
          ? String((detailRow as { details?: string }).details)
          : undefined,
    building: detailRow.building?.name ?? undefined,
    level: detailRow.floor?.name ?? undefined,
    room: detailRow.room != null ? String(detailRow.room) : undefined,
    turning: detailRow.turning?.name ?? undefined,
    turningId: detailRow.turningId != null ? Number(detailRow.turningId) : (detailRow.turning?.id != null ? Number(detailRow.turning.id) : undefined),
    numberSKT: detailRow.numberSKT != null ? String(detailRow.numberSKT) : undefined,
    division: detailEmp?.division?.division_name ?? undefined,
    department: detailEmp?.department?.department_name ?? undefined,
    email: requesterEmail,
    hdFile: detailRow.hdFile != null && String(detailRow.hdFile).trim() !== "" ? String(detailRow.hdFile).trim() : undefined,
    hdImgs: (() => {
      const list = Array.isArray(detailRow.hdImgs) ? detailRow.hdImgs : (detailRow as { ticket?: { hdImgs?: unknown[] } }).ticket?.hdImgs;
      return Array.isArray(list) ? list.filter((i): i is HdImgItem => i != null && typeof (i as HdImgItem).hdImg === "string") : undefined;
    })(),
    _raw: row as HelpdeskRequestRow,
  };
}

/** Unwrap API response: array, { data: array }, or single row / { data: row } */
export function unwrapHelpdeskResponse<T>(data: unknown): T | null {
  if (data == null) return null;
  if (Array.isArray(data)) return null;
  if (typeof data === "object" && "data" in data) return (data as { data: T }).data ?? null;
  return data as T;
}
