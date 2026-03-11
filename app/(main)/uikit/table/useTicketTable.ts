// table/useTicketTable.ts
import { useState, useEffect, useCallback, useMemo } from "react";
import type { RefObject } from "react";
import type { Toast } from "primereact/toast";
import axiosClientsHelpDesk from "@/config/axiosClientsHelpDesk";
import { HELPDESK_ENDPOINTS } from "@/config/endpoints";
import { useHelpdeskStatusOptions } from "@/app/hooks/useHelpdeskStatusOptions";
import { normalizeDataList, normalizeIdNameList } from "@/utils/apiNormalizers";
import { getApiErrorMessage } from "@/utils/errorMessage";
import { isAbortError } from "@/utils/abortError";
import { Ticket, Assignee, StatusOption, AssigneeOption } from "./types";
import type { HelpdeskRequestRow, AdminAssignUserRow, HeadCategorySelectRow } from "./types";
import { normalizeHelpdeskRow } from "./normalizeHelpdeskRow";
import { useUserProfileStore } from "@/app/store/user/userProfileStore";

const STAFF_ROLE_ID = 3;
/** Role 2 (Admin) + Role 3 (Staff) — ເກັບທັງຄູ່ໃນ assignOptions ເພື່ອ lookup emp_code */
const ROLE_IDS_FOR_ASSIGN_OPTIONS = [2, 3] as const;
const STAFF_HEAD_CATEGORY_TAB_INDEX = 1;
/** ສະຖານະຫຼັງມອບໝາຍວຽກ — ກຳລັງດຳເນີນການ (auto ເມື່ອມອບໝາຍວຽກແລ້ວ) */
const HELPDESK_STATUS_IN_PROGRESS = 2;
/** ສະຖານະທີ່ສາມາດກົດຮັບວຽກເອງໄດ້ (role 2) — ລໍຖ້າຮັບວຽກ ຫຼື ລໍຖ້າຮັບເລື່ອງ (API ອາດສົ່ງມາທັງສອງແບບ) */
const STATUS_WAITING_ACCEPT_OPTIONS = ["ລໍຖ້າຮັບວຽກ", "ລໍຖ້າຮັບເລື່ອງ"] as const;
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

const STATUS_NAME_ALIASES: Record<string, string> = {
  "ປິດວຽກ": "ປິດວຽກແລ້ວ",
  "ປິດ": "ປິດວຽກແລ້ວ",
  "ຍົກເລີກ": "ຍົກເລິກ",
};

function normalizeStatusName(input: string): string {
  const key = (input ?? "").trim();
  return STATUS_NAME_ALIASES[key] ?? key;
}

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

/** ຫົວຂໍ້ທີ່ສາມາດຮັບວຽກເອງໄດ້: ສະຖານະ ລໍຖ້າຮັບວຽກ/ລໍຖ້າຮັບເລື່ອງ ແລະ ຍັງບໍ່ມີຄົນມອບໝາຍ */
function canReceiveSelf(t: Ticket): boolean {
  const status = (t.status ?? "").trim();
  if (!STATUS_WAITING_ACCEPT_OPTIONS.includes(status as typeof STATUS_WAITING_ACCEPT_OPTIONS[number])) return false;
  const assignees = t.assignees ?? [];
  return assignees.length === 0;
}

const ASSIGNMENT_STATUS_LABELS: Record<string, string> = {
  doing: "ກຳລັງດຳເນີນການ",
  done: "ແກ້ໄຂແລ້ວ",
  waiting: "ລໍຖ້າຮັບວຽກ",
};

export const useTicketTable = (toastRef?: RefObject<Toast | null>) => {
  const roleId = useUserProfileStore((s) => s.currentUser?.roleId ?? null);
  const currentUserId = useUserProfileStore((s) => s.currentUser?.id ?? null) as number | null;
  const profileData = useUserProfileStore((s) => s.profileData);
  const employeeIdFromProfile = profileData?.employeeId != null ? Number(profileData.employeeId) : null;
  const { list: statusList } = useHelpdeskStatusOptions();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [globalFilter, setGlobalFilter] = useState("");
  /** เก็บเป็น string เพื่อให้ filter ทำงานแน่นอน (Dropdown ใช้ optionValue="value") */
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [assignFilter, setAssignFilter] = useState<any[] | null>(null);
  const [selectedTickets, setSelectedTickets] = useState<Ticket[]>([]);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [currentAssignees, setCurrentAssignees] = useState<Assignee[]>([]);
  const [currentTicketStatus, setCurrentTicketStatus] = useState<string | null>(null);
  const [assignOptions, setAssignOptions] = useState<AssigneeOption[]>([]);
  const [assignmentSectionTitle, setAssignmentSectionTitle] = useState<string>("ມອບໝາຍໃຫ້");
  const [priorityOptions, setPriorityOptions] = useState<{ id: number; name: string }[]>([]);
  /** รายการสถานะสำหรับปุ่ม ລາຍລະອຽດ (จาก GET helpdeskstatus/admin) */
  const [adminStatusList, setAdminStatusList] = useState<{ id: number; name: string }[]>([]);

  const statusOptions: StatusOption[] = useMemo(
    () => [
      ALL_STATUS_OPTION,
      ...statusList.map((item) => {
        const name = typeof item.name === "string" ? item.name.trim() : String(item.name ?? "").trim();
        return { label: name, value: name };
      }),
    ],
    [statusList]
  );

  const statusIdByName = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of statusList) {
      const name = typeof item?.name === "string" ? item.name.trim() : String(item?.name ?? "").trim();
      const id = Number((item as { id?: unknown })?.id);
      if (!name || !Number.isFinite(id)) continue;
      map.set(name, id);
    }
    return map;
  }, [statusList]);

  /** Role 3: แสดง ສະຖານະ ส่วนตัว (assignment). Role อื่น: สถานะรวม (ticket.status) */
  const getDisplayStatus = useCallback(
    (ticket: Ticket): string => {
      if (roleId !== STAFF_ROLE_ID) return (ticket.status ?? "").trim() || "—";
      const assignees = ticket.assignees ?? [];
      const myId = currentUserId ?? employeeIdFromProfile;
      if (myId == null) return (ticket.status ?? "").trim() || "—";
      const me = assignees.find((a) => Number(a.id) === Number(myId));
      if (!me) return (ticket.status ?? "").trim() || "—";
      const name = (me.statusName ?? "").trim();
      if (name) return name;
      return ASSIGNMENT_STATUS_LABELS[me.status] ?? ((ticket.status ?? "").trim() || "—");
    },
    [roleId, currentUserId, employeeIdFromProfile]
  );

  const filterTickets = useCallback(
    (data: Ticket[], filterValue: string, statusVal: string | null) => {
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
      const selectedStatus = statusVal != null ? normalizeStatusName(String(statusVal).trim()) : "";
      if (selectedStatus && selectedStatus !== "Allin") {
        if (roleId === STAFF_ROLE_ID) {
          out = out.filter((t) => normalizeStatusName(getDisplayStatus(t).trim()) === selectedStatus);
        } else {
          out = out.filter((t) => normalizeStatusName(String(t.status ?? "").trim()) === selectedStatus);
        }
      }
      return out;
    },
    [roleId, getDisplayStatus]
  );

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

  const fetchData = useCallback((signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    axiosClientsHelpDesk
      .get(HELPDESK_ENDPOINTS.REQUESTS_ADMIN, { signal })
      .then((response) => {
        const rawList = normalizeDataList<HelpdeskRequestRow>(response.data);
        const list = rawList.map(normalizeHelpdeskRow).sort((a, b) => Number(b.id) - Number(a.id));
        // โหลดข้อมูลครั้งเดียวจาก API; การกรองทำใน useEffect เพื่อไม่ให้ขึ้น loading ทุกครั้งที่เปลี่ยน filter
        // การ enrich assignees จาก assignOptions ทำใน useEffect แยกต่างหาก (ไม่ต้อง refetch)
        setTickets(list);
      })
      .catch((err: unknown) => {
        if (isAbortError(err)) {
          setLoading(false);
          return;
        }
        setError(getApiErrorMessage(err, "ເກີດຂໍ້ຜິດພາດໃນການໂຫຼດຂໍ້ມູນ"));
        setTickets([]);
        setFilteredTickets([]);
      })
      .finally(() => setLoading(false));
  }, []);

  /** โหลดข้อมูลครั้งแรก — ใช้ AbortController เพื่อยกเลิกเมื่อออกจากหน้า */
  useEffect(() => {
    const c = new AbortController();
    fetchData(c.signal);
    return () => c.abort();
  }, [fetchData]);

  /** ดึงรายการสถานะสำหรับปุ่ม ລາຍລະອຽດ (helpdeskstatus/admin) */
  useEffect(() => {
    const c = new AbortController();
    axiosClientsHelpDesk
      .get(HELPDESK_ENDPOINTS.STATUS_ADMIN, { signal: c.signal })
      .then((res) => {
        const list = normalizeIdNameList(res.data);
        setAdminStatusList(Array.isArray(list) ? list : []);
      })
      .catch((err: unknown) => {
        if (isAbortError(err)) return;
        setAdminStatusList([]);
      });
    return () => c.abort();
  }, []);

  useEffect(() => {
    setFilteredTickets(filterTickets(tickets, globalFilter, statusFilter ?? null));
  }, [tickets, globalFilter, statusFilter, filterTickets]);

  /** Enrich emp_code (ແລະ name/image/phone) จาก assignOptions — ຜູ້ຮ້ອງຂໍ (ticket) ແລະ assignee ຖ້າ API ບໍ່ສົ່ງມາ ຈະບໍ່ເປັນ "—" */
  useEffect(() => {
    if (assignOptions.length === 0) return;
    const staffMap = buildStaffLabelMap(assignOptions);
    const staffEmpCodeMap = buildStaffEmpCodeMap(assignOptions);
    const staffImageMap = buildStaffImageMap(assignOptions);
    const staffPhoneMap = buildStaffPhoneMap(assignOptions);
    setTickets((prev) =>
      prev.map((t) => {
        const requesterEmpCode =
          (t.emp_code != null && String(t.emp_code).trim() !== "" ? t.emp_code.trim() : null) ||
          (t.employeeId != null ? staffEmpCodeMap.get(Number(t.employeeId)) : undefined) ||
          undefined;
        return {
          ...t,
          emp_code: requesterEmpCode != null && requesterEmpCode !== "" ? requesterEmpCode : t.emp_code,
          assignees: (t.assignees ?? []).map((a) => {
            const key = Number(a.id);
            const empKey = a.employeeId != null ? Number(a.employeeId) : key;
            const enrichedEmpCode = (a.emp_code?.trim() || staffEmpCodeMap.get(key) || staffEmpCodeMap.get(empKey))?.trim();
            return {
              ...a,
              name: !a.name || a.name === "—" || !a.name.trim() ? staffMap.get(key) ?? staffMap.get(empKey) ?? a.name : a.name,
              emp_code: enrichedEmpCode != null && enrichedEmpCode !== "" ? enrichedEmpCode : a.emp_code,
              image: a.image ?? staffImageMap.get(key) ?? staffImageMap.get(empKey),
              phone: a.phone ?? staffPhoneMap.get(key) ?? staffPhoneMap.get(empKey),
            };
          }),
        };
      })
    );
  }, [assignOptions]);

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

  const updateTicketStatusByName = useCallback(
    async (ticket: Pick<Ticket, "id" | "status">, statusNameOrLabel: string) => {
      const helpdeskRequestId = Number(ticket?.id);
      if (!Number.isFinite(helpdeskRequestId)) return;
      const targetName = normalizeStatusName(statusNameOrLabel);
      if (!targetName) return;

      const current = (ticket.status ?? "").trim();
      if (current === targetName) {
        toastRef?.current?.show({
          severity: "info",
          summary: "ຂໍ້ມູນ",
          detail: `ສະຖານະເປັນ "${targetName}" ຢູ່ແລ້ວ`,
          life: 2500,
        });
        return;
      }

      const statusId = statusIdByName.get(targetName);
      if (!Number.isFinite(statusId)) {
        toastRef?.current?.show({
          severity: "warn",
          summary: "ບໍ່ພົບສະຖານະ",
          detail: `ບໍ່ພົບສະຖານະ "${targetName}" ໃນລາຍການ`,
          life: 4000,
        });
        return;
      }

      // optimistic update for snappy UI
      setTickets((prev) =>
        prev.map((t) => (Number(t.id) === helpdeskRequestId ? { ...t, status: targetName } : t))
      );
      setSelectedTickets((prev) =>
        prev.map((t) => (Number(t.id) === helpdeskRequestId ? { ...t, status: targetName } : t))
      );

      try {
        setLoading(true);
        await axiosClientsHelpDesk.put(HELPDESK_ENDPOINTS.updateHelpdeskStatus(helpdeskRequestId), {
          helpdeskStatusId: statusId,
        });
        await fetchData();
        toastRef?.current?.show({
          severity: "success",
          summary: "ສຳເລັດ",
          detail: `ປ່ຽນສະຖານະເປັນ "${targetName}" ສຳເລັດ`,
          life: 3000,
        });
      } catch (err: unknown) {
        setLoading(false);
        toastRef?.current?.show({
          severity: "error",
          summary: "ຜິດພາດ",
          detail: getApiErrorMessage(err, "ປ່ຽນສະຖານະບໍ່ສຳເລັດ"),
          life: 4500,
        });
        fetchData();
      }
    },
    [statusIdByName, fetchData, toastRef]
  );

  /** ອັບເດດສະຖານະຕາມ helpdeskStatusId (ໃຊ້ກັບປຸ່ມ ລາຍລະອຽດ ຈາກ helpdeskstatus/admin) */
  const updateTicketStatus = useCallback(
    async (ticketId: string | number, helpdeskStatusId: number) => {
      const id = Number(ticketId);
      if (!Number.isFinite(id) || !Number.isFinite(helpdeskStatusId)) return;
      try {
        setLoading(true);
        await axiosClientsHelpDesk.put(HELPDESK_ENDPOINTS.updateHelpdeskStatus(id), { helpdeskStatusId });
        await fetchData();
        toastRef?.current?.show({
          severity: "success",
          summary: "ສຳເລັດ",
          detail: "ອັບເດດສະຖານະສຳເລັດ",
          life: 3000,
        });
      } catch (err: unknown) {
        setLoading(false);
        toastRef?.current?.show({
          severity: "error",
          summary: "ຜິດພາດ",
          detail: getApiErrorMessage(err, "ອັບເດດສະຖານະບໍ່ສຳເລັດ"),
          life: 4500,
        });
        fetchData();
      }
    },
    [fetchData, toastRef]
  );

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
        detail: "ເລືອກຫົວຂໍ້ທີ່ສະຖານະ ລໍຖ້າຮັບວຽກ/ລໍຖ້າຮັບເລື່ອງ ແລະ ຍັງບໍ່ມີຄົນມອບໝາຍ",
        life: 4000,
      });
      return;
    }
    try {
      setLoading(true);
      await axiosClientsHelpDesk.post(HELPDESK_ENDPOINTS.ASSIGNMENTS, {
        helpdeskRequestId: helpdeskRequestIds,
        assignedToId: [currentUserId],
      });
      await Promise.all(
        helpdeskRequestIds.map((id) =>
          axiosClientsHelpDesk.put(HELPDESK_ENDPOINTS.updateHelpdeskStatus(id), { helpdeskStatusId: HELPDESK_STATUS_IN_PROGRESS })
        )
      );
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

  const isRole2 = roleId === TECHNICIAN_ROLE_ID;
  const selectedEligibleForReceiveSelf = useMemo(() => selectedTickets.filter(canReceiveSelf), [selectedTickets]);
  const receiveSelfDisabled = !isRole2 || selectedEligibleForReceiveSelf.length === 0;

  /** Map id/employeeId → emp_code สำหรับ AssigneeDialog — แสดง emp_code ใน modal แม้ snapshot ยังไม่ enrich */
  const staffEmpCodeMap = useMemo(() => buildStaffEmpCodeMap(assignOptions), [assignOptions]);

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
    staffEmpCodeMap,
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
    updateTicketStatusByName,
    updateTicketStatus,
    getDisplayStatus,
    adminStatusList,
  };
};
