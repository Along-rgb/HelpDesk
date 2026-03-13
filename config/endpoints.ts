/**
 * Helpdesk API path constants — single source to avoid typos and simplify refactor.
 */

export const HELPDESK_ENDPOINTS = {
  /** GET — รายการคำขอ (admin) */
  REQUESTS_ADMIN: 'helpdeskrequests/admin',
  /** GET — รายการคำขอของ user (ตาม createdById) */
  REQUESTS_USER: 'helpdeskrequests/user',
  /** GET/PUT — ตาม id */
  requestById: (id: string | number) => `helpdeskrequests/${id}`,
  updateHelpdeskStatus: (id: number) => `helpdeskrequests/updatehelpdeskstatus/${id}`,
  updatePriority: (id: number) => `helpdeskrequests/updatepriority/${id}`,
  /** POST — บันทึกรายงานการทำงาน (multipart: workDetail, completedDate, imageFiles) */
  reportWork: (id: string | number) => `helpdeskrequests/${id}/reportwork`,

  /** GET — รายการสถานะสำหรับ dropdown/filter */
  STATUS_SELECT: 'helpdeskstatus/selecthelpdeskstatus',
  /** GET — รายการสถานะสำหรับ admin (ปุ่ม/ dropdown ລາຍລະອຽດ ໃນ table) — id, name */
  STATUS_ADMIN: 'helpdeskstatus/admin',
  /** GET — รายการสถานะสำหรับ staff (ปุ่มລາຍລະອຽດ ໃນ pageTechn) */
  STATUS_STAFF: 'helpdeskstatus/staff',

  USERS_ADMINASSIGN: 'users/adminassign',
  /** GET — รายการ Admin + Staff สำหรับ lookup emp_code (Role 2, 3); โครงสร้าง id, username, employee: { id, emp_code, first_name, last_name, empimg, tel } */
  USERS_ADMIN: 'users/admin',
  USER_BY_ID: (id: string | number) => `users/${id}`,
  /** POST — เปลี่ยนรหัสผ่าน (body: oldpassword, password1, password2) */
  CHANGE_PASSWORD: 'users/changepassword',

  HEADCATEGORY_SELECT: 'headcategorys/selectheadcategory',
  PRIORITY: 'prioritys',
  ASSIGNMENTS: 'assignments',
  /** PUT — ຮັບວຽກເອງ body: { id: number[] } (assignment id) */
  ASSIGNMENTS_ACCEPT: 'assignments/accept',
} as const;
