// table/normalizeHelpdeskRow.ts — shared normalizer for Helpdesk API row → Ticket
import { formatDateTime } from "@/utils/dateUtils";
import type { Ticket, Assignee, HelpdeskRequestRow } from "./types";
import type { AssignmentItem } from "./types";

/** Row from list (admin) or single GET helpdeskrequests/[id]; detail may have extra fields. */
export type HelpdeskRowInput = HelpdeskRequestRow & {
  email?: string | null;
  building?: { name?: string } | null;
  floor?: { name?: string } | null;
  turning?: { id?: number; name?: string } | null;
  room?: string | null;
  numberSKT?: string | number | null;
  updatedAt?: string | null;
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
    const id = (e as { id?: number })?.id ?? a.assignedToId ?? a.id ?? 0;
    return {
      id,
      name: name || "—",
      status: (a.status as Assignee["status"]) || "waiting",
      image: (e as { empimg?: string })?.empimg ?? undefined,
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
    emp_code: (emp as { emp_code?: string })?.emp_code ?? undefined,
    employeeId: requesterUserId != null ? requesterUserId : undefined,
    contactPhone: row.telephone != null ? String(row.telephone) : undefined,
    status: row.helpdeskStatus?.name ?? "",
    priority: row.priority?.name ?? "ບໍ່ລະບຸ",
    priorityId: row.priority?.id,
    verified: false,
    assignees,
    assignDate: detailRow.updatedAt ? formatDateTime(detailRow.updatedAt) : undefined,
    description: row.ticket?.description ?? undefined,
    building: detailRow.building?.name ?? undefined,
    level: detailRow.floor?.name ?? undefined,
    room: detailRow.room != null ? String(detailRow.room) : undefined,
    turning: detailRow.turning?.name ?? undefined,
    numberSKT: detailRow.numberSKT != null ? String(detailRow.numberSKT) : undefined,
    division: detailEmp?.division?.division_name ?? undefined,
    department: detailEmp?.department?.department_name ?? undefined,
    email: requesterEmail,
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
