// table/useTicketTable.ts
import { useState, useEffect, useCallback } from "react";
import axiosClientsHelpDesk from "@/config/axiosClientsHelpDesk";
import { Ticket, Assignee, StatusOption, AssigneeOption } from "./types";
import type { HelpdeskRequestRow, AssignmentItem, AdminAssignUserRow, HeadCategorySelectRow } from "./types";
import { formatDateTime } from "@/utils/dateUtils";
import { ticketService } from "@/app/services/ticketService";

const ENDPOINT = "helpdeskrequests/admin";
const STATUS_ENDPOINT = "helpdeskstatus/selecthelpdeskstatus";
const USERS_ADMINASSIGN_ENDPOINT = "users/adminassign";
const HEADCATEGORY_SELECT_ENDPOINT = "headcategorys/selectheadcategory";
const ASSIGNMENTS_ENDPOINT = "assignments";
const STAFF_ROLE_ID = 3;
const STAFF_HEAD_CATEGORY_TAB_INDEX = 1;

function normalizeStatusList(data: unknown): { id: number; name: string }[] {
  if (Array.isArray(data)) return data as { id: number; name: string }[];
  if (data && typeof data === "object" && "data" in data && Array.isArray((data as { data: unknown }).data)) {
    return (data as { data: { id: number; name: string }[] }).data;
  }
  return [];
}

function normalizeUserList(data: unknown): AdminAssignUserRow[] {
  if (Array.isArray(data)) return data as AdminAssignUserRow[];
  if (data && typeof data === "object" && "data" in data && Array.isArray((data as { data: unknown }).data)) {
    return (data as { data: AdminAssignUserRow[] }).data;
  }
  return [];
}

function normalizeHeadCategoryList(data: unknown): HeadCategorySelectRow[] {
  if (Array.isArray(data)) return data as HeadCategorySelectRow[];
  if (data && typeof data === "object" && "data" in data) {
    const d = (data as { data: unknown }).data;
    if (Array.isArray(d)) return d as HeadCategorySelectRow[];
  }
  return [];
}

function normalizeRow(row: HelpdeskRequestRow): Ticket {
  const emp = row.createdBy?.employee;
  const first = emp?.first_name ?? "";
  const last = emp?.last_name ?? "";
  const requester = [first, last].filter(Boolean).join(" ").trim() || undefined;
  const assignees: Assignee[] = (row.assignments ?? []).map((a: AssignmentItem) => {
    const e = a.assignedTo?.employee ?? a.employee;
    const name = e ? [e.first_name, e.last_name].filter(Boolean).join(" ").trim() : "";
    const id = e?.id ?? a.assignedToId ?? a.id ?? 0;
    return {
      id,
      name: name || "—",
      status: (a.status as Assignee["status"]) || "waiting",
      image: e?.empimg ?? undefined,
    };
  });
  return {
    id: row.id,
    title: row.ticket?.title ?? "",
    date: row.createdAt ? formatDateTime(row.createdAt) : "",
    firstname_req: first || undefined,
    lastname_req: last || undefined,
    requester,
    emp_code: emp?.emp_code ?? undefined,
    contactPhone: row.telephone ?? undefined,
    status: row.helpdeskStatus?.name ?? "",
    priority: row.priority?.name ?? "ບໍ່ລະບຸ",
    verified: false,
    assignees,
    _raw: row,
  };
}

function normalizeResponse(data: unknown): HelpdeskRequestRow[] {
  if (Array.isArray(data)) return data as HelpdeskRequestRow[];
  if (data && typeof data === "object" && "data" in data && Array.isArray((data as { data: unknown }).data)) {
    return (data as { data: HelpdeskRequestRow[] }).data;
  }
  return [];
}

const ALL_STATUS_OPTION: StatusOption = { label: "ທັງໝົດ", value: "Allin" };

export const useTicketTable = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<{ value: string } | null>(null);
  const [statusOptions, setStatusOptions] = useState<StatusOption[]>([ALL_STATUS_OPTION]);
  const [assignFilter, setAssignFilter] = useState<any[] | null>(null);
  const [selectedTickets, setSelectedTickets] = useState<Ticket[]>([]);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [currentAssignees, setCurrentAssignees] = useState<Assignee[]>([]);
  const [assignOptions, setAssignOptions] = useState<AssigneeOption[]>([]);
  const [assignmentSectionTitle, setAssignmentSectionTitle] = useState<string>("ມອບໝາຍໃຫ້");

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
      .get(STATUS_ENDPOINT)
      .then((response) => {
        const list = normalizeStatusList(response.data);
        const options: StatusOption[] = [
          ALL_STATUS_OPTION,
          ...list.map((item) => {
          const name = typeof item.name === "string" ? item.name.trim() : String(item.name ?? "").trim();
          return { label: name, value: name };
        }),
        ];
        setStatusOptions(options);
      })
      .catch(() => {
        setStatusOptions([ALL_STATUS_OPTION]);
      });
  }, []);

  useEffect(() => {
    axiosClientsHelpDesk
      .get(USERS_ADMINASSIGN_ENDPOINT)
      .then((response) => {
        const list = normalizeUserList(response.data);
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
      .get(HEADCATEGORY_SELECT_ENDPOINT)
      .then((response) => {
        const list = normalizeHeadCategoryList(response.data);
        const item = list[STAFF_HEAD_CATEGORY_TAB_INDEX] ?? list[0];
        const name = typeof item?.name === "string" ? item.name.trim() : "";
        if (name) setAssignmentSectionTitle(name);
      })
      .catch(() => {});
  }, []);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    axiosClientsHelpDesk
      .get(ENDPOINT)
      .then((response) => {
        const rawList = normalizeResponse(response.data);
        const list = rawList.map(normalizeRow).sort((a, b) => Number(b.id) - Number(a.id));
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
        const msg =
          err && typeof err === "object" && "response" in err
            ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
            : null;
        setError(typeof msg === "string" ? msg : "ເກີດຂໍ້ຜິດພາດໃນການໂຫຼດຂໍ້ມູນ");
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

  const onPriorityChange = async (id: string | number, newPriority: string) => {
    const target = tickets.find((t) => t.id === id);
    if (!target) return;
    try {
      setLoading(true);
      await ticketService.updateTicket({ ...target, priority: newPriority } as any);
      fetchData();
    } catch {
      setLoading(false);
    }
  };

  const onBulkAssign = async () => {
    if (!assignFilter?.length || selectedTickets.length === 0) return;
    const assignedToId = assignFilter
      .map((item: AssigneeOption | unknown) => (item as AssigneeOption)?.id)
      .filter((id): id is number => typeof id === "number");
    if (assignedToId.length === 0) return;
    const helpdeskRequestId = selectedTickets
      .map((t) => Number(t.id))
      .filter((id): id is number => Number.isFinite(id));
    if (helpdeskRequestId.length === 0) return;
    try {
      setLoading(true);
      await axiosClientsHelpDesk.post(ASSIGNMENTS_ENDPOINT, {
        helpdeskRequestId,
        assignedToId,
      });
      fetchData();
      setAssignFilter(null);
      setSelectedTickets([]);
    } catch {
      setLoading(false);
    }
  };

  const openAssigneeDialog = (assignees: Assignee[]) => {
    setCurrentAssignees(assignees);
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
    onCheckboxChange,
    onPriorityChange,
    onBulkAssign,
    dialogVisible,
    currentAssignees,
    openAssigneeDialog,
    closeDialog: () => setDialogVisible(false),
    refetch: fetchData,
  };
};
