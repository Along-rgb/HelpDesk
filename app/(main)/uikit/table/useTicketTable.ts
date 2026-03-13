// table/useTicketTable.ts
import { useState, useEffect, useCallback, useMemo } from "react";
import type { RefObject } from "react";
import type { Toast } from "primereact/toast";
import axiosClientsHelpDesk from "@/config/axiosClientsHelpDesk";
import { HELPDESK_ENDPOINTS } from "@/config/endpoints";
import { useHelpdeskStatusOptions } from "@/app/hooks/useHelpdeskStatusOptions";
import { normalizeDataList, normalizeIdNameList } from "@/utils/apiNormalizers";
import { getApiErrorMessage } from "@/utils/errorMessage";
import { Ticket, Assignee, StatusOption, AssigneeOption } from "./types";
import type { HelpdeskRequestRow, AdminAssignUserRow, HeadCategorySelectRow } from "./types";
import { normalizeHelpdeskRow } from "./normalizeHelpdeskRow";
import { useUserRoleAndId } from "@/app/store/user/userProfileStore";

const STAFF_ROLE_ID = 3;
/** Role 2 (Admin) + Role 3 (Staff) — ເກັບທັງຄູ່ໃນ assignOptions ເພື່ອ lookup emp_code */
const ROLE_IDS_FOR_ASSIGN_OPTIONS = [2, 3] as const;
const STAFF_HEAD_CATEGORY_TAB_INDEX = 1;
/** ສະຖານະຫຼັງມອບໝາຍວຽກ — ກຳລັງດຳເນີນການ (auto ເມື່ອມອບໝາຍວຽກແລ້ວ) */
const HELPDESK_STATUS_IN_PROGRESS = 2;
/** ສະຖານະ id 1 — ໃຫ້ແຖບ checkbox ເມື່ອສະຖານະເປັນ id ນີ້ (logic เดิม) */
const STATUS_ID_SHOW_CHECKBOX = 1;
const TECHNICIAN_ROLE_ID = 2;
/** Role 2 ไม่มีสิทธิ์ GET prioritys — ใช้รายการ fallback เพื่อให้เลือกได้ */
const ROLE_ID_NO_PRIORITY_LIST = 2;
const FALLBACK_PRIORITY_OPTIONS: { id: number; name: string }[] = [
  { id: 0, name: "ບໍ່ລະບຸ" },
  { id: 1, name: "ທຳມະດາ" },
  { id: 2, name: "ສູງ" },
  { id: 3, name: "ກາງ" },
  { id: 4, name: "ຕ່ຳ" },
];

const ALL_STATUS_OPTION: StatusOption = { label: "ທັງໝົດ", value: "Allin" };

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
  const [statusFilter, setStatusFilter] = useState<{ value: string } | null>(null);
  const [assignFilter, setAssignFilter] = useState<any[] | null>(null);
  const [selectedTickets, setSelectedTickets] = useState<Ticket[]>([]);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [currentAssignees, setCurrentAssignees] = useState<Assignee[]>([]);
  const [currentTicketStatus, setCurrentTicketStatus] = useState<string | null>(null);
  const [assignOptions, setAssignOptions] = useState<AssigneeOption[]>([]);
  const [assignmentSectionTitle, setAssignmentSectionTitle] = useState<string>("ມອບໝາຍໃຫ້");
  const [priorityOptions, setPriorityOptions] = useState<{ id: number; name: string }[]>([]);

  /** โหลดรายการสถานะจาก helpdeskstatus/admin สำหรับ dropdown ລາຍລະອຽດ (ปุ่มในแต่ละแถว) */
  useEffect(() => {
    axiosClientsHelpDesk
      .get(HELPDESK_ENDPOINTS.STATUS_ADMIN)
      .then((response) => {
        const list = normalizeIdNameList(response?.data ?? []);
        setStatusList(list);
      })
      .catch(() => setStatusList([]));
  }, []);

  /** โหลดรายการสถานะจาก helpdeskstatus/selecthelpdeskstatus สำหรับ AssigneeDialog (Modal ສະຖານະຊ່າງ) */
  useEffect(() => {
    axiosClientsHelpDesk
      .get(HELPDESK_ENDPOINTS.STATUS_SELECT)
      .then((response) => {
        const list = normalizeIdNameList(response?.data ?? []);
        setStatusListForModal(list);
      })
      .catch(() => setStatusListForModal([]));
  }, []);

  /** ตัวเลือกสำหรับ dropdown ເລືອກສະຖານະ (filter) — จาก selecthelpdeskstatus */
  const statusOptions: StatusOption[] = useMemo(
    () => [
      ALL_STATUS_OPTION,
      ...statusListForFilter.map((item) => {
        const name = typeof item.name === "string" ? item.name.trim() : String(item.name ?? "").trim();
        return { label: name, value: name };
      }),
    ],
    [statusListForFilter]
  );

  const filterTickets = useCallback((data: Ticket[], filterValue: string, statusVal: string | null) => {
    let out = data;
    if (filterValue) {
      const lower = filterValue.toLowerCase();
      out = out.filter(
        (t) =>
          String(t.id).toLowerCase().includes(lower) ||
          (t.title && t.title.toLowerCase().includes(lower)) ||
          (t.firstname_req && t.firstname_req.toLowerCase().includes(lower)) ||
          (t.requester && t.requester.toLowerCase().includes(lower)) ||
          (t.emp_code && t.emp_code.toLowerCase().includes(lower))
      );
    }
    if (statusVal && statusVal !== "Allin") {
      out = out.filter((t) => t.status === statusVal);
    }
    return out;
  }, []);

  /** ດຶງຂໍ້ມູນຈາກ users/admin (ຫຼື adminassign fallback) — ເກັບ Role 2 + 3 ເພື່ອ lookup emp_code, image, phone */
  useEffect(() => {
    axiosClientsHelpDesk
      .get(HELPDESK_ENDPOINTS.USERS_ADMIN)
      .then((response) => {
        const raw = response?.data;
        const list: AdminAssignUserRow[] = Array.isArray(raw)
          ? (raw as AdminAssignUserRow[])
          : normalizeDataList<AdminAssignUserRow>(raw);
        const filtered = list.filter(
          (u) => u.roleId == null || ROLE_IDS_FOR_ASSIGN_OPTIONS.includes(Number(u.roleId) as 2 | 3)
        );
        const options: AssigneeOption[] = filtered.map((u) => {
          const first = u.employee?.first_name ?? "";
          const last = u.employee?.last_name ?? "";
          const label = [first, last].filter(Boolean).join(" ").trim() || String(u.id);
          const emp_codeRaw = u.employee?.emp_code ?? u.username ?? (u as { emp_code?: string }).emp_code;
          const emp_code = emp_codeRaw != null && String(emp_codeRaw).trim() !== "" ? String(emp_codeRaw).trim() : undefined;
          const employeeId = u.employeeId ?? u.employee?.id;
          const image = u.employee?.empimg != null && String(u.employee.empimg).trim() !== "" ? String(u.employee.empimg).trim() : undefined;
          const phone = u.employee?.tel != null && String(u.employee.tel).trim() !== "" ? String(u.employee.tel).trim() : undefined;
          return { id: u.id, label, emp_code, employeeId, image, phone };
        });
        setAssignOptions(options);
      })
      .catch(() => setAssignOptions([]));
  }, []);

  useEffect(() => {
    axiosClientsHelpDesk
      .get(HELPDESK_ENDPOINTS.HEADCATEGORY_SELECT)
      .then((response) => {
        const list = normalizeDataList<HeadCategorySelectRow>(response.data);
        const item = list[STAFF_HEAD_CATEGORY_TAB_INDEX] ?? list[0];
        const name = typeof item?.name === "string" ? item.name.trim() : "";
        if (name) setAssignmentSectionTitle(name);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (roleId === ROLE_ID_NO_PRIORITY_LIST) {
      setPriorityOptions(FALLBACK_PRIORITY_OPTIONS);
      return;
    }
    axiosClientsHelpDesk
      .get(HELPDESK_ENDPOINTS.PRIORITY)
      .then((response) => {
        const list = normalizeIdNameList(response.data);
        setPriorityOptions(list);
      })
      .catch(() => setPriorityOptions(FALLBACK_PRIORITY_OPTIONS));
  }, [roleId]);

  /** Memoize staff lookup Maps — rebuilt only when assignOptions changes */
  const staffMaps = useMemo(() => ({
    labelMap: buildStaffLabelMap(assignOptions),
    empCodeMap: buildStaffEmpCodeMap(assignOptions),
    imageMap: buildStaffImageMap(assignOptions),
    phoneMap: buildStaffPhoneMap(assignOptions),
  }), [assignOptions]);

  /** Enrich ticket assignees with staff lookup data (memoized) */
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

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    axiosClientsHelpDesk
      .get(HELPDESK_ENDPOINTS.REQUESTS_ADMIN)
      .then((response) => {
        const rawList = normalizeDataList<HelpdeskRequestRow>(response.data);
        const list = rawList.map(normalizeHelpdeskRow).sort((a, b) => Number(b.id) - Number(a.id));
        const enriched = enrichTickets(list);
        setTickets(enriched);
      })
      .catch((err: unknown) => {
        setError(getApiErrorMessage(err, "ເກີດຂໍ້ຜິດພາດໃນການໂຫຼດຂໍ້ມູນ"));
        setTickets([]);
      })
      .finally(() => setLoading(false));
  }, [enrichTickets]);

  /** ເອີ້ນ fetchData ເມື່ອ enrichTickets ປ່ຽນ (รวมເວລາ assignOptions โหลดແລ້ວ) เพื่อให้ enrich emp_code ໄດ້ */
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /** Derived filtered tickets — no separate state or effect needed */
  const filteredTickets = useMemo(
    () => filterTickets(tickets, globalFilter, statusFilter?.value ?? null),
    [tickets, globalFilter, statusFilter?.value, filterTickets]
  );

  const onCheckboxChange = (e: { checked?: boolean }, rowData: Ticket) => {
    if (e.checked) setSelectedTickets((prev) => [...prev, rowData]);
    else setSelectedTickets((prev) => prev.filter((t) => t.id !== rowData.id));
  };

  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGlobalFilter(e.target.value);
  };

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

  /** ຮັບວຽກເອງ (role 2): ເງື່ອນໄຂ ສະຖານະ ລໍຖ້າຮັບວຽກ ແລະ ຍັງບໍ່ມີຄົນມອບໝາຍ */
  const onReceiveTaskSelf = useCallback(async () => {
    if (roleId !== TECHNICIAN_ROLE_ID || currentUserId == null) return;
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
      /** ສ້າງ assignment ກ່ອນ (POST) ແລ້ວຮັບ response ທີ່ມີ assignment IDs */
      const createResponse = await axiosClientsHelpDesk.post(HELPDESK_ENDPOINTS.ASSIGNMENTS, {
        helpdeskRequestId: helpdeskRequestIds,
        assignedToId: [currentUserId],
      });
      
      /** ດຶງ assignment IDs ຈາກ response (ຖ້າ API ສົ່ງກັບມາ) */
      const assignmentIds: number[] = [];
      if (createResponse?.data) {
        const responseData = Array.isArray(createResponse.data) 
          ? createResponse.data 
          : createResponse.data.data;
        if (Array.isArray(responseData)) {
          responseData.forEach((item: any) => {
            if (item?.id != null && Number.isFinite(Number(item.id))) {
              assignmentIds.push(Number(item.id));
            }
          });
        }
      }
      
      /** ຖ້າມີ assignment IDs ໃຫ້ເອີ້ນ PUT /api/assignments/accept ເພື່ອຮັບວຽກ (ປ່ຽນສະຖານະເປັນກຳລັງດຳເນີນການ) */
      if (assignmentIds.length > 0) {
        await axiosClientsHelpDesk.put(HELPDESK_ENDPOINTS.ASSIGNMENTS_ACCEPT, {
          id: assignmentIds,
        });
      } else {
        /** Fallback: ຖ້າບໍ່ມີ assignment IDs ໃຫ້ອັບເດດສະຖານະຂອງ helpdesk request ແທນ (ວິທີເດີມ) */
        await Promise.all(
          helpdeskRequestIds.map((id) =>
            axiosClientsHelpDesk.put(HELPDESK_ENDPOINTS.updateHelpdeskStatus(id), { helpdeskStatusId: HELPDESK_STATUS_IN_PROGRESS })
          )
        );
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

  const openAssigneeDialog = (assignees: Assignee[], ticketStatus?: string) => {
    setCurrentAssignees(assignees);
    setCurrentTicketStatus(ticketStatus ?? null);
    setDialogVisible(true);
  };

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

  const isRole2 = roleId === TECHNICIAN_ROLE_ID;
  const selectedEligibleForReceiveSelf = useMemo(() => selectedTickets.filter(canReceiveSelf), [selectedTickets]);
  const receiveSelfDisabled = !isRole2 || selectedEligibleForReceiveSelf.length === 0;

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
    closeDialog: () => setDialogVisible(false),
    refetch: fetchData,
    isRole2,
    onReceiveTaskSelf,
    receiveSelfDisabled,
    canReceiveSelf,
    statusList,
    statusListForModal,
    onStatusChange,
  };
};
