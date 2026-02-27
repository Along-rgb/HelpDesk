// table/types.ts — API response types and table row type

/** Nested ticket on helpdesk request */
export interface HelpdeskRequestTicket {
  id?: number;
  title: string;
  description?: string;
}

/** Employee nested under createdBy / assignedTo */
export interface Employee {
  id?: number;
  first_name?: string;
  last_name?: string;
  emp_code?: string;
  empimg?: string;
}

/** createdBy on helpdesk request */
export interface CreatedBy {
  employee?: Employee;
}

/** Status lookup */
export interface HelpdeskStatus {
  id?: number;
  name: string;
}

/** Option for status dropdown (label/value from API name) */
export type StatusOption = { label: string; value: string };

/** Row from GET users/adminassign (filter roleId === 3 for Staff) */
export interface AdminAssignUserRow {
  id: number;
  roleId: number;
  employee?: { first_name?: string; last_name?: string; emp_code?: string };
}

/** Item from GET headcategorys/selectheadcategory */
export interface HeadCategorySelectRow {
  id: number;
  name: string;
}

/** Option for assignee dropdown (id + display name) */
export type AssigneeOption = { id: number; label: string };

/** Priority lookup (may be null) */
export interface Priority {
  id?: number;
  name?: string | null;
}

/** assignedTo from API (assignments[].assignedTo) */
export interface AssignedTo {
  employee?: Employee;
}

/** Single assignment (assignments[] item from /api/helpdeskrequests/admin) */
export interface AssignmentItem {
  id?: number;
  assignedToId?: number;
  employee?: Employee;
  assignedTo?: AssignedTo;
  status?: string;
}

/** Raw item from GET /api/helpdeskrequests/admin */
export interface HelpdeskRequestRow {
  id: number;
  ticket?: HelpdeskRequestTicket | null;
  createdBy?: CreatedBy | null;
  telephone?: string | null;
  helpdeskStatus?: HelpdeskStatus | null;
  priority?: Priority | null;
  createdAt?: string | null;
  assignments?: AssignmentItem[] | null;
}

/** Assignee as used by table (avatar group, dialog) */
export interface Assignee {
  id: number | string;
  name: string;
  image?: string;
  phone?: string;
  status: 'doing' | 'done' | 'waiting';
}

/**
 * Table row type: normalized from HelpdeskRequestRow for DataTable.
 * Fields map to columns: ID, Topic, Requester, Employee Code, Contact, Status, Priority, Date, Assignees.
 */
export interface Ticket {
  id: number | string;
  title: string;
  date: string;
  firstname_req?: string;
  lastname_req?: string;
  requester?: string;
  emp_code?: string;
  contactPhone?: string;
  assignTo?: string;
  assignees?: Assignee[];
  assignDate?: string;
  status: string;
  priority: string;
  verified: boolean;
  employeeId?: number | string;
  description?: string;
  category?: string;
  building?: string;
  level?: string;
  room?: string;
  division?: string;
  department?: string;
  email?: string;
  /** Raw row for detail link / actions */
  _raw?: HelpdeskRequestRow;
}
