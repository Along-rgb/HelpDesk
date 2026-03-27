// pageTechn/useTicketTableTechn.ts
// Role 2: /tickets (TicketService). Role 3: ดึงรายการ helpdeskRequestId จาก GET /api/assignments (role 3 เรียก admin ไม่ได้) แล้วดึง GET helpdeskrequests/[id] ต่อรายการ
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { RefObject } from "react";
import type { Toast } from "primereact/toast";
import axiosClientsHelpDesk from "@/config/axiosClientsHelpDesk";
import { HELPDESK_ENDPOINTS } from "@/config/endpoints";
import { useHelpdeskStatusOptions } from "@/app/hooks/useHelpdeskStatusOptions";
import { useHelpdeskStatusStaff } from "@/app/hooks/useHelpdeskStatusStaff";
import { normalizeDataList } from "@/utils/apiNormalizers";
import { formatDateTime } from "@/utils/dateUtils";
import { Ticket, TicketRow, Assignee } from "./types";
import { TicketService } from "@/app/services/ticket.service";
import { useUserProfileSelectors } from "@/app/store/user/userProfileStore";
import {
  type StatusFilterOption,
  extractStatusFilterVal,
  matchesGlobalFilter,
  isCurrentUserByAssigneeId,
  isCurrentUserAssignee,
  buildStatusOptions,
  filterRowsByStatusId,
} from "../shared/ticketFilterUtils";

/** ກຳລັງດຳເນີນການ — ໃຊ້ເມື່ອຮັບວຽກເອງ */
const HELPDESK_STATUS_IN_PROGRESS = 2;
/** ສະຖານະ id 2 — ໃຫ້ເບິ່ງ checkbox ແລະປຸ່ມ ຮັບວຽກເອງ ເມື່ອສະຖານະເປັນ id ນີ້ */
const STATUS_ID_SHOW_CHECKBOX_AND_ACCEPT_SELF = 2;
/** ແກ້ໄຂແລ້ວ / ປິດວຽກແລ້ວ — ໃຊ້ເຊື່ອງ checkbox+dropdown ເມື່ອ ticket ມີ >1 assignee */
const TICKET_STATUS_DONE_ID = 4;
const TICKET_STATUS_CLOSED_ID = 7;
const TICKET_STATUS_CANCELLED_ID = 8;

/** Raw assignment (จาก GET helpdeskrequests/[id] หรือจาก assignments API) */
interface RawAssignment {
  id?: number;
  assignedToId?: number;
  helpdeskRequestId?: number;
  assignedTo?: { id?: number; employee?: { id?: number; first_name?: string; last_name?: string; tel?: string; empimg?: string } };
  employee?: { id?: number; first_name?: string; last_name?: string; empimg?: string };
  status?: string;
  /** id ສະຖານະຂອງ assignment ນີ້ (ບໍ່ແມ່ນຂອງ helpdeskRequest) */
  helpdeskStatusId?: number;
  /** ສະຖານະຕໍ່ assignment — ໃຊ້ id ເປີດບັນທັດ name ຈາກ selecthelpdeskstatus */
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

/** Item จาก GET /api/assignments — เก็บ helpdeskStatusId ของช่าง (ບໍ່ແມ່ນຂອງ ticket) */
interface AssignmentListItem {
  id?: number;
  helpdeskRequestId?: number;
  assignedToId?: number;
  /** สถานะ assignment ของช่าง (เช่น 4 = ແກ້ໄຂແລ້ວ) — ใช้เป็น primary source */
  helpdeskStatusId?: number;
  helpdeskStatus?: { id?: number; name?: string };
  assignedAt?: string;
}

/** แปลง response GET helpdeskrequests/[id] เป็น Ticket (เฉพาะ field ที่ pageTechn ใช้) */
function helpdeskDetailToTicket(detail: HelpdeskRequestDetail): Ticket {
  const emp = detail.createdBy?.employee;
  const first = emp?.first_name ?? "";
  const last = emp?.last_name ?? "";
  const requester = [first, last].filter(Boolean).join(" ").trim() || undefined;
  const assignees: Assignee[] = (detail.assignments ?? []).map((a: RawAssignment) => {
    const e = a.assignedTo?.employee ?? a.employee;
    const name = e ? [e.first_name, e.last_name].filter(Boolean).join(" ").trim() : "";
    /** ສະຖານະແຍກຕາມ assignment — ໃຊ້ helpdeskStatusId/helpdeskStatus ຂອງ assignment ນີ້ (ບໍ່ໃຊ້ຂອງ helpdeskRequest) */
    const statusId =
      (a.helpdeskStatus?.id != null && Number.isFinite(Number(a.helpdeskStatus.id)))
        ? Number(a.helpdeskStatus.id)
        : (a.helpdeskStatusId != null && Number.isFinite(Number(a.helpdeskStatusId)))
          ? Number(a.helpdeskStatusId)
          : undefined;
    return {
      id: e?.id ?? a.assignedToId ?? a.assignedTo?.id ?? a.id ?? 0,
      name: name || "—",
      status: (a.status === "doing" || a.status === "done" || a.status === "waiting" ? a.status : "waiting") as Assignee["status"],
      statusId,
      image: e?.empimg ?? undefined,
      phone: e && "tel" in e ? String((e as { tel?: string }).tel ?? "") : undefined,
    };
  });
  const myAssignments = (detail.assignments ?? []).flatMap((a: RawAssignment) => {
    const assignmentId = a.id != null ? Number(a.id) : undefined;
    if (assignmentId == null || !Number.isFinite(assignmentId)) return [];
    const e = a.assignedTo?.employee ?? a.employee;
    const name = e ? [e.first_name, e.last_name].filter(Boolean).join(" ").trim() : "";
    const statusName = a.helpdeskStatus?.name;
    const statusId = a.helpdeskStatus?.id != null && Number.isFinite(Number(a.helpdeskStatus.id)) ? Number(a.helpdeskStatus.id) : undefined;
    const assignee: Assignee = {
      id: e?.id ?? a.assignedToId ?? a.assignedTo?.id ?? assignmentId,
      name: name || "—",
      status: (a.status === "doing" || a.status === "done" || a.status === "waiting" ? a.status : "waiting") as Assignee["status"],
      image: e?.empimg ?? undefined,
      phone: e && "tel" in e ? String((e as { tel?: string }).tel ?? "") : undefined,
    };
    const item: { assignmentId: number; assignee: Assignee; statusName?: string; statusId?: number } = {
      assignmentId,
      assignee,
    };
    if (statusName !== undefined) item.statusName = statusName;
    if (statusId !== undefined) item.statusId = statusId;
    return [item];
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
    statusId: detail.helpdeskStatus?.id != null && Number.isFinite(Number(detail.helpdeskStatus.id)) ? Number(detail.helpdeskStatus.id) : undefined,
    priority: detail.priority?.name ?? "ບໍ່ລະບຸ",
    verified: false,
    assignees,
    myAssignments,
    assignDate: detail.updatedAt ? formatDateTime(detail.updatedAt) : undefined,
    description: detail.ticket?.description ?? undefined,
    building: detail.building?.name ?? undefined,
    level: detail.floor?.name ?? undefined,
    room: detail.room != null ? String(detail.room) : undefined,
    division: emp?.division?.division_name ?? undefined,
    department: emp?.department?.department_name ?? undefined,
  };
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
  const [selectedTickets, setSelectedTickets] = useState<Ticket[]>([]);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [currentAssignees, setCurrentAssignees] = useState<Assignee[]>([]);

  const { list: statusList } = useHelpdeskStatusOptions();
  const { list: staffStatusList } = useHelpdeskStatusStaff();
  
  const resolveStaffStatusName = useCallback((statusId: number | undefined) => {
    if (!statusId) return "ລໍຖ້າຮັບວຽກ";
    const found = staffStatusList.find(s => s.id === statusId);
    return found ? found.name : "ລໍຖ້າຮັບວຽກ";
  }, [staffStatusList]);

  const { roleId: _roleId, currentUserId: _currentUserId, profileData } = useUserProfileSelectors();
  const roleId = _roleId ?? 0;
  const currentUserId = _currentUserId ?? 0;
  const currentUserDisplayName = useMemo(
    () =>
      [profileData?.first_name, profileData?.last_name].filter(Boolean).join(" ").trim() ||
      profileData?.fullName ||
      "",
    [profileData]
  );

  const statusOptions = useMemo(
    () => {
      // Role 3: ใช้ statusList (จาก /api/helpdeskstatus/selecthelpdeskstatus) สำหรับ dropdown filter
      if (roleId === 3) {
        return buildStatusOptions([statusList], []);
      }
      return buildStatusOptions([statusList], tickets);
    },
    [statusList, roleId, tickets]
  );

  /** Role 2: /api/tickets. Role 3: helpdeskrequests/admin แล้วกรองเฉพาะที่มอบหมายให้ current user */
  const shouldFetchTicketsRole2 = roleId === 2;
  const shouldFetchTicketsRole3 = roleId === 3;

  /** AbortController ref for cancelling in-flight requests on unmount */
  const abortRef = useRef<AbortController | null>(null);
  /** Map: helpdeskRequestId → assignmentId (ຈາກ GET /api/assignments — source of truth ສຳລັບ ຮັບວຽກເອງ) */
  const assignmentIdMapRef = useRef<Map<number, number>>(new Map());

  /** Role 3: ດຶງລາຍການຈາກ assignments ແລະ helpdeskrequests/[id] — ແຕ່ລະ user ເບິ່ງແຕ່ຂໍ້ມູນທີ່ມອບໝາຍໃຫ້ assignedToId = currentUser.id ເທົ່ານັ້ນ */
  const fetchRole3Tickets = useCallback(async () => {
    if (!currentUserId) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const signal = controller.signal;
    setLoading(true);
    try {
      const response = await axiosClientsHelpDesk.get(HELPDESK_ENDPOINTS.ASSIGNMENTS, {
        params: { assignedToId: currentUserId },
        signal,
      });
      const raw = response.data;
      let list = normalizeDataList<AssignmentListItem>(raw);
      if (list.length === 0 && raw != null && typeof raw === "object" && !Array.isArray(raw) && "helpdeskRequestId" in raw) {
        list = [raw as AssignmentListItem];
      }
      const mine = list;

      /** Map: helpdeskRequestId → Techn's own assignment status (authoritative from assignments list)
       * Safe to key by helpdeskRequestId since this list is already filtered by assignedToId=currentUserId
       * — at most one assignment per ticket for the current user */
      const techStatusMap = new Map<number, { statusId?: number; statusName?: string; assignedAt?: string }>();
      assignmentIdMapRef.current = new Map<number, number>();
      for (const a of mine) {
        if (a.helpdeskRequestId != null) {
          const sId = a.helpdeskStatus?.id ?? a.helpdeskStatusId;
          techStatusMap.set(a.helpdeskRequestId, {
            statusId: sId != null && Number.isFinite(Number(sId)) ? Number(sId) : undefined,
            statusName: a.helpdeskStatus?.name,
            assignedAt: a.assignedAt,
          });
          const aId = a.id != null ? Number(a.id) : NaN;
          const rId = Number(a.helpdeskRequestId);
          if (Number.isFinite(aId) && Number.isFinite(rId)) {
            assignmentIdMapRef.current.set(rId, aId);
          }
        }
      }

      const myIds = mine
        .map((a) => a.helpdeskRequestId)
        .filter((id): id is number => typeof id === "number" && Number.isFinite(id));
      const uniqueIds = Array.from(new Set(myIds));
      if (uniqueIds.length === 0) {
        setTickets([]);
        return;
      }
      /** Parallel batching: fetch in groups of 10 to avoid overwhelming the server */
      const BATCH_SIZE = 10;
      const allDetails: { detail: HelpdeskRequestDetail; helpdeskRequestId: number }[] = [];
      for (let i = 0; i < uniqueIds.length; i += BATCH_SIZE) {
        if (signal.aborted) return;
        const batch = uniqueIds.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.all(
          batch.map((helpdeskRequestId) =>
            axiosClientsHelpDesk
              .get<HelpdeskRequestDetail>(HELPDESK_ENDPOINTS.requestById(helpdeskRequestId), { signal })
              .then((res) => ({ detail: res.data, helpdeskRequestId }))
              .catch(() => null)
          )
        );
        for (const r of batchResults) {
          if (r != null) allDetails.push(r);
        }
      }
      if (signal.aborted) return;
      const sorted = allDetails.map(({ detail: d, helpdeskRequestId }) => {
        const ticket = helpdeskDetailToTicket(d);
        /** Use helpdeskRequestId (the exact key stored in techStatusMap) — never rely on d.id which may differ */
        const techStatus = techStatusMap.get(helpdeskRequestId);
        if (techStatus) {
          if (techStatus.statusId != null) ticket.myStatusId = techStatus.statusId;
          if (techStatus.statusName) ticket.myStatusName = techStatus.statusName;
          if (techStatus.assignedAt) ticket.assignDate = formatDateTime(techStatus.assignedAt);
        }
        return ticket;
      }).sort((a, b) => Number(b.id) - Number(a.id));
      setTickets(sorted);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

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
   * Role 3: ບໍ່ສາມາດເອີ້ນ /api/helpdeskrequests/admin ได้ — ໃຊ້ GET /api/assignments?assignedToId=currentUserId ເພື່ອດຶງລາຍການຂອງແຕ່ລະ user ເທົ່ານັ້ນ.
   */
  useEffect(() => {
    if (!shouldFetchTicketsRole3 || !currentUserId) {
      if (roleId === 3) {
        setTickets([]);
        setLoading(false);
      }
      return;
    }
    fetchRole3Tickets();
    return () => { abortRef.current?.abort(); };
  }, [shouldFetchTicketsRole3, currentUserId, fetchRole3Tickets, roleId]);

  const onAcceptSelf = useCallback(async () => {
    const assignmentIds = selectedTickets.flatMap((t) => {
      const rId = Number(t.id);
      const aId = assignmentIdMapRef.current.get(rId);
      return aId != null ? [aId] : [];
    });
    const uniqueIds = Array.from(new Set(assignmentIds));
    if (uniqueIds.length === 0) {
      toastRef?.current?.show({
        severity: "warn",
        summary: "ບໍ່ພົບຂໍ້ມູນ",
        detail: "ບໍ່ພົບ assignment ທີ່ຮັບວຽກໄດ້ — ກະລຸນາລອງໃໝ່",
        life: 4000,
      });
      return;
    }
    try {
      setLoading(true);
      await axiosClientsHelpDesk.put(HELPDESK_ENDPOINTS.ASSIGNMENTS_ACCEPT, { id: uniqueIds });
      setSelectedTickets([]);
      await fetchRole3Tickets();
      toastRef?.current?.show({
        severity: "success",
        summary: "ສຳເລັດ",
        detail: "ຮັບວຽກເອງສຳເລັດ ສະຖານະເປັນກຳລັງດຳເນີນການ",
        life: 3000,
      });
    } catch {
      setLoading(false);
      toastRef?.current?.show({
        severity: "error",
        summary: "ຜິດພາດ",
        detail: "ຮັບວຽກເອງບໍ່ສຳເລັດ",
        life: 4000,
      });
    }
  }, [selectedTickets, fetchRole3Tickets, toastRef]);

  /** ດຶງຄ່າ filter — ຮອງຮັບທັງ PrimeReact string value ແລະ object { value } */
  const statusFilterVal = extractStatusFilterVal(statusFilter);

  const filteredTickets = useMemo(() => {
    return tickets
      .filter((t) => matchesGlobalFilter(t, globalFilter))
      .sort((a, b) => {
        const na = Number(a.id);
        const nb = Number(b.id);
        if (!Number.isNaN(na) && !Number.isNaN(nb)) return nb - na;
        return String(b.id).localeCompare(String(a.id));
      });
  }, [tickets, globalFilter]);

  const employeeId = profileData?.employeeId != null ? profileData.employeeId : null;

  const displayRows = useMemo((): TicketRow[] => {
    if (roleId !== 3) {
      const rows = filteredTickets.map((t) => ({ ...t, rowId: String(t.id) }));
      return filterRowsByStatusId(rows, statusFilterVal);
    }

    const rows: TicketRow[] = [];
    for (const t of filteredTickets) {
      // Role 3: 1 row per ticket, statusId = Techn's own status (myStatusId) from assignments list
      rows.push({
        ...t,
        statusId: t.myStatusId,
        ticketStatusId: t.statusId,
        rowId: String(t.id),
      });
    }
    /** Role 3: ກັ່ນຕອງຕາມສະຖານະຂອງ assignment ຂອງຕົນເອງ */
    return filterRowsByStatusId(rows, statusFilterVal);
  }, [filteredTickets, roleId, statusFilterVal]);

  /** ສຳລັບ role 3: ໃຫ້ເບິ່ງ checkbox ແລະປຸ່ມ ຮັບວຽກເອງ ເມື່ອ:
   * - ສະຖານະ assignment (row.statusId) ເປັນ ລໍຖ້າຮັບວຽກ (id 2) ແລະ
   * - ສະຖານະ ticket (row.ticketStatusId) ບໍ່ໃຊ່ ປິດວຽກແລ້ວ
   */
  const showCheckbox = useCallback(
    (row: TicketRow): boolean => {
      if (roleId === 1 || roleId === 2) return true;
      const tStatusId = row.ticketStatusId ?? row.statusId;
      if (tStatusId === TICKET_STATUS_CLOSED_ID || tStatusId === TICKET_STATUS_CANCELLED_ID) return false;
      return row.statusId === STATUS_ID_SHOW_CHECKBOX_AND_ACCEPT_SELF;
    },
    [roleId]
  );

  const showAction = useCallback(
    (_row: TicketRow): boolean => {
      return true;
    },
    []
  );

  const getTicketFromRow = useCallback((row: TicketRow): Ticket => {
    const { rowId, rowAssignee, ...ticket } = row;
    return ticket as Ticket;
  }, []);

  const onCheckboxChange = useCallback(
    (_e: unknown, rowData: TicketRow) => {
      const ticket = getTicketFromRow(rowData);
      setSelectedTickets((prev) => {
        const isSelected = prev.some((t) => String(t.id) === String(ticket.id));
        if (isSelected) {
          return prev.filter((t) => String(t.id) !== String(ticket.id));
        }
        return [...prev, ticket];
      });
    },
    [getTicketFromRow]
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

        // Role 3: update assignment status (technician's own status), not ticket status
        if (roleId === 3) {
          const assignmentId = assignmentIdMapRef.current.get(id);
          if (!assignmentId) {
            throw new Error("ບໍ່ພົບ assignmentId ຂອງຜູ້ໃຊ້");
          }
          // PUT /api/assignments/:id ด้วย helpdeskStatusId ใน FormData
          const formData = new FormData();
          formData.append("helpdeskStatusId", String(helpdeskStatusId));
          await axiosClientsHelpDesk.put(
            `${HELPDESK_ENDPOINTS.ASSIGNMENTS}/${assignmentId}`,
            formData
          );
        } else {
          // Role 1/2: update ticket status as before
          await axiosClientsHelpDesk.put(HELPDESK_ENDPOINTS.updateHelpdeskStatus(id), { helpdeskStatusId });
        }

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

  const receiveSelfDisabled = roleId === 3 ? selectedTickets.length === 0 : true;

  const getAssignmentIdForTicket = useCallback(
    (ticketId: string | number): number | undefined => assignmentIdMapRef.current.get(Number(ticketId)),
    []
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
    updateTicketStatus,
    roleId,
    showReceiveSelfButton: roleId === 3,
    receiveSelfDisabled,
    staffStatusList,
    getAssignmentIdForTicket,
  };
};
