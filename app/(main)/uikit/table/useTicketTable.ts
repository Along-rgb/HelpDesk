// table/useTicketTable.ts
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { RefObject } from "react";
import type { Toast } from "primereact/toast";
import axiosClientsHelpDesk from "@/config/axiosClientsHelpDesk";
import { HELPDESK_ENDPOINTS } from "@/config/endpoints";
import { useHelpdeskStatusOptions } from "@/app/hooks/useHelpdeskStatusOptions";
import { normalizeDataList, normalizeIdNameList } from "@/utils/apiNormalizers";
import { formatDateTime } from "@/utils/dateUtils";
import { Ticket, Assignee } from "./types";
import { useUserProfileSelectors } from "@/app/store/user/userProfileStore";
import {
  type StatusFilterOption,
  extractStatusFilterVal,
  matchesGlobalFilter,
  buildStatusOptions,
} from "../shared/ticketFilterUtils";
import type { HelpdeskRequestRow, AdminAssignUserRow, HeadCategorySelectRow, AssigneeOption, StatusOption } from "./types";
import { normalizeHelpdeskRow } from "./normalizeHelpdeskRow";
import { useUserRoleAndId } from "@/app/store/user/userProfileStore";
import { getApiErrorMessage } from "@/utils/errorMessage";

const STAFF_ROLE_ID = 3;
/** Role 3 (Staff) — ເກັບສະເພາະ Staff ໃນ assignOptions */
const ROLE_IDS_FOR_ASSIGN_OPTIONS = [3] as const;
const STAFF_HEAD_CATEGORY_TAB_INDEX = 1;
/** ສະຖານະຫຼັງມອບໝາຍວຽກ — ກຳລັງດຳເນີນການ (auto ເມື່ອມອບໝາຍວຽກແລ້ວ) */
const HELPDESK_STATUS_IN_PROGRESS = 2;
/** ສະຖານະ id 1 — ໃຫ້ແຖບ checkbox ເມື່ອສະຖານະເປັນ id ນີ້ (logic เดิม) */
const STATUS_ID_SHOW_CHECKBOX = 1;
const TECHNICIAN_ROLE_ID = 2;
const ADMIN_ROLE_ID = 1;
/** ສະຖານະທີ່ຕ້ອງສະແດງ SolutionViewDialog ກ່ອນຢືນຢັນ (4=ແກ້ໄຂ, 5=ສົ່ງນອກ, 6=ພັກ, 8=ຍົກເລີກ) */
const SOLUTION_VIEW_STATUS_IDS = new Set<number>([4, 5, 6, 8]);
/** Role 2 ไม่มีสิทธิ์ GET prioritys — ใช้รายการ fallback เพื่อให้เลือกได้ */
const ROLE_ID_NO_PRIORITY_LIST = 2;
const FALLBACK_PRIORITY_OPTIONS: { id: number; name: string }[] = [
  { id: 0, name: "ບໍ່ລະບຸ" },
  { id: 1, name: "ທຳມະດາ" },
  { id: 2, name: "ສູງ" },
  { id: 3, name: "ກາງ" },
  { id: 4, name: "ຕ່ຳ" },
];


/** สร้าง map id → label (ชื่อ) จาก assignOptions; ใส่ทั้ง user id และ employeeId เพื่อ lookup ได้ไม่ว่า ticket จะส่ง id แบบไหน */
function buildStaffLabelMap(options: AssigneeOption[]): Map<number, string> {
  const map = new Map<number, string>();
  for (const o of options) {
    if (o.label) map.set(o.id, o.label);
    if (o.employeeId != null && Number.isFinite(Number(o.employeeId))) map.set(Number(o.employeeId), o.label);
  }
  return map;
}

/** สร้าง map id → emp_code จาก assignOptions; ใส่ทั้ง User ID (o.id) ແລະ Employee ID (o.employeeId) ເພື່ອ lookup */
function buildStaffEmpCodeMap(options: AssigneeOption[]): Map<number, string> {
  const map = new Map<number, string>();
  for (const o of options) {
    const code = o.emp_code != null && String(o.emp_code).trim() !== "" ? String(o.emp_code).trim() : null;
    if (!code) continue;
    map.set(o.id, code);
    if (o.employeeId != null && Number.isFinite(Number(o.employeeId))) map.set(Number(o.employeeId), code);
  }
  return map;
}

/** สร้าง map id → image, id → phone จาก assignOptions (รองรับ User ID ແລະ Employee ID) */
function buildStaffImageMap(options: AssigneeOption[]): Map<number, string> {
  const map = new Map<number, string>();
  for (const o of options) {
    if (o.image != null && String(o.image).trim() !== "") {
      map.set(o.id, String(o.image).trim());
      if (o.employeeId != null && Number.isFinite(Number(o.employeeId))) map.set(Number(o.employeeId), String(o.image).trim());
    }
  }
  return map;
}

function buildStaffPhoneMap(options: AssigneeOption[]): Map<number, string> {
  const map = new Map<number, string>();
  for (const o of options) {
    if (o.phone != null && String(o.phone).trim() !== "") {
      map.set(o.id, String(o.phone).trim());
      if (o.employeeId != null && Number.isFinite(Number(o.employeeId))) map.set(Number(o.employeeId), String(o.phone).trim());
    }
  }
  return map;
}

/** ເງື່ອນໄຂແຖບ checkbox (role 2): ໃຫ້ເບິ່ງແຖບເມື່ອ ສະຖານະ ເປັນ id 1 ເທົ່ານັ້ນ */
function canReceiveSelf(t: Ticket): boolean {
  const statusId = t.statusId ?? (t._raw?.helpdeskStatus?.id != null ? Number(t._raw.helpdeskStatus.id) : undefined);
  return statusId === STATUS_ID_SHOW_CHECKBOX;
}

export const useTicketTable = (toastRef?: RefObject<Toast | null>) => {
  const { roleId, currentUserId } = useUserRoleAndId();
  /** รายการสถานะสำหรับ dropdown ເລືອກສະຖານະ (filter) — จาก helpdeskstatus/selecthelpdeskstatus */
  const { list: statusListForFilter } = useHelpdeskStatusOptions();
  /** รายการสถานะจาก helpdeskstatus/admin สำหรับ dropdown ລາຍລະອຽດ (ปุ่มในแต่ละแถว) */
  const [statusList, setStatusList] = useState<{ id: number; name: string }[]>([]);
  /** รายการสถานะจาก helpdeskstatus/selecthelpdeskstatus สำหรับ AssigneeDialog (Modal ສະຖານະຊ່າງ) */
  const [statusListForModal, setStatusListForModal] = useState<{ id: number; name: string }[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterOption | null>(null);
  const [assignFilter, setAssignFilter] = useState<AssigneeOption[] | null>(null);
  const [selectedTickets, setSelectedTickets] = useState<Ticket[]>([]);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [currentAssignees, setCurrentAssignees] = useState<Assignee[]>([]);
  const [currentTicketStatus, setCurrentTicketStatus] = useState<string | null>(null);
  const [assignOptions, setAssignOptions] = useState<AssigneeOption[]>([]);
  const [assignmentSectionTitle, setAssignmentSectionTitle] = useState<string>("ມອບໝາຍໃຫ້");
  const [priorityOptions, setPriorityOptions] = useState<{ id: number; name: string }[]>([]);
  const [initDone, setInitDone] = useState(false);
  const [solutionDialogVisible, setSolutionDialogVisible] = useState(false);
  const [solutionDialogData, setSolutionDialogData] = useState<{
    ticketId: number | string;
    ticketTitle: string;
    targetStatusId: number;
    targetStatusName: string;
    assignees: Assignee[];
    /** ເຊື່ອງປຸ່ມ ບັນທຶກ — ໃຊ້ເມື່ອ ຍົກເລີກ ແລະ ຊ່າງຍັງບໍ່ຄົບທັງໝົດ */
    hideConfirm?: boolean;
  } | null>(null);

  /**
   * Parallel init: fire metadata + ticket fetch simultaneously.
   * Both streams run in parallel — no waterfall.
   */
  useEffect(() => {
    let cancelled = false;

    const doInit = async () => {
      const [statusAdminRes, statusSelectRes, assignRes, priorityRes] = await Promise.allSettled([
        axiosClientsHelpDesk.get(HELPDESK_ENDPOINTS.STATUS_ADMIN),
        axiosClientsHelpDesk.get(HELPDESK_ENDPOINTS.STATUS_SELECT),
        axiosClientsHelpDesk.get(HELPDESK_ENDPOINTS.USERS_ADMINASSIGN),
        roleId !== ROLE_ID_NO_PRIORITY_LIST
          ? axiosClientsHelpDesk.get(HELPDESK_ENDPOINTS.PRIORITY)
          : Promise.resolve({ data: FALLBACK_PRIORITY_OPTIONS }),
      ]);
      if (cancelled) return;

      if (statusAdminRes.status === 'fulfilled') {
        setStatusList(normalizeIdNameList(statusAdminRes.value?.data ?? []));
      }
      if (statusSelectRes.status === 'fulfilled') {
        setStatusListForModal(normalizeIdNameList(statusSelectRes.value?.data ?? []));
      }
      if (assignRes.status === 'fulfilled') {
        const raw = assignRes.value?.data;
        const list: AdminAssignUserRow[] = Array.isArray(raw)
          ? (raw as AdminAssignUserRow[])
          : normalizeDataList<AdminAssignUserRow>(raw);
        const filtered = list.filter(
          (u) => u.roleId == null || ROLE_IDS_FOR_ASSIGN_OPTIONS.includes(Number(u.roleId) as 3)
        );
        setAssignOptions(filtered.map((u) => {
          const first = u.employee?.first_name ?? "";
          const last = u.employee?.last_name ?? "";
          const label = [first, last].filter(Boolean).join(" ").trim() || String(u.id);
          const emp_codeRaw = u.employee?.emp_code ?? u.username ?? (u as { emp_code?: string }).emp_code;
          const emp_code = emp_codeRaw != null && String(emp_codeRaw).trim() !== "" ? String(emp_codeRaw).trim() : undefined;
          const employeeId = u.employeeId ?? u.employee?.id;
          const image = u.employee?.empimg != null && String(u.employee.empimg).trim() !== "" ? String(u.employee.empimg).trim() : undefined;
          const phone = u.employee?.tel != null && String(u.employee.tel).trim() !== "" ? String(u.employee.tel).trim() : undefined;
          return { id: u.id, label, emp_code, employeeId, image, phone };
        }));
      }
      if (priorityRes.status === 'fulfilled') {
        const data = priorityRes.value?.data;
        if (Array.isArray(data) && data.length > 0 && data[0]?.id != null) {
          setPriorityOptions(data as { id: number; name: string }[]);
        } else {
          const list = normalizeIdNameList(data);
          setPriorityOptions(list.length > 0 ? list : FALLBACK_PRIORITY_OPTIONS);
        }
      } else {
        setPriorityOptions(FALLBACK_PRIORITY_OPTIONS);
      }
      setInitDone(true);
    };

    /** Fire both streams simultaneously — tickets don't wait for metadata */
    doInit();
    fetchDataRef.current();

    return () => { cancelled = true; };
  }, [roleId]);

  /** ตัวเลือกสำหรับ dropdown ເລືອກສະຖານະ (filter) — value = String(id) ເພື່ອ filter ດ້ວຍ ID */
  const statusOptions: StatusOption[] = useMemo(
    () => buildStatusOptions([statusListForFilter, statusList], tickets),
    [statusListForFilter, statusList, tickets]
  );

  const filterTickets = useCallback((data: Ticket[], filterValue: string, statusVal: string | null) => {
    let out = data;
    if (filterValue) {
      out = out.filter((t) => matchesGlobalFilter(t, filterValue));
    }
    if (statusVal && statusVal !== "Allin") {
      const sid = Number(statusVal);
      out = out.filter((t) => Number(t.statusId) === sid);
    }
    return out;
  }, []);

  /** Memoize staff lookup Maps — rebuilt only when assignOptions changes */
  const staffMaps = useMemo(() => ({
    labelMap: buildStaffLabelMap(assignOptions),
    empCodeMap: buildStaffEmpCodeMap(assignOptions),
    imageMap: buildStaffImageMap(assignOptions),
    phoneMap: buildStaffPhoneMap(assignOptions),
  }), [assignOptions]);

  /** Enrich ticket assignees with staff lookup data */
  const enrichTickets = useCallback((list: Ticket[]): Ticket[] => {
    return list.map((t) => ({
      ...t,
      assignees: (t.assignees ?? []).map((a) => {
        const key = Number(a.id);
        const enrichedEmpCode = a.emp_code?.trim() || staffMaps.empCodeMap.get(key);
        return {
          ...a,
          name: !a.name || a.name === "—" || !a.name.trim() ? staffMaps.labelMap.get(key) ?? a.name : a.name,
          emp_code: enrichedEmpCode != null && enrichedEmpCode !== "" ? enrichedEmpCode : a.emp_code,
          image: a.image ?? staffMaps.imageMap.get(key),
          phone: a.phone ?? staffMaps.phoneMap.get(key),
        };
      }),
    }));
  }, [staffMaps]);

  /**
   * Use a ref so fetchData is stable and does NOT change when assignOptions loads.
   * This prevents the double-fetch bug where tickets were fetched twice on mount.
   */
  const enrichTicketsRef = useRef(enrichTickets);
  enrichTicketsRef.current = enrichTickets;

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    axiosClientsHelpDesk
      .get(HELPDESK_ENDPOINTS.REQUESTS_ADMIN)
      .then((response) => {
        const rawList = normalizeDataList<HelpdeskRequestRow>(response.data);
        const list = rawList.map(normalizeHelpdeskRow).sort((a, b) => Number(b.id) - Number(a.id));
        const enriched = enrichTicketsRef.current(list);
        setTickets(enriched);
      })
      .catch((err: unknown) => {
        setError(getApiErrorMessage(err, "ເກີດຂໍ້ຜິດພາດໃນການໂຫຼດຂໍ້ມູນ"));
        setTickets([]);
      })
      .finally(() => setLoading(false));
  }, []);

  /** Stable ref so the init effect can call fetchData without a dep cycle */
  const fetchDataRef = useRef(fetchData);
  fetchDataRef.current = fetchData;

  /** Re-enrich existing tickets in-place when staffMaps changes (no refetch) */
  useEffect(() => {
    setTickets((prev) => prev.length > 0 ? enrichTickets(prev) : prev);
  }, [enrichTickets]);

  /** ດຶງຄ່າ filter — ຮອງຮັບທັງ PrimeReact string value ແລະ object { value } */
  const statusFilterVal = extractStatusFilterVal(statusFilter);

  /** Derived filtered tickets — no separate state or effect needed */
  const filteredTickets = useMemo(
    () => filterTickets(tickets, globalFilter, statusFilterVal),
    [tickets, globalFilter, statusFilterVal, filterTickets]
  );

  const onCheckboxChange = useCallback((e: { checked?: boolean }, rowData: Ticket) => {
    if (e.checked) setSelectedTickets((prev) => [...prev, rowData]);
    else setSelectedTickets((prev) => prev.filter((t) => t.id !== rowData.id));
  }, []);

  const onGlobalFilterChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setGlobalFilter(e.target.value);
  }, []);

  const onPriorityChange = async (
    id: string | number,
    priority: { id: number; name: string }
  ) => {
    const helpdeskRequestId = Number(id);
    if (!Number.isFinite(helpdeskRequestId)) return;
    const priorityId = Number(priority?.id);
    const priorityName = typeof priority?.name === "string" ? priority.name.trim() : "";
    if (!Number.isFinite(priorityId) || !priorityName) return;
    setTickets((prev) =>
      prev.map((t) =>
        Number(t.id) === helpdeskRequestId ? { ...t, priority: priorityName, priorityId } : t
      )
    );
    try {
      setLoading(true);
      await axiosClientsHelpDesk.put(HELPDESK_ENDPOINTS.updatePriority(helpdeskRequestId), {
        priorityId,
      });
      await fetchData();
    } catch {
      setLoading(false);
      fetchData();
    }
  };

  const onBulkAssign = async () => {
    if (!assignFilter?.length || selectedTickets.length === 0) return;
    const assignedToId = assignFilter
      .map((item: AssigneeOption | unknown) => (item as AssigneeOption)?.id)
      .filter((id): id is number => typeof id === "number");
    if (assignedToId.length === 0) return;
    const helpdeskRequestIds = selectedTickets
      .map((t) => Number(t.id))
      .filter((id): id is number => Number.isFinite(id));
    if (helpdeskRequestIds.length === 0) return;
    try {
      setLoading(true);
      await axiosClientsHelpDesk.post(HELPDESK_ENDPOINTS.ASSIGNMENTS, {
        helpdeskRequestId: helpdeskRequestIds,
        assignedToId,
      });
      await Promise.all(
        helpdeskRequestIds.map((id) =>
          axiosClientsHelpDesk.put(HELPDESK_ENDPOINTS.updateHelpdeskStatus(id), { helpdeskStatusId: HELPDESK_STATUS_IN_PROGRESS })
        )
      );
      await fetchData();
      setAssignFilter(null);
      setSelectedTickets([]);
      toastRef?.current?.show({
        severity: "success",
        summary: "ສຳເລັດ",
        detail: "ມອບໝາຍວຽກສຳເລັດ",
        life: 3000,
      });
    } catch {
      setLoading(false);
      toastRef?.current?.show({
        severity: "error",
        summary: "ຜິດພາດ",
        detail: "ມອບໝາຍວຽກບໍ່ສຳເລັດ",
        life: 4000,
      });
    }
  };

  /** ຮັບວຽກເອງ (Admin): PUT /api/helpdeskrequests/updatehelpdeskstatus/{id} — helpdeskStatusId 3 */
  const onReceiveTaskSelf = useCallback(async () => {
    if ((roleId !== TECHNICIAN_ROLE_ID && roleId !== ADMIN_ROLE_ID) || currentUserId == null) return;
    const eligible = selectedTickets.filter(canReceiveSelf);
    const helpdeskRequestIds = eligible.map((t) => Number(t.id)).filter((id): id is number => Number.isFinite(id));
    if (helpdeskRequestIds.length === 0) {
      toastRef?.current?.show({
        severity: "warn",
        summary: "ເລືອກຫົວຂໍ້",
        detail: "ເລືອກຫົວຂໍ້ທີ່ສະຖານະ ລໍຖ້າຮັບວຽກ ແລະ ຍັງບໍ່ມີຄົນມອບໝາຍ",
        life: 4000,
      });
      return;
    }
    try {
      setLoading(true);
      /** POST ສ້າງ assignment ກ່ອນ (Admin ຮັບວຽກເອງ) — response ມີ id (assignmentId) ທີ່ PUT accept ຕ້ອງການ */
      const createRes = await axiosClientsHelpDesk.post(HELPDESK_ENDPOINTS.ASSIGNMENTS, {
        helpdeskRequestId: helpdeskRequestIds,
        assignedToId: [currentUserId],
      });
      /** ດຶງ assignmentId ຈາກ response ຮອງຮັບທຸກຮູບແບບ: array / { data: [] } / single object */
      const rawCreate = createRes?.data;
      const rawList: unknown[] = Array.isArray(rawCreate)
        ? rawCreate
        : Array.isArray(rawCreate?.data)
          ? rawCreate.data
          : rawCreate?.id != null
            ? [rawCreate]
            : rawCreate?.data?.id != null
              ? [rawCreate.data]
              : [];
      const assignmentIds = rawList
        .map((item) => Number((item as Record<string, unknown>)?.id))
        .filter((id) => Number.isFinite(id) && id > 0);
      if (assignmentIds.length > 0) {
        await axiosClientsHelpDesk.put(HELPDESK_ENDPOINTS.ASSIGNMENTS_ACCEPT, { id: assignmentIds });
      }
      await fetchData();
      setSelectedTickets([]);
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
  }, [roleId, currentUserId, selectedTickets, fetchData, toastRef]);

  const openAssigneeDialog = useCallback((assignees: Assignee[], ticketStatus?: string) => {
    setCurrentAssignees(assignees);
    setCurrentTicketStatus(ticketStatus ?? null);
    setDialogVisible(true);
  }, []);

  const closeDialogCb = useCallback(() => setDialogVisible(false), []);

  /**
   * ປ່ຽນສະຖານະຈາກ dropdown ລາຍລະອຽດ.
   * API: PUT /api/helpdeskrequests/updatehelpdeskstatus/[id] body: { helpdeskStatusId } (id ຈາກ helpdeskstatus/admin: 4–8).
   */
  const onStatusChange = useCallback(
    async (ticketId: string | number, helpdeskStatusId: number) => {
      const id = Number(ticketId);
      if (!Number.isFinite(id) || !Number.isFinite(helpdeskStatusId)) return;
      try {
        setLoading(true);
        await axiosClientsHelpDesk.put(HELPDESK_ENDPOINTS.updateHelpdeskStatus(id), {
          helpdeskStatusId,
        });
        await fetchData();
        toastRef?.current?.show({
          severity: "success",
          summary: "ສຳເລັດ",
          detail: "ປ່ຽນສະຖານະສຳເລັດ",
          life: 3000,
        });
      } catch {
        setLoading(false);
        toastRef?.current?.show({
          severity: "error",
          summary: "ຜິດພາດ",
          detail: "ປ່ຽນສະຖານະບໍ່ສຳເລັດ",
          life: 4000,
        });
        fetchData();
      }
    },
    [fetchData, toastRef]
  );

  const handleStatusAction = useCallback(
    (ticket: Ticket, targetStatusId: number) => {
      if (SOLUTION_VIEW_STATUS_IDS.has(targetStatusId)) {
        const relevant = (ticket.assignees ?? []).filter((a) => a.statusId === targetStatusId);
        if (relevant.length > 0) {
          const statusName = statusList.find((s) => s.id === targetStatusId)?.name ?? '';
          const totalAssigneesCount = ticket.assignees?.length ?? 0;
          const hideConfirm = targetStatusId === 8 && totalAssigneesCount > 1 && relevant.length < totalAssigneesCount;
          setSolutionDialogData({
            ticketId: ticket.id,
            ticketTitle: ticket.title,
            targetStatusId,
            targetStatusName: statusName,
            assignees: relevant,
            hideConfirm,
          });
          setSolutionDialogVisible(true);
          return;
        }
      }
      onStatusChange(ticket.id, targetStatusId);
    },
    [statusList, onStatusChange]
  );

  const onSolutionDialogConfirm = useCallback(() => {
    if (!solutionDialogData) return;
    const { ticketId, targetStatusId } = solutionDialogData;
    setSolutionDialogVisible(false);
    setSolutionDialogData(null);
    onStatusChange(ticketId, targetStatusId);
  }, [solutionDialogData, onStatusChange]);

  const onSolutionDialogHide = useCallback(() => {
    setSolutionDialogVisible(false);
    setSolutionDialogData(null);
  }, []);

  const isRole2 = roleId === TECHNICIAN_ROLE_ID;
  const isAdmin = roleId === ADMIN_ROLE_ID;
  const selectedEligibleForReceiveSelf = useMemo(() => selectedTickets.filter(canReceiveSelf), [selectedTickets]);
  const receiveSelfDisabled = (!isRole2 && !isAdmin) || selectedEligibleForReceiveSelf.length === 0;

  return {
    tickets: filteredTickets,
    loading,
    error,
    selectedTickets,
    globalFilter,
    onGlobalFilterChange,
    statusFilter,
    setStatusFilter,
    statusOptions,
    assignOptions,
    assignFilter,
    setAssignFilter,
    assignmentSectionTitle,
    priorityOptions,
    onCheckboxChange,
    onPriorityChange,
    onBulkAssign,
    dialogVisible,
    currentAssignees,
    currentTicketStatus,
    openAssigneeDialog,
    closeDialog: closeDialogCb,
    refetch: fetchData,
    isRole2,
    isAdmin,
    onReceiveTaskSelf,
    receiveSelfDisabled,
    canReceiveSelf,
    statusList,
    statusListForModal,
    onStatusChange,
    solutionDialogVisible,
    solutionDialogData,
    handleStatusAction,
    onSolutionDialogConfirm,
    onSolutionDialogHide,
  };
};
