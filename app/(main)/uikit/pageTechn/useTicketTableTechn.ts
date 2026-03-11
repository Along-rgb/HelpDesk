// pageTechn/useTicketTableTechn.ts
// Role 2: /tickets (TicketService). Role 3: ดึงรายการ helpdeskRequestId จาก GET /api/assignments (role 3 เรียก admin ไม่ได้) แล้วดึง GET helpdeskrequests/[id] ต่อรายการ
import { useState, useEffect, useCallback, useMemo } from "react";
import type { RefObject } from "react";
import type { Toast } from "primereact/toast";
import axiosClientsHelpDesk from "@/config/axiosClientsHelpDesk";
import { HELPDESK_ENDPOINTS } from "@/config/endpoints";
import { useHelpdeskStatusOptions } from "@/app/hooks/useHelpdeskStatusOptions";
import { normalizeDataList, normalizeIdNameList } from "@/utils/apiNormalizers";
import { formatDateTime } from "@/utils/dateUtils";
import { useHelpdeskStatusStore } from "@/app/store/helpdesk";
import { getAssigneeStatusFromId, isWaitingStatusId } from "@/utils/helpdeskStatusMapping";
import { isAbortError } from "@/utils/abortError";
import { Ticket, TicketRow, Assignee } from "./types";
import { TicketService } from "@/app/services/ticket.service";
import { useUserProfileStore } from "@/app/store/user/userProfileStore";

/** ກຳລັງດຳເນີນການ / ແກ້ໄຂແລ້ວ — ສຳລັບ mapAssigneeStatusToDisplay */
const STATUS_IN_PROGRESS_NAME = "ກຳລັງດຳເນີນການ";
const STATUS_DONE_NAME = "ແກ້ໄຂແລ້ວ";
/** ລໍຖ້າຮັບວຽກ/ລໍຖ້າຮັບເລື່ອງ — fallback เมื่อไม่มี ID จาก selecthelpdeskstatus */
const STATUS_WAITING_ACCEPT_OPTIONS = ["ລໍຖ້າຮັບວຽກ", "ລໍຖ້າຮັບເລື່ອງ"] as const;

function mapAssigneeStatusToDisplay(status: Assignee["status"], waitingLabel: string): string {
  if (status === "doing") return STATUS_IN_PROGRESS_NAME;
  if (status === "done") return STATUS_DONE_NAME;
  return waitingLabel;
}

/** Fallback เมื่อ API ບໍ່ສົ່ງ helpdeskStatus.id */
function assignmentStatusNameToStatus(name: string | undefined): Assignee["status"] {
  const n = (name ?? "").trim();
  if (n === STATUS_IN_PROGRESS_NAME || n === "ກຳລັງດຳເນີນການ") return "doing";
  if (n === STATUS_DONE_NAME || n === "ແກ້ໄຂແລ້ວ") return "done";
  return "waiting";
}

/** Raw assignment (จาก GET helpdeskrequests/[id] หรือจาก assignments API) */
interface RawAssignment {
  id?: number;
  assignedToId?: number;
  helpdeskRequestId?: number;
  assignedTo?: { id?: number; employee?: { id?: number; first_name?: string; last_name?: string; tel?: string; empimg?: string } };
  employee?: { id?: number; first_name?: string; last_name?: string; empimg?: string };
  status?: string;
  helpdeskStatus?: { id?: number; name?: string };
}

/** Response จาก GET helpdeskrequests/[id] — ตาม field ที่มีใน pageTechn */
interface HelpdeskRequestDetail {
  id: number;
  ticketId?: number;
  telephone?: string | null;
  room?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  ticket?: { id?: number; title?: string; description?: string };
  helpdeskStatus?: { id?: number; name?: string };
  priority?: { id?: number; name?: string } | null;
  createdBy?: {
    id?: number;
    employee?: {
      id?: number;
      first_name?: string;
      last_name?: string;
      emp_code?: string;
      department?: { id?: number; department_name?: string };
      division?: { id?: number; division_name?: string };
    };
  };
  building?: { id?: number; name?: string };
  floor?: { id?: number; name?: string };
  turning?: { id?: number; name?: string };
  assignments?: RawAssignment[] | null;
}

/** Item จาก GET /api/assignments */
interface AssignmentListItem {
  helpdeskRequestId?: number;
  assignedToId?: number;
}

function toFiniteNumber(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function getObj(value: unknown): Record<string, unknown> | null {
  return value != null && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function extractHelpdeskRequestId(item: unknown): number | null {
  const o = getObj(item);
  if (!o) return null;
  const direct =
    o.helpdeskRequestId ??
    o.helpdesk_request_id ??
    getObj(o.helpdeskRequest)?.id ??
    getObj(o.helpdesk_request)?.id;
  return toFiniteNumber(direct);
}

function extractAssignedToId(item: unknown): number | null {
  const o = getObj(item);
  if (!o) return null;
  const direct =
    o.assignedToId ??
    o.assigned_to_id ??
    getObj(o.assignedTo)?.id ??
    getObj(getObj(o.assignedTo)?.employee)?.id ??
    getObj(o.employee)?.id;
  return toFiniteNumber(direct);
}

/** แปลง response GET helpdeskrequests/[id] เป็น Ticket — เทียบ ID กับ selecthelpdeskstatus เมื่อส่ง statusIdMap */
function helpdeskDetailToTicket(
  detail: HelpdeskRequestDetail,
  statusIdMap?: Record<number, "doing" | "done" | "waiting">
): Ticket {
  const emp = detail.createdBy?.employee;
  const first = emp?.first_name ?? "";
  const last = emp?.last_name ?? "";
  const requester = [first, last].filter(Boolean).join(" ").trim() || undefined;
  const assignees: Assignee[] = (detail.assignments ?? []).map((a: RawAssignment) => {
    const e = a.assignedTo?.employee ?? a.employee;
    const name = e ? [e.first_name, e.last_name].filter(Boolean).join(" ").trim() : "";
    const statusId = a.helpdeskStatus?.id != null && Number.isFinite(Number(a.helpdeskStatus.id)) ? Number(a.helpdeskStatus.id) : undefined;
    const rawStatus = a.status === "doing" || a.status === "done" || a.status === "waiting" ? a.status : undefined;
    const status =
      rawStatus ??
      (statusId != null
        ? getAssigneeStatusFromId(statusId, statusIdMap)
        : assignmentStatusNameToStatus(a.helpdeskStatus?.name));
    return {
      id: e?.id ?? a.assignedToId ?? a.assignedTo?.id ?? a.id ?? 0,
      name: name || "—",
      status,
      image: e?.empimg ?? undefined,
      phone: e && "tel" in e ? String((e as { tel?: string }).tel ?? "") : undefined,
    };
  });
  return {
    id: detail.id,
    title: detail.ticket?.title ?? "",
    date: detail.createdAt ? formatDateTime(detail.createdAt) : "",
    firstname_req: first || undefined,
    lastname_req: last || undefined,
    requester,
    contactPhone: detail.telephone != null ? String(detail.telephone) : undefined,
    status: detail.helpdeskStatus?.name ?? "",
    priority: detail.priority?.name ?? "ບໍ່ລະບຸ",
    verified: false,
    assignees,
    myAssignments: (detail.assignments ?? [])
      .map((a) => {
        const assignmentId = a.id;
        if (assignmentId == null || !Number.isFinite(assignmentId)) return null;
        const e = a.assignedTo?.employee ?? a.employee;
        const name = e ? [e.first_name, e.last_name].filter(Boolean).join(" ").trim() : "";
        const statusName = a.helpdeskStatus?.name;
        const statusId = a.helpdeskStatus?.id != null && Number.isFinite(Number(a.helpdeskStatus.id)) ? Number(a.helpdeskStatus.id) : undefined;
        const assigneeStatus =
          a.status === "doing" || a.status === "done" || a.status === "waiting"
            ? a.status
            : statusId != null
              ? getAssigneeStatusFromId(statusId, statusIdMap)
              : assignmentStatusNameToStatus(statusName);
        const assignee: Assignee = {
          id: e?.id ?? a.assignedToId ?? a.assignedTo?.id ?? assignmentId,
          name: name || "—",
          status: assigneeStatus,
          image: e?.empimg ?? undefined,
          phone: e && "tel" in e ? String((e as { tel?: string }).tel ?? "") : undefined,
        };
        return { assignmentId, assignee, statusName, statusId };
      })
      .filter((x): x is { assignmentId: number; assignee: Assignee; statusName?: string; statusId?: number } => x !== null),
    assignDate: detail.updatedAt ? formatDateTime(detail.updatedAt) : undefined,
    description: detail.ticket?.description ?? undefined,
    building: detail.building?.name ?? undefined,
    level: detail.floor?.name ?? undefined,
    room: detail.room != null ? String(detail.room) : undefined,
    division: emp?.division?.division_name ?? undefined,
    department: emp?.department?.department_name ?? undefined,
  };
}

type StatusFilterOption = { label: string; value: string; icon?: string } | null;

const ALL_STATUS_OPTION = { label: "ທັງໝົດ", value: "Allin" };

function matchesGlobalFilter(ticket: Ticket, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.toLowerCase().trim();
  return (
    ticket.id.toString().toLowerCase().includes(q) ||
    (ticket.title ?? "").toLowerCase().includes(q) ||
    (ticket.firstname_req ?? "").toLowerCase().includes(q) ||
    (ticket.requester ?? "").toLowerCase().includes(q)
  );
}

function matchesStatusFilter(ticket: Ticket, statusFilter: StatusFilterOption): boolean {
  if (!statusFilter || statusFilter.value === "Allin") return true;
  return (ticket.status ?? "") === statusFilter.value;
}

/** แปลง assignTo string "A, B, C" เป็น Assignee[] */
function assignToToAssignees(assignTo: string, ticketId: string | number): Assignee[] {
  if (!assignTo?.trim()) return [];
  return assignTo.split(",").map((name, i) => ({
    id: `${ticketId}-${i}`,
    name: name.trim(),
    status: "waiting" as const,
  }));
}

/** เช็คว่าชื่อปัจจุบันตรงกับ assignee หรือไม่ (trim, เปรียบเทียบหรือส่วนหนึ่งตรงกัน) */
function isCurrentUserAssignee(assigneeName: string, currentUserDisplayName: string): boolean {
  const a = (assigneeName ?? "").trim();
  const u = (currentUserDisplayName ?? "").trim();
  if (!a || !u) return false;
  return a === u || a.includes(u) || u.includes(a);
}

function buildCurrentAssigneeIdSet(input: Array<unknown>): Set<number> {
  const set = new Set<number>();
  for (const v of input) {
    const n = toFiniteNumber(v);
    if (n != null) set.add(n);
  }
  return set;
}

function isMineAssignee(
  assignee: Pick<Assignee, "id" | "name">,
  currentAssigneeIds: Set<number>,
  currentUserDisplayName: string
): boolean {
  const id = toFiniteNumber(assignee.id);
  if (id != null && currentAssigneeIds.has(id)) return true;
  return isCurrentUserAssignee(assignee.name ?? "", currentUserDisplayName);
}

function isMineTicket(
  ticket: Pick<Ticket, "assignees" | "assignTo">,
  currentAssigneeIds: Set<number>,
  currentUserDisplayName: string
): boolean {
  const list = ticket.assignees ?? [];
  if (list.length > 0) {
    return list.some((a) => isMineAssignee(a, currentAssigneeIds, currentUserDisplayName));
  }
  if (ticket.assignTo) return isCurrentUserAssignee(ticket.assignTo, currentUserDisplayName);
  return false;
}

function isMineAssignment(
  a: RawAssignment,
  currentAssigneeIds: Set<number>,
  currentUserDisplayName: string
): boolean {
  const aid = a.assignedToId ?? a.assignedTo?.id ?? getObj(a.assignedTo?.employee)?.id ?? a.employee?.id;
  const n = toFiniteNumber(aid);
  if (n != null && currentAssigneeIds.has(n)) return true;
  const e = a.assignedTo?.employee ?? a.employee;
  const name = e ? [e.first_name, e.last_name].filter(Boolean).join(" ").trim() : "";
  return isCurrentUserAssignee(name, currentUserDisplayName);
}

/** แปลง response จาก API ให้ตรงกับ Ticket (pageTechn) ถ้าขาดฟิลด์ใส่ default */
function normalizeAssignee(a: unknown): Assignee | null {
  if (a == null || typeof a !== "object") return null;
  const o = a as Record<string, unknown>;
  const status = o.status as string | undefined;
  const validStatus: Assignee["status"] =
    status === "doing" || status === "done" || status === "waiting" ? status : "waiting";
  return {
    id: (o.id as number | string) ?? "",
    name: String(o.name ?? ""),
    image: o.image != null ? String(o.image) : undefined,
    phone: o.phone != null ? String(o.phone) : undefined,
    status: validStatus,
  };
}

function normalizeTicket(raw: Record<string, unknown>): Ticket {
  const assigneesRaw = raw.assignees;
  const assignees: Assignee[] | undefined = Array.isArray(assigneesRaw)
    ? assigneesRaw.map((a) => normalizeAssignee(a)).filter((a): a is Assignee => a !== null)
    : undefined;

  const id = raw.id;
  const ticketId: string | number =
    typeof id === "number" || typeof id === "string" ? id : String(raw.id ?? "");

  return {
    id: ticketId,
    title: String(raw.title ?? ""),
    date: String(raw.date ?? ""),
    firstname_req: raw.firstname_req != null ? String(raw.firstname_req) : undefined,
    requester: raw.requester != null ? String(raw.requester) : undefined,
    assignTo: raw.assignTo != null ? String(raw.assignTo) : undefined,
    assignees,
    assignDate:
      raw.assignDate != null
        ? String(raw.assignDate)
        : (raw.assign_date != null ? String(raw.assign_date) : undefined),
    status: String(raw.status ?? ""),
    priority: String(raw.priority ?? ""),
    verified: Boolean(raw.verified),
    lastname_req: raw.lastname_req != null ? String(raw.lastname_req) : undefined,
    employeeId: raw.employeeId != null ? (typeof raw.employeeId === "number" ? raw.employeeId : String(raw.employeeId)) : undefined,
    description: raw.description != null ? String(raw.description) : undefined,
    category: raw.category != null ? String(raw.category) : undefined,
    building: raw.building != null ? String(raw.building) : undefined,
    level: raw.level != null ? String(raw.level) : undefined,
    room: raw.room != null ? String(raw.room) : undefined,
    division: raw.division != null ? String(raw.division) : undefined,
    department: raw.department != null ? String(raw.department) : undefined,
    contactPhone: raw.contactPhone != null ? String(raw.contactPhone) : undefined,
    email: raw.email != null ? String(raw.email) : undefined,
  };
}

export const useTicketTableTechn = (toastRef?: RefObject<Toast | null>) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterOption>(null);
  const [selectedTickets, setSelectedTickets] = useState<TicketRow[]>([]);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [currentAssignees, setCurrentAssignees] = useState<Assignee[]>([]);
  /** รายการสถานะสำหรับปุ่ม ລາຍລະອຽດ (จาก GET helpdeskstatus/staff) */
  const [staffStatusList, setStaffStatusList] = useState<{ id: number; name: string }[]>([]);

  const { list: statusList } = useHelpdeskStatusOptions();
  const statusOptions = useMemo(
    () => [
      ALL_STATUS_OPTION,
      ...statusList.map((item) => {
        const name = typeof item.name === "string" ? item.name.trim() : String(item.name ?? "").trim();
        return { label: name, value: name };
      }),
    ],
    [statusList]
  );
  /** ID → doing/done/waiting จาก store/helpdesk (selecthelpdeskstatus) */
  const statusIdMap = useHelpdeskStatusStore((s) => s.statusIdMap);

  const roleId = useUserProfileStore((s) => s.currentUser?.roleId ?? 0);
  const currentUser = useUserProfileStore((s) => s.currentUser);
  const fetchUserProfile = useUserProfileStore((s) => s.fetchUserProfile);
  const profileData = useUserProfileStore((s) => s.profileData);
  const currentUserDisplayName = useMemo(
    () =>
      [profileData?.first_name, profileData?.last_name].filter(Boolean).join(" ").trim() ||
      profileData?.fullName ||
      "",
    [profileData]
  );

  const currentAssigneeIds = useMemo(() => {
    const employeeIdFromProfile = profileData?.employeeId != null ? Number(profileData.employeeId) : null;
    return buildCurrentAssigneeIdSet([
      currentUser?.id,
      currentUser?.employeeId,
      currentUser?.employee?.id,
      employeeIdFromProfile,
    ]);
  }, [currentUser?.id, currentUser?.employeeId, currentUser?.employee?.id, profileData?.employeeId]);

  useEffect(() => {
    if (!currentUser) {
      fetchUserProfile().catch(() => {});
    }
  }, [currentUser, fetchUserProfile]);

  /** ดึงรายการสถานะสำหรับปุ่ม ລາຍລະອຽດ (helpdeskstatus/staff) — เมื่อ role 2 หรือ 3 */
  useEffect(() => {
    if (roleId !== 2 && roleId !== 3) return;
    const c = new AbortController();
    axiosClientsHelpDesk
      .get(HELPDESK_ENDPOINTS.STATUS_STAFF, { signal: c.signal })
      .then((res) => {
        const list = normalizeIdNameList(res.data);
        setStaffStatusList(Array.isArray(list) ? list : []);
      })
      .catch((err: unknown) => {
        if (isAbortError(err)) return;
        setStaffStatusList([]);
      });
    return () => c.abort();
  }, [roleId]);

  /** Role 2: /api/tickets. Role 3: helpdeskrequests/admin แล้วกรองเฉพาะที่มอบหมายให้ current user */
  const shouldFetchTicketsRole2 = roleId === 2;
  const shouldFetchTicketsRole3 = roleId === 3;

  /** Role 3: ດຶງລາຍການຈາກ assignments ແລະ helpdeskrequests/[id] — ໃຊ້ທັງໃນ useEffect ແລະໃນ refetch */
  const fetchRole3Tickets = useCallback(async () => {
    if (currentAssigneeIds.size === 0) return;
    setLoading(true);
    try {
      const queryIds = Array.from(
        new Set(
          [currentUser?.id, currentUser?.employeeId, currentUser?.employee?.id]
            .map((v) => toFiniteNumber(v))
            .filter((v): v is number => v != null)
        )
      );

      const fetchAssignmentsOnce = async (assignedToId: number) => {
        const response = await axiosClientsHelpDesk.get(HELPDESK_ENDPOINTS.ASSIGNMENTS, {
          params: { assignedToId },
        });
        return normalizeDataList<AssignmentListItem>(response.data) as unknown[];
      };

      const listA = queryIds[0] != null ? await fetchAssignmentsOnce(queryIds[0]) : [];
      const listB =
        queryIds.length > 1 && queryIds[1] != null
          ? await fetchAssignmentsOnce(queryIds[1])
          : [];
      const combined = [...listA, ...listB];

      const myIds = combined
        .filter((item) => {
          const assignedToId = extractAssignedToId(item);
          if (assignedToId == null) return true;
          return currentAssigneeIds.has(assignedToId);
        })
        .map((item) => extractHelpdeskRequestId(item))
        .filter((id): id is number => id != null);

      const uniqueIds = Array.from(new Set(myIds));
      if (uniqueIds.length === 0) {
        setTickets([]);
        return;
      }
      const details = await Promise.all(
        uniqueIds.map((helpdeskRequestId) =>
          axiosClientsHelpDesk
            .get<HelpdeskRequestDetail>(HELPDESK_ENDPOINTS.requestById(helpdeskRequestId))
            .then((res) => res.data)
        )
      );
      const sorted = (details as HelpdeskRequestDetail[])
        .map((detail) => {
          const t = helpdeskDetailToTicket(detail, statusIdMap);
          const mine = (t.assignees ?? []).filter((a) =>
            isMineAssignee(a, currentAssigneeIds, currentUserDisplayName)
          );
          if (mine.length === 0) return null;
          const mineAssignments = (t.myAssignments ?? []).filter(({ assignee }) =>
            isMineAssignee(assignee, currentAssigneeIds, currentUserDisplayName)
          );
          const assignmentIds = (detail.assignments ?? [])
            .filter((a) => isMineAssignment(a, currentAssigneeIds, currentUserDisplayName))
            .map((a) => a.id)
            .filter((id): id is number => id != null && Number.isFinite(id));
          return { ...t, assignees: mine, assignmentIds, myAssignments: mineAssignments };
        })
        .filter((t): t is Ticket => t !== null)
        .sort((a, b) => Number(b.id) - Number(a.id));
      setTickets(sorted);
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [currentAssigneeIds, currentUser?.id, currentUser?.employeeId, currentUser?.employee?.id, currentUserDisplayName, statusIdMap]);

  const fetchRole2Tickets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await TicketService.getTickets();
      const list = Array.isArray(data) ? data : [];
      setTickets(list.map((item) => normalizeTicket(item as unknown as Record<string, unknown>)));
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!shouldFetchTicketsRole2) {
      if (roleId !== 3) {
        setTickets([]);
        setLoading(false);
      }
      return;
    }
    fetchRole2Tickets();
  }, [shouldFetchTicketsRole2, roleId, fetchRole2Tickets]);

  /**
   * Role 3: ບໍ່ສາມາດເອີ້ນ /api/helpdeskrequests/admin ได้ — ໃຊ້ GET /api/assignments?assignedToId=currentUserId ເພື່ອດຶງລາຍການ helpdeskRequestId ທີ່ມອບໝາຍໃຫ້ຕົນເອງ ແລ້ວເອີ້ນ GET /api/helpdeskrequests/[id] ຕໍ່ລາຍການ.
   */
  useEffect(() => {
    if (!shouldFetchTicketsRole3 || currentAssigneeIds.size === 0) {
      if (roleId === 3) {
        setTickets([]);
        setLoading(false);
      }
      return;
    }
    fetchRole3Tickets();
  }, [shouldFetchTicketsRole3, roleId, currentAssigneeIds, fetchRole3Tickets]);

  const onAcceptSelf = useCallback(async () => {
    const assignmentIds = Array.from(
      new Set(
        selectedTickets
          .map((t) => t.assignmentId)
          .filter((id): id is number => id != null && Number.isFinite(id))
      )
    );
    if (assignmentIds.length === 0) {
      toastRef?.current?.show({
        severity: "warn",
        summary: "ບໍ່ສາມາດຮັບວຽກ",
        detail: "ບໍ່ພົບ assignment id — ກະລຸນາເລືອກແຖວທີ່ສະແດງ checkbox",
        life: 4000,
      });
      return;
    }
    try {
      setLoading(true);
      // Role 3: ส่งครั้งเดียวในรูปแบบ { id: [73, 74, ...] } ตาม Postman — ไม่ส่งหลาย request
      await axiosClientsHelpDesk.put(HELPDESK_ENDPOINTS.ASSIGNMENTS_ACCEPT, { id: assignmentIds });
      setSelectedTickets([]);
      if (roleId === 2) await fetchRole2Tickets();
      else await fetchRole3Tickets();
      toastRef?.current?.show({
        severity: "success",
        summary: "ສຳເລັດ",
        detail: "ຮັບວຽກເອງສຳເລັດ ສະຖານະເປັນກຳລັງດຳເນີນການ",
        life: 3000,
      });
    } catch (err) {
      setLoading(false);
      const res = (err as { response?: { status?: number; data?: unknown } })?.response;
      const status = res?.status;
      const data = res?.data as Record<string, unknown> | undefined;
      const serverMsg =
        typeof data?.message === "string"
          ? data.message
          : typeof data?.error === "string"
            ? data.error
            : "";
      const detail =
        serverMsg ||
        (status ? `ຮັບວຽກເອງບໍ່ສຳເລັດ (${status})` : "ຮັບວຽກເອງບໍ່ສຳເລັດ");
      if (process.env.NODE_ENV === "development" && data) {
        console.error("[assignments/accept] 500 response:", data);
      }
      toastRef?.current?.show({
        severity: "error",
        summary: "ຜິດພາດ",
        detail,
        life: 5000,
      });
    }
  }, [selectedTickets, roleId, fetchRole2Tickets, fetchRole3Tickets, toastRef]);

  const filteredTickets = useMemo(() => {
    return tickets
      .filter((t) => {
        if (!matchesGlobalFilter(t, globalFilter)) return false;
        if (roleId === 3) return true;
        return matchesStatusFilter(t, statusFilter);
      })
      .sort((a, b) => {
        const na = Number(a.id);
        const nb = Number(b.id);
        if (!Number.isNaN(na) && !Number.isNaN(nb)) return nb - na;
        return String(b.id).localeCompare(String(a.id));
      });
  }, [tickets, globalFilter, statusFilter, roleId]);

  const displayRows = useMemo((): TicketRow[] => {
    if (roleId === 3) {
      let rows: TicketRow[] = filteredTickets.flatMap((t) => {
        const mine = t.myAssignments ?? [];
        if (mine.length === 0) return [];
        return mine.map(({ assignmentId, assignee, statusName, statusId }) => ({
          ...t,
          rowId: `assignment-${assignmentId}`,
          assignmentId,
          rowAssignee: assignee,
          assignmentHelpdeskStatusId: statusId,
          status:
            typeof statusName === "string" && statusName.trim()
              ? statusName
              : mapAssigneeStatusToDisplay(assignee.status, STATUS_WAITING_ACCEPT_OPTIONS[0]),
        }));
      });
      const filterValue = statusFilter?.value;
      if (filterValue != null && filterValue !== "Allin" && String(filterValue).trim() !== "") {
        const want = String(filterValue).trim();
        rows = rows.filter((r) => (r.status ?? "").trim() === want);
      }
      return rows;
    }
    return filteredTickets.map((t) => {
      const aid = t.assignmentIds?.[0];
      const rowId = aid != null ? `assignment-${aid}` : String(t.id);
      return { ...t, rowId };
    });
  }, [filteredTickets, roleId, statusFilter]);

  /** ໃຫ້ເບິ່ງ checkbox ເມື່ອສະຖານະ (ID) ເປັນລໍຖ້າຮັບວຽກ — เทียบจาก selecthelpdeskstatus */
  const showCheckbox = useCallback(
    (row: TicketRow): boolean => {
      if (roleId === 1 || roleId === 2) return true;
      if (!isWaitingStatusId(row.assignmentHelpdeskStatusId, statusIdMap)) return false;
      const isMine = row.rowAssignee
        ? isMineAssignee(row.rowAssignee, currentAssigneeIds, currentUserDisplayName)
        : isMineTicket(row, currentAssigneeIds, currentUserDisplayName);
      return isMine;
    },
    [roleId, currentAssigneeIds, currentUserDisplayName, statusIdMap]
  );

  const showAction = useCallback(
    (row: TicketRow): boolean => {
      if (roleId === 1 || roleId === 2) return true;
      if (row.rowAssignee) return isMineAssignee(row.rowAssignee, currentAssigneeIds, currentUserDisplayName);
      return isMineTicket(row, currentAssigneeIds, currentUserDisplayName);
    },
    [roleId, currentAssigneeIds, currentUserDisplayName]
  );

  const getTicketFromRow = useCallback((row: TicketRow): Ticket => {
    const { rowId, rowAssignee, ...ticket } = row;
    return ticket as Ticket;
  }, []);

  const onCheckboxChange = useCallback(
    (e: { checked?: boolean }, rowData: TicketRow) => {
      setSelectedTickets((prev) => {
        const key = rowData.assignmentId != null ? `assignment-${rowData.assignmentId}` : `ticket-${rowData.id}`;
        if (e.checked) {
          if (prev.some((t) => (t.assignmentId != null ? `assignment-${t.assignmentId}` : `ticket-${t.id}`) === key))
            return prev;
          return [...prev, rowData];
        }
        return prev.filter(
          (t) => (t.assignmentId != null ? `assignment-${t.assignmentId}` : `ticket-${t.id}`) !== key
        );
      });
    },
    []
  );

  const onGlobalFilterChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setGlobalFilter(e.target.value);
  }, []);

  const onPriorityChange = useCallback((id: string | number, newPriority: string) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, priority: newPriority } : t))
    );
  }, []);

  const openAssigneeDialog = useCallback((assignees: Assignee[]) => {
    setCurrentAssignees(assignees);
    setDialogVisible(true);
  }, []);

  const closeDialog = useCallback(() => {
    setDialogVisible(false);
  }, []);

  const updateTicketStatus = useCallback(
    async (ticketId: string | number, helpdeskStatusId: number) => {
      const id = Number(ticketId);
      if (!Number.isFinite(id)) return;
      try {
        setLoading(true);
        await axiosClientsHelpDesk.put(HELPDESK_ENDPOINTS.updateHelpdeskStatus(id), { helpdeskStatusId });
        if (roleId === 2) await fetchRole2Tickets();
        else if (roleId === 3) await fetchRole3Tickets();
        toastRef?.current?.show({
          severity: "success",
          summary: "ສຳເລັດ",
          detail: "ອັບເດດສະຖານະສຳເລັດ",
          life: 3000,
        });
      } catch {
        setLoading(false);
        toastRef?.current?.show({
          severity: "error",
          summary: "ຜິດພາດ",
          detail: "ອັບເດດສະຖານະບໍ່ສຳເລັດ",
          life: 4000,
        });
      }
    },
    [roleId, fetchRole2Tickets, fetchRole3Tickets, toastRef]
  );

  return {
    displayRows,
    loading,
    selectedTickets,
    globalFilter,
    onGlobalFilterChange,
    statusFilter,
    setStatusFilter,
    statusOptions,
    onCheckboxChange,
    onPriorityChange,
    dialogVisible,
    currentAssignees,
    openAssigneeDialog,
    closeDialog,
    showCheckbox,
    showAction,
    getTicketFromRow,
    refetch: fetchRole3Tickets,
    onAcceptSelf,
    statusList,
    staffStatusList,
    updateTicketStatus,
  };
};
