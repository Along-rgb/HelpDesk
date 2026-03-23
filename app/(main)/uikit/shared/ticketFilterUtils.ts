/**
 * Shared ticket filtering & user-matching utilities.
 * Extracted from useTicketTable, useTicketTableAdmin, useTicketTableTechn
 * to eliminate code duplication and ensure consistent behavior.
 */

// ---------------------------------------------------------------------------
// Status filter value extraction
// ---------------------------------------------------------------------------

/** Union type for PrimeReact Dropdown value — can be string or { value: string } */
export type StatusFilterOption = string | { label: string; value: string; icon?: string } | null;

/** All-status sentinel option */
export const ALL_STATUS_OPTION = { label: "ທັງໝົດ", value: "Allin" } as const;

/**
 * Extract the raw string value from a PrimeReact Dropdown value.
 * Handles both string and object `{ value }` shapes.
 */
export function extractStatusFilterVal(statusFilter: StatusFilterOption): string | null {
  if (typeof statusFilter === "string") return statusFilter;
  if (statusFilter != null && typeof statusFilter === "object" && "value" in statusFilter) {
    return statusFilter.value;
  }
  return null;
}

/**
 * Returns true when the filter value represents "show all" (null, empty, or "Allin").
 */
export function isShowAll(val: string | null): boolean {
  return !val || val === "Allin";
}

// ---------------------------------------------------------------------------
// Global text search
// ---------------------------------------------------------------------------

/**
 * Check if a ticket matches a global text query (case-insensitive substring).
 * Searches: id, title, firstname_req, requester, contactPhone.
 */
export function matchesGlobalFilter(
  ticket: { id: string | number; title?: string; firstname_req?: string; requester?: string; contactPhone?: string; emp_code?: string },
  query: string
): boolean {
  if (!query.trim()) return true;
  const q = query.toLowerCase().trim();
  return (
    String(ticket.id).toLowerCase().includes(q) ||
    (ticket.title ?? "").toLowerCase().includes(q) ||
    (ticket.firstname_req ?? "").toLowerCase().includes(q) ||
    (ticket.requester ?? "").toLowerCase().includes(q) ||
    (ticket.contactPhone ?? "").toLowerCase().includes(q) ||
    (ticket.emp_code ?? "").toLowerCase().includes(q)
  );
}

// ---------------------------------------------------------------------------
// User identity matching (for assignee filtering)
// ---------------------------------------------------------------------------

/**
 * Check if an assignee ID matches the current user (by userId or employeeId).
 * Uses Number comparison with isFinite guard, then String fallback.
 */
export function isCurrentUserByAssigneeId(
  assigneeId: number | string | undefined,
  currentUserId: number | string | null,
  employeeId: number | string | null
): boolean {
  if (assigneeId == null) return false;
  const a = Number(assigneeId);
  if (Number.isFinite(a) && currentUserId != null && Number(currentUserId) === a) return true;
  if (Number.isFinite(a) && employeeId != null && Number(employeeId) === a) return true;
  if (String(assigneeId) === String(currentUserId)) return true;
  if (String(assigneeId) === String(employeeId)) return true;
  return false;
}

/**
 * Fallback name-based check: does the assignee name match the current user display name?
 * Uses trimmed, case-sensitive substring matching.
 */
export function isCurrentUserAssignee(assigneeName: string, currentUserDisplayName: string): boolean {
  const a = (assigneeName ?? "").trim();
  const u = (currentUserDisplayName ?? "").trim();
  if (!a || !u) return false;
  return a === u || a.includes(u) || u.includes(a);
}

// ---------------------------------------------------------------------------
// Status options builder
// ---------------------------------------------------------------------------

interface IdNameItem {
  id: number;
  name: string;
}

interface StatusOptionItem {
  label: string;
  value: string;
}

interface TicketWithStatusId {
  statusId?: number;
  status?: string;
}

/**
 * Build a de-duplicated list of status dropdown options from one or more status lists,
 * plus any extra statusIds found on tickets themselves (fallback).
 */
export function buildStatusOptions(
  statusLists: IdNameItem[][],
  tickets: TicketWithStatusId[]
): StatusOptionItem[] {
  const seenIds = new Set<number>();
  const merged: StatusOptionItem[] = [{ ...ALL_STATUS_OPTION }];

  for (const list of statusLists) {
    for (const item of list) {
      const name = typeof item.name === "string" ? item.name.trim() : String(item.name ?? "").trim();
      if (name && !seenIds.has(item.id)) {
        seenIds.add(item.id);
        merged.push({ label: name, value: String(item.id) });
      }
    }
  }

  for (const t of tickets) {
    const sid = t.statusId;
    if (sid != null && !seenIds.has(sid)) {
      seenIds.add(sid);
      merged.push({ label: (t.status ?? "").trim() || String(sid), value: String(sid) });
    }
  }

  return merged;
}

// ---------------------------------------------------------------------------
// ID-based status row filter (applied at the END of displayRows)
// ---------------------------------------------------------------------------

/**
 * Filter rows by statusId. Applies Number() on both sides to prevent type mismatches.
 * Returns the original array if no filter is active.
 */
export function filterRowsByStatusId<T extends { statusId?: number }>(
  rows: T[],
  statusFilterVal: string | null
): T[] {
  if (isShowAll(statusFilterVal)) return rows;
  const filterStatusId = Number(statusFilterVal);
  if (!Number.isFinite(filterStatusId)) return rows;
  return rows.filter((row) => Number(row.statusId) === filterStatusId);
}
