// pageAdmin/useTicketTableAdmin.ts
// Role 2 (Admin): ດຶງລາຍການ assignment ທີ່ admin ຮັບວຽກເອງ (assignedToId = currentUserId) ແລ້ວດຶງ GET helpdeskrequests/[id]
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { RefObject } from "react";
import type { Toast } from "primereact/toast";
import axiosClientsHelpDesk from "@/config/axiosClientsHelpDesk";
import { HELPDESK_ENDPOINTS } from "@/config/endpoints";
import { useHelpdeskStatusOptions } from "@/app/hooks/useHelpdeskStatusOptions";
import { normalizeDataList, normalizeIdNameList } from "@/utils/apiNormalizers";
import { formatDateTime } from "@/utils/dateUtils";
import { Ticket, TicketRow, Assignee } from "../pageTechn/types";
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

/** Raw assignment (จาก GET helpdeskrequests/[id]) */
interface RawAssignment {
  id?: number;
  assignedToId?: number;
  helpdeskRequestId?: number;
  assignedTo?: { id?: number; employee?: { id?: number; first_name?: string; last_name?: string; tel?: string; empimg?: string } };
  employee?: { id?: number; first_name?: string; last_name?: string; empimg?: string };
  status?: string;
  helpdeskStatusId?: number;
  helpdeskStatus?: { id?: number; name?: string };
}

/** Response จาก GET helpdeskrequests/[id] */
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
  id?: number;
  helpdeskRequestId?: number;
  assignedToId?: number;
}

/** แปลง response GET helpdeskrequests/[id] เป็น Ticket */
function helpdeskDetailToTicket(detail: HelpdeskRequestDetail): Ticket {
  const emp = detail.createdBy?.employee;
  const first = emp?.first_name ?? "";
  const last = emp?.last_name ?? "";
  const requester = [first, last].filter(Boolean).join(" ").trim() || undefined;
  const assignees: Assignee[] = (detail.assignments ?? []).map((a: RawAssignment) => {
    const e = a.assignedTo?.employee ?? a.employee;
    const name = e ? [e.first_name, e.last_name].filter(Boolean).join(" ").trim() : "";
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
    const assignmentId = Number(a.id ?? NaN);
    if (!Number.isFinite(assignmentId) || assignmentId === 0) return [];
    const e = a.assignedTo?.employee ?? a.employee;
    const name = e ? [e.first_name, e.last_name].filter(Boolean).join(" ").trim() : "";
    const statusName = a.helpdeskStatus?.name;
    const statusId = a.helpdeskStatus?.id != null && Number.isFinite(Number(a.helpdeskStatus.id)) ? Number(a.helpdeskStatus.id) : undefined;
    const assignee: Assignee = {
      id: a.assignedToId ?? a.assignedTo?.id ?? e?.id ?? assignmentId,
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


/** ສະຖານະ id 2 — ລໍຖ້າຮັບວຽກ (ໃຊ້ສະແດງ checkbox ແລະປຸ່ມ ຮັບວຽກເອງ) */
const STATUS_ID_SHOW_CHECKBOX_AND_ACCEPT_SELF = 2;
/** IDs ທີ່ສະແດງໃນ dropdown ລາຍລະອຽດ (ຈາກ /api/helpdeskstatus/admin) */
const DETAIL_STATUS_IDS = new Set([4, 5, 6, 8]);

export const useTicketTableAdmin = (toastRef?: RefObject<Toast | null>) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterOption>(null);
  const [selectedTickets, setSelectedTickets] = useState<Ticket[]>([]);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [currentAssignees, setCurrentAssignees] = useState<Assignee[]>([]);

  const { list: statusList } = useHelpdeskStatusOptions();
  const [adminStatusList, setAdminStatusList] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    let cancelled = false;
    axiosClientsHelpDesk.get(HELPDESK_ENDPOINTS.STATUS_ADMIN).then((res) => {
      if (!cancelled) setAdminStatusList(normalizeIdNameList(res.data).filter((s) => DETAIL_STATUS_IDS.has(s.id)));
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const statusOptions = useMemo(
    () => buildStatusOptions([statusList, adminStatusList], tickets),
    [statusList, adminStatusList, tickets]
  );

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
  const employeeId = profileData?.employeeId != null ? profileData.employeeId : null;

  /** AbortController ref for cancelling in-flight requests on unmount */
  const abortRef = useRef<AbortController | null>(null);

  /** ດຶງລາຍການ assignment ທີ່ admin ຮັບວຽກເອງ */
  const fetchAdminAssignments = useCallback(async () => {
    if (!currentUserId || roleId !== 2) return;
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
      const mine = list.filter((a) => Number(a.assignedToId) === Number(currentUserId));
      /** Map: helpdeskRequestId → assignmentId (source-of-truth ຈາກ GET /api/assignments ເພາະ GET helpdeskrequests/{id} ບໍ່ສົ່ງ assignments[].id) */
      const assignmentIdByRequestId = new Map<number, number>();
      mine.forEach((a) => {
        const reqId = Number(a.helpdeskRequestId);
        const asgId = Number(a.id);
        if (Number.isFinite(reqId) && reqId > 0 && Number.isFinite(asgId) && asgId > 0) {
          assignmentIdByRequestId.set(reqId, asgId);
        }
      });
      const myIds = mine
        .map((a) => a.helpdeskRequestId)
        .filter((id): id is number => typeof id === "number" && Number.isFinite(id));
      const uniqueIds = Array.from(new Set(myIds));
      if (uniqueIds.length === 0) {
        setTickets([]);
        return;
      }
      const BATCH_SIZE = 10;
      const allDetails: HelpdeskRequestDetail[] = [];
      for (let i = 0; i < uniqueIds.length; i += BATCH_SIZE) {
        if (signal.aborted) return;
        const batch = uniqueIds.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.all(
          batch.map((helpdeskRequestId) =>
            axiosClientsHelpDesk
              .get<HelpdeskRequestDetail>(HELPDESK_ENDPOINTS.requestById(helpdeskRequestId), { signal })
              .then((res) => res.data)
              .catch(() => null)
          )
        );
        for (const d of batchResults) {
          if (d != null) allDetails.push(d);
        }
      }
      if (signal.aborted) return;
      const sorted = allDetails.map((d) => {
        const ticket = helpdeskDetailToTicket(d);
        const knownAsgId = assignmentIdByRequestId.get(Number(d.id));
        if (knownAsgId != null && Number.isFinite(knownAsgId)) {
          const alreadyHas = (ticket.myAssignments ?? []).some((m) => m.assignmentId === knownAsgId);
          if (!alreadyHas) {
            ticket.myAssignments = [
              { assignmentId: knownAsgId, assignee: { id: currentUserId, name: "", status: "doing" } },
              ...(ticket.myAssignments ?? []),
            ];
          }
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
  }, [currentUserId, roleId]);

  useEffect(() => {
    if (roleId !== 2 || !currentUserId) {
      setTickets([]);
      setLoading(false);
      return;
    }
    fetchAdminAssignments();
    return () => { abortRef.current?.abort(); };
  }, [roleId, currentUserId, fetchAdminAssignments]);

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

  /** ສ້າງ displayRows — ແຍກແຖວຕາມ assignment ຂອງ current user (ໃຊ້ per-assignment status) */
  const displayRows = useMemo((): TicketRow[] => {
    const rows: TicketRow[] = [];
    for (const t of filteredTickets) {
      const assignees: Assignee[] = t.assignees ?? [];
      if (assignees.length === 0) {
        rows.push({ ...t, rowId: String(t.id) });
      } else {
        const mineOnly = assignees.filter(
          (a) =>
            isCurrentUserByAssigneeId(a.id, currentUserId, employeeId) ||
            isCurrentUserAssignee(a.name, currentUserDisplayName)
        );
        if (mineOnly.length === 0) {
          rows.push({ ...t, rowId: String(t.id) });
        } else {
          mineOnly.forEach((a, i) => {
            const myAssignment = (t.myAssignments ?? []).find(
              (m) => isCurrentUserByAssigneeId(m.assignee.id, currentUserId, employeeId) || m.assignee.id === a.id
            );
            const rowStatusId = myAssignment?.statusId ?? t.statusId;
            rows.push({
              ...t,
              statusId: rowStatusId,
              ticketStatusId: t.statusId,
              rowId: `${t.id}-${a.id}-${i}`,
              rowAssignee: a,
            });
          });
        }
      }
    }
    return filterRowsByStatusId(rows, statusFilterVal);
  }, [filteredTickets, currentUserDisplayName, currentUserId, employeeId, statusFilterVal]);

  /** ສະແດງ checkbox ເມື່ອ assignment ສະຖານະ ລໍຖ້າຮັບວຽກ (id 2) */
  const showCheckbox = useCallback(
    (row: TicketRow): boolean => {
      if (!row.rowAssignee) return false;
      const isMine =
        isCurrentUserByAssigneeId(row.rowAssignee.id, currentUserId, employeeId) ||
        isCurrentUserAssignee(row.rowAssignee.name, currentUserDisplayName);
      if (!isMine) return false;
      return row.statusId === STATUS_ID_SHOW_CHECKBOX_AND_ACCEPT_SELF;
    },
    [currentUserDisplayName, currentUserId, employeeId]
  );

  const showAction = useCallback(
    (row: TicketRow): boolean => {
      if (!row.rowAssignee) return true;
      return (
        isCurrentUserByAssigneeId(row.rowAssignee.id, currentUserId, employeeId) ||
        isCurrentUserAssignee(row.rowAssignee.name, currentUserDisplayName)
      );
    },
    [currentUserDisplayName, currentUserId, employeeId]
  );

  const getTicketFromRow = useCallback((row: TicketRow): Ticket => {
    const { rowId, rowAssignee, ...ticket } = row;
    return ticket as Ticket;
  }, []);

  const onCheckboxChange = useCallback(
    (e: { checked?: boolean }, rowData: TicketRow) => {
      const ticket = getTicketFromRow(rowData);
      setSelectedTickets((prev) => {
        if (e.checked) {
          if (prev.some((t) => String(t.id) === String(ticket.id))) return prev;
          return [...prev, ticket];
        }
        return prev.filter((t) => String(t.id) !== String(ticket.id));
      });
    },
    [getTicketFromRow]
  );

  const onGlobalFilterChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setGlobalFilter(e.target.value);
  }, []);

  /** ປະຕິດບັດ (single ticket): PUT /api/assignments/accept */
  const onAcceptSingleTicket = useCallback(async (ticket: Ticket) => {
    const empId = profileData?.employeeId != null ? Number(profileData.employeeId) : null;
    const list = ticket.myAssignments ?? [];
    const mine = list.filter(
      (m) =>
        Number(m.assignee.id) === Number(currentUserId) ||
        (empId != null && Number(m.assignee.id) === empId)
    );
    const assignmentIds = mine
      .map((m) => m.assignmentId)
      .filter((id): id is number => id != null && Number.isFinite(id) && id > 0);
    const uniqueIds = Array.from(new Set(assignmentIds));
    if (uniqueIds.length === 0) {
      toastRef?.current?.show({
        severity: "warn",
        summary: "ບໍ່ພົບ assignment",
        detail: "ບໍ່ພົບ assignment ທີ່ຮັບວຽກໄດ້",
        life: 4000,
      });
      return;
    }
    try {
      setLoading(true);
      await axiosClientsHelpDesk.put(HELPDESK_ENDPOINTS.ASSIGNMENTS_ACCEPT, { id: uniqueIds });
      await fetchAdminAssignments();
      toastRef?.current?.show({
        severity: "success",
        summary: "ສຳເລັດ",
        detail: "ປະຕິດບັດສຳເລັດ ສະຖານະເປັນກຳລັງດຳເນີນການ",
        life: 3000,
      });
    } catch {
      setLoading(false);
      toastRef?.current?.show({
        severity: "error",
        summary: "ຜິດພາດ",
        detail: "ປະຕິດບັດບໍ່ສຳເລັດ",
        life: 4000,
      });
    }
  }, [currentUserId, profileData?.employeeId, fetchAdminAssignments, toastRef]);

  /** ຮັບວຽກເອງ: PUT /api/assignments/accept */
  const onAcceptSelf = useCallback(async () => {
    const empId = profileData?.employeeId != null ? Number(profileData.employeeId) : null;
    const assignmentIds = selectedTickets.flatMap((t) => {
      const list = t.myAssignments ?? [];
      const mine = list.filter(
        (m) =>
          Number(m.assignee.id) === Number(currentUserId) ||
          (empId != null && Number(m.assignee.id) === empId)
      );
      return mine.map((m) => m.assignmentId).filter((id) => Number.isFinite(id));
    });
    const uniqueIds = Array.from(new Set(assignmentIds));
    if (uniqueIds.length === 0) return;
    try {
      setLoading(true);
      await axiosClientsHelpDesk.put(HELPDESK_ENDPOINTS.ASSIGNMENTS_ACCEPT, { id: uniqueIds });
      setSelectedTickets([]);
      await fetchAdminAssignments();
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
  }, [selectedTickets, currentUserId, profileData?.employeeId, fetchAdminAssignments, toastRef]);

  const openAssigneeDialog = useCallback((assignees: Assignee[]) => {
    setCurrentAssignees(assignees);
    setDialogVisible(true);
  }, []);

  const closeDialog = useCallback(() => {
    setDialogVisible(false);
  }, []);

  /** ອັບເດດສະຖານະ: PUT /api/helpdeskrequests/updatehelpdeskstatus/{id} */
  const updateTicketStatus = useCallback(
    async (ticketId: string | number, helpdeskStatusId: number) => {
      const id = Number(ticketId);
      if (!Number.isFinite(id)) return;
      try {
        setLoading(true);
        await axiosClientsHelpDesk.put(HELPDESK_ENDPOINTS.updateHelpdeskStatus(id), { helpdeskStatusId });
        await fetchAdminAssignments();
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
    [fetchAdminAssignments, toastRef]
  );

  /** ສະແດງປຸ່ມເມື່ອ ticket ທີ່ເລືອກມີ statusId ລໍຖ້າຮັບວຽກ (ຄືກັນກັບ pageTechn) */
  const showReceiveSelfButton = selectedTickets.some(
    (t) => t.statusId === STATUS_ID_SHOW_CHECKBOX_AND_ACCEPT_SELF
  );
  const receiveSelfDisabled = !showReceiveSelfButton;

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
    dialogVisible,
    currentAssignees,
    openAssigneeDialog,
    closeDialog,
    showCheckbox,
    showAction,
    getTicketFromRow,
    refetch: fetchAdminAssignments,
    onAcceptSelf,
    onAcceptSingleTicket,
    statusList,
    updateTicketStatus,
    showReceiveSelfButton,
    receiveSelfDisabled,
    staffStatusList: adminStatusList,
  };
};
