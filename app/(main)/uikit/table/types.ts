// table/types.ts — API response types and table row type

/** Nested ticket on helpdesk request */
export interface HelpdeskRequestTicket {
  id?: number;
  title: string;
  description?: string;
}

/** Employee nested under createdBy / assignedTo (field ອີເມວ ตรงกับ profileUser: employee.email) */
export interface Employee {
  id?: number;
  first_name?: string;
  last_name?: string;
  emp_code?: string;
  email?: string;
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

/** Row from GET users/admin (หรือ users/adminassign); id = user id, employee.id = employee id สำหรับ lookup */
export interface AdminAssignUserRow {
  id: number;
  roleId?: number;
  username?: string;
  employeeId?: number;
  employee?: {
    id?: number;
    first_name?: string;
    last_name?: string;
    emp_code?: string;
    empimg?: string;
    tel?: string;
  };
}

/** Item from GET headcategorys/selectheadcategory */
export interface HeadCategorySelectRow {
  id: number;
  name: string;
}

/** Option for assignee dropdown + lookup; id = user id, employeeId = employee id (รองรับ lookup ທັງ 466 ແລະ 5325) */
export type AssigneeOption = {
  id: number;
  label: string;
  emp_code?: string;
  employeeId?: number;
  image?: string;
  phone?: string;
};

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
  /** สถานะส่วนตัวของ assignment (ສະຖານະ ส่วนตัว) — ใช้แสดงผลสำหรับ role 3 แทนสถานะรวม */
  helpdeskStatus?: HelpdeskStatus | { id?: number; name?: string };
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
  /** รหัสพนักงาน — แสดงใน Dialog ແທນ id (ເຊັ່ນ [emp_code] - ຊື່) */
  emp_code?: string;
  /** Employee ID — ใช้ lookup emp_code ใน modal เมื่อ API ส่ง id เป็น User ID */
  employeeId?: number | string;
  image?: string;
  phone?: string;
  status: 'doing' | 'done' | 'waiting';
  /** ชื่อสถานะระดับ assignment (assignment.helpdeskStatus.name) — ใช้แสดง ສະຖານະ ส่วนตัว สำหรับ role 3 */
  statusName?: string;
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
  priorityId?: number;
  verified: boolean;
  employeeId?: number | string;
  description?: string;
  /** ລາຍລະອຽດຈາກ API (field details) — ໃຊ້ເມື່ອ API ສົ່ງ details ແຍກຈາກ description */
  details?: string;
  category?: string;
  building?: string;
  level?: string;
  room?: string;
  /** ອອກລິບມາ — turning.name จาก API หรือ resolve ຈາກ turningId */
  turning?: string;
  /** ອອກລິບມາ — turningId จาก API (ໃຊ້ resolve ຊື່ຖ້າ turning ວ່າງ) */
  turningId?: number;
  /** ເລກ ຊຄທ — numberSKT จาก API */
  numberSKT?: string;
  division?: string;
  department?: string;
  email?: string;
  /** ໄຟລ໌ PDF ສະແດງຊື່ໄຟລ໌ຈາກ API (hdFile) */
  hdFile?: string | null;
  /** ຮູບພາບຈາກ API (hdImgs[]) — ແຕ່ລະອັນມີ id, helpdeskRequestId, hdImg = ຊື່ໄຟລ໌ */
  hdImgs?: { id: number; helpdeskRequestId: number; hdImg: string }[];
  /** Raw row for detail link / actions */
  _raw?: HelpdeskRequestRow;
}
