// pageTechn/useTicketTableTechn.ts
// โหลดข้อมูลจาก API ผ่าน TicketService แล้วกรองด้วย globalFilter + statusFilter (useMemo)
import { useState, useEffect, useCallback, useMemo } from "react";
import { Ticket, Assignee } from "./types";
import { TicketService } from "@/app/services/ticket.service";

type StatusFilterOption = { label: string; value: string; icon?: string } | null;

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

/** แปลง response จาก API ให้ตรงกับ Ticket (pageTechn) ถ้าขาดฟิลด์ใส่ default */
function normalizeTicket(raw: Record<string, unknown>): Ticket {
  return {
    id: (raw.id as string | number) ?? "",
    title: String(raw.title ?? ""),
    date: String(raw.date ?? ""),
    firstname_req: raw.firstname_req != null ? String(raw.firstname_req) : undefined,
    requester: raw.requester != null ? String(raw.requester) : undefined,
    assignTo: raw.assignTo != null ? String(raw.assignTo) : undefined,
    assignees: raw.assignees as Assignee[] | undefined,
    assignDate: raw.assignDate != null ? String(raw.assignDate) : undefined,
    status: String(raw.status ?? ""),
    priority: String(raw.priority ?? ""),
    verified: Boolean(raw.verified),
    ...(raw as Partial<Ticket>),
  };
}

export const useTicketTableTechn = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterOption>(null);
  const [selectedTickets, setSelectedTickets] = useState<Ticket[]>([]);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [currentAssignees, setCurrentAssignees] = useState<Assignee[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    TicketService.getTickets()
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : [];
        setTickets(list.map((item) => normalizeTicket(item as Record<string, unknown>)));
      })
      .catch(() => {
        if (!cancelled) setTickets([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredTickets = useMemo(() => {
    return tickets.filter(
      (t) => matchesGlobalFilter(t, globalFilter) && matchesStatusFilter(t, statusFilter)
    );
  }, [tickets, globalFilter, statusFilter]);

  const onCheckboxChange = useCallback((e: { checked?: boolean }, rowData: Ticket) => {
    setSelectedTickets((prev) => {
      if (e.checked) return [...prev, rowData];
      return prev.filter((t) => t.id !== rowData.id);
    });
  }, []);

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

  return {
    tickets: filteredTickets,
    loading,
    selectedTickets,
    globalFilter,
    onGlobalFilterChange,
    statusFilter,
    setStatusFilter,
    onCheckboxChange,
    onPriorityChange,
    dialogVisible,
    currentAssignees,
    openAssigneeDialog,
    closeDialog,
  };
};
