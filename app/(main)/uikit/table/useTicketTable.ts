// table/useTicketTable.ts
import { useState, useEffect, useCallback } from "react";
import axiosClientsHelpDesk from "@/config/axiosClientsHelpDesk";
import { Ticket, Assignee } from "./types";
import type { HelpdeskRequestRow, AssignmentItem } from "./types";
import { ASSIGNMENT_GROUPS } from "./constants";
import { getCurrentDateTimeString } from "@/utils/dateUtils";
import { formatDateTime } from "@/utils/dateUtils";
import { ticketService } from "@/app/services/ticketService";

const ENDPOINT = "helpdeskrequests/admin";

function normalizeRow(row: HelpdeskRequestRow): Ticket {
  const emp = row.createdBy?.employee;
  const first = emp?.first_name ?? "";
  const last = emp?.last_name ?? "";
  const requester = [first, last].filter(Boolean).join(" ").trim() || undefined;
  const assignees: Assignee[] = (row.assignments ?? []).map((a: AssignmentItem) => {
    const e = a.employee;
    const name = e ? [e.first_name, e.last_name].filter(Boolean).join(" ").trim() : "";
    return {
      id: a.id ?? a.employee?.id ?? 0,
      name: name || "—",
      status: (a.status as Assignee["status"]) || "waiting",
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

export const useTicketTable = () => {
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

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    axiosClientsHelpDesk
      .get(ENDPOINT)
      .then((response) => {
        const rawList = normalizeResponse(response.data);
        const list = rawList.map(normalizeRow).sort((a, b) => Number(b.id) - Number(a.id));
        setTickets(list);
        setFilteredTickets(filterTickets(list, globalFilter, statusFilter?.value ?? null));
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
  }, [globalFilter, statusFilter?.value, filterTickets]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setFilteredTickets(filterTickets(tickets, globalFilter, statusFilter?.value ?? null));
  }, [tickets, globalFilter, statusFilter?.value, filterTickets]);

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
    const newAssignees: Assignee[] = assignFilter.map((item: any, index) => {
      let name = item.label ?? (item.firstname ? `${item.firstname} ${item.lastname || ""}`.trim() : String(item));
      let assignedId = item.id;
      let phone = item.Phonenumber ?? "";
      if (typeof item === "string") {
        const found = ASSIGNMENT_GROUPS.flatMap((g) => g.items).find((i: any) => i.value === item || i.label === item);
        if (found) {
          name = found.label;
          assignedId = found.id;
          phone = (found as any).Phonenumber ?? "";
        }
      }
      return { id: assignedId ?? Date.now() + index, name, status: "waiting" as const, phone };
    });
    try {
      setLoading(true);
      const assignDate = getCurrentDateTimeString();
      await Promise.all(
        selectedTickets.map((ticket) =>
          ticketService.updateTicket({
            ...ticket,
            assignees: [...(ticket.assignees || []), ...newAssignees],
            assignDate,
          } as any)
        )
      );
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
    assignFilter,
    setAssignFilter,
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
