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
import { useUserProfileStore } from "@/app/store/user/userProfileStore";

const STAFF_ROLE_ID = 3;
const STAFF_HEAD_CATEGORY_TAB_INDEX = 1;
/** ສະຖານະຫຼັງມອບໝາຍວຽກ — ກຳລັງດຳເນີນການ (auto ເມື່ອມອບໝາຍວຽກແລ້ວ) */
const HELPDESK_STATUS_IN_PROGRESS = 2;
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

export const useTicketTable = (toastRef?: RefObject<Toast | null>) => {
  const roleId = useUserProfileStore((s) => s.currentUser?.roleId ?? null);
  const { list: statusList } = useHelpdeskStatusOptions();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
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

  useEffect(() => {
    axiosClientsHelpDesk
      .get(HELPDESK_ENDPOINTS.USERS_ADMINASSIGN)
      .then((response) => {
        const list = normalizeDataList<AdminAssignUserRow>(response.data);
        const staff = list.filter((u) => Number(u.roleId) === STAFF_ROLE_ID);
        const options: AssigneeOption[] = staff.map((u) => {
          const first = u.employee?.first_name ?? "";
          const last = u.employee?.last_name ?? "";
          const label = [first, last].filter(Boolean).join(" ").trim() || String(u.id);
          return { id: u.id, label };
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

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    axiosClientsHelpDesk
      .get(HELPDESK_ENDPOINTS.REQUESTS_ADMIN)
      .then((response) => {
        const rawList = normalizeDataList<HelpdeskRequestRow>(response.data);
        const list = rawList.map(normalizeHelpdeskRow).sort((a, b) => Number(b.id) - Number(a.id));
        const staffMap = new Map(assignOptions.map((o) => [o.id, o.label]));
        const enriched = list.map((t) => ({
          ...t,
          assignees: (t.assignees ?? []).map((a) => ({
            ...a,
            name: !a.name || a.name === "—" || !a.name.trim() ? staffMap.get(Number(a.id)) ?? a.name : a.name,
          })),
        }));
        setTickets(enriched);
        setFilteredTickets(filterTickets(enriched, globalFilter, statusFilter?.value ?? null));
      })
      .catch((err: unknown) => {
        setError(getApiErrorMessage(err, "ເກີດຂໍ້ຜິດພາດໃນການໂຫຼດຂໍ້ມູນ"));
        setTickets([]);
        setFilteredTickets([]);
      })
      .finally(() => setLoading(false));
  }, [globalFilter, statusFilter?.value, filterTickets, assignOptions]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setFilteredTickets(filterTickets(tickets, globalFilter, statusFilter?.value ?? null));
  }, [tickets, globalFilter, statusFilter?.value, filterTickets]);

  useEffect(() => {
    if (assignOptions.length === 0) return;
    const staffMap = new Map(assignOptions.map((o) => [o.id, o.label]));
    setTickets((prev) =>
      prev.map((t) => ({
        ...t,
        assignees: (t.assignees ?? []).map((a) => ({
          ...a,
          name: !a.name || a.name === "—" || !a.name.trim() ? staffMap.get(Number(a.id)) ?? a.name : a.name,
        })),
      }))
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

  const openAssigneeDialog = (assignees: Assignee[], ticketStatus?: string) => {
    setCurrentAssignees(assignees);
    setCurrentTicketStatus(ticketStatus ?? null);
    setDialogVisible(true);
  };

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
  };
};
