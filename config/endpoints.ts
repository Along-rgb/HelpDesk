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

  /** GET — รายการสถานะสำหรับ dropdown/filter */
  STATUS_SELECT: 'helpdeskstatus/selecthelpdeskstatus',

  USERS_ADMINASSIGN: 'users/adminassign',
  /** GET — รายการ Admin + Staff สำหรับ lookup emp_code (Role 2, 3); โครงสร้าง id, username, employee: { id, emp_code, first_name, last_name, empimg, tel } */
  USERS_ADMIN: 'users/admin',
  USER_BY_ID: (id: string | number) => `users/${id}`,
  /** POST — เปลี่ยนรหัสผ่าน (body: oldpassword, password1, password2) */
  CHANGE_PASSWORD: 'users/changepassword',

  HEADCATEGORY_SELECT: 'headcategorys/selectheadcategory',
  PRIORITY: 'prioritys',
  ASSIGNMENTS: 'assignments',
} as const;
