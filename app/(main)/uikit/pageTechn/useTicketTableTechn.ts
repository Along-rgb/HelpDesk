// pageTechn/useTicketTableTechn.ts
// โหลดข้อมูลจาก API ผ่าน TicketService แล้วกรองด้วย globalFilter + statusFilter (useMemo)
import { useState, useEffect, useCallback, useMemo } from "react";
import { Ticket, TicketRow, Assignee } from "./types";
import { TicketService } from "@/app/services/ticket.service";
import { useUserProfileStore } from "@/app/store/user/userProfileStore";

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

export const useTicketTableTechn = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterOption>(null);
  const [selectedTickets, setSelectedTickets] = useState<Ticket[]>([]);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [currentAssignees, setCurrentAssignees] = useState<Assignee[]>([]);

  const roleId = useUserProfileStore((s) => s.currentUser?.roleId ?? 0);
  const profileData = useUserProfileStore((s) => s.profileData);
  const currentUserDisplayName = useMemo(
    () =>
      [profileData?.first_name, profileData?.last_name].filter(Boolean).join(" ").trim() ||
      profileData?.fullName ||
      "",
    [profileData]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    TicketService.getTickets()
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : [];
        setTickets(list.map((item) => normalizeTicket(item as unknown as Record<string, unknown>)));
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
    return tickets
      .filter(
        (t) => matchesGlobalFilter(t, globalFilter) && matchesStatusFilter(t, statusFilter)
      )
      .sort((a, b) => {
        const na = Number(a.id);
        const nb = Number(b.id);
        if (!Number.isNaN(na) && !Number.isNaN(nb)) return nb - na;
        return String(b.id).localeCompare(String(a.id));
      });
  }, [tickets, globalFilter, statusFilter]);

  const displayRows = useMemo((): TicketRow[] => {
    const isRole12 = roleId === 1 || roleId === 2;
    if (isRole12) {
      return filteredTickets.map((t) => ({ ...t, rowId: String(t.id) }));
    }
    const rows: TicketRow[] = [];
    for (const t of filteredTickets) {
      let assignees: Assignee[] = t.assignees ?? [];
      if (assignees.length === 0 && t.assignTo) {
        assignees = assignToToAssignees(t.assignTo, t.id);
      }
      if (assignees.length === 0) {
        rows.push({ ...t, rowId: String(t.id) });
      } else {
        assignees.forEach((a, i) => {
          rows.push({ ...t, rowId: `${t.id}-${a.id}-${i}`, rowAssignee: a });
        });
      }
    }
    return rows;
  }, [filteredTickets, roleId]);

  const showCheckbox = useCallback(
    (row: TicketRow): boolean => {
      if (roleId === 1 || roleId === 2) return true;
      if (!row.rowAssignee) return false;
      return isCurrentUserAssignee(row.rowAssignee.name, currentUserDisplayName);
    },
    [roleId, currentUserDisplayName]
  );

  const showAction = useCallback(
    (row: TicketRow): boolean => {
      if (roleId === 1 || roleId === 2) return true;
      if (!row.rowAssignee) return false;
      return isCurrentUserAssignee(row.rowAssignee.name, currentUserDisplayName);
    },
    [roleId, currentUserDisplayName]
  );

  const getTicketFromRow = useCallback((row: TicketRow): Ticket => {
    const { rowId, rowAssignee, ...ticket } = row;
    return ticket as Ticket;
  }, []);

  const onCheckboxChange = useCallback(
    (e: { checked?: boolean }, rowData: TicketRow) => {
      const ticket = getTicketFromRow(rowData);
      setSelectedTickets((prev) => {
        if (e.checked) return [...prev, ticket];
        return prev.filter((t) => t.id !== ticket.id);
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

  return {
    displayRows,
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
    showCheckbox,
    showAction,
    getTicketFromRow,
  };
};
