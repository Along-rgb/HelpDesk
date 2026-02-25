// src/uikit/MenuApps/types.ts

// --- Menu Types ---
export interface SubMenuItem {
    label: string;
    tabIndex: number;
}

export interface MenuItem {
    id: string;
    title: string;
    icon: string;
    path: string;
    subMenus: SubMenuItem[];
    /** ຮູບໄອຄອນທີ່ອັບໂຫຼດໃນແຖບ ເພີ່ມໄອຄອນ - ຖ້າມີຈະໃຊ້ແทນທີ່ icon */
    iconUrl?: string;
}

// --- Shared Interface for Options (สำหรับ Dropdown & Lookup) ---
export interface OptionItem {
    label: string;
    value: any;
    originalData?: any; // เก็บ Object เต็มเผื่อใช้
}

// --- Building Types ---
export interface BuildingData {
    id: number;
    name: string;
    code: string;     // ใช้เป็น Description ใน Tab 2
    status: string;
    createdAt?: string;
    parentId?: number; 
    parentName?: string; 
    levelName?: string; 
}

export interface CreateBuildingPayload {
    name: string;
    code: string;
    status: string;
    parentId?: number | null;
}

// --- Issue Types ---
/** Tab 0: หมวดหมู่ from GET/POST/PUT/DELETE /api/categorys */
export interface CategoryData {
    id: number;
    headCategoryId: number;
    title: string;
    description: string;
    catIconId: number;
    createdAt: string;
    updatedAt: string;
    createdById: number;
}

export interface CreateCategoryPayload {
    headCategoryId: number;
    title: string;
    description: string;
    catIconId?: number;
}

export interface IssueData {
    id: number;
    title: string;
    description: string;
    status: string;
    createdAt?: string;
    type?: string;
    parentName?: string;
    parentId?: number;
    supportTeamId?: number;
    supportTeamName?: string;
    iconId?: number;
    iconUrl?: string;
}

export interface CreateIssuePayload {
    title: string;
    description: string;
    status: string;
    type?: string;
    parentId?: number;
    supportTeamId?: number;
    iconId?: number;
}

// --- Service Request Types ---
export interface ServiceRequestData {
    id: number;
    name: string;
    description: string;
    status: string;
    createdAt?: string;
    parentId?: number;    
    parentName?: string;
    supportTeamId?: number;
    supportTeamName?: string;
    iconId?: number;
    iconUrl?: string;
}

export interface CreateServiceRequestPayload {
    name: string;
    description: string;
    status: string;
    parentId?: number;
    supportTeamId?: number;
    iconId?: number;
}

// --- Icon (Tab ເພີ່ມໄອຄອນ) - ใช้ร่วม Service Request & Issue ---
/** Response from GET /api/categoryicons/selectcategoryicon — ใช้ map id → catIcon (ชื่อไฟล์/URL) */
export interface CategoryIconSelectItem {
    id: number;
    catIcon?: string;
    sortOrder?: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface IconItemData {
    id: number;
    sortOrder: number;
    /** Proxy URL for display, e.g. /api/proxy-category-icon?file=xxx.png */
    iconUrl: string;
    /** Filename from API, e.g. "1771920010070-925747134.png" */
    catIcon: string;
    createdAt?: string;
}

export interface CreateIconPayload {
    sortOrder: number;
    iconFile?: File;
    iconUrl?: string; // base64 or URL หลัง upload — ไม่ใช้เมื่อส่ง FormData (catIcon)
}

// --- HeadCategory (ທິມສະໜັບສະໜູນ from /api/headcategorys) ---
export interface HeadCategoryData {
    id: number;
    name: string;
    description: string;
    departmentId: number;
    divisionId: number;
    createdAt?: string;
    updatedAt?: string;
    department?: { id: number; department_name: string; department_code: string; department_status: string };
    division?: { id: number; division_name: string; division_code: string; division_status: string; branch_id: number; departmentId: number };
}

export interface CreateHeadCategoryPayload {
    departmentId: number;
    divisionId: number;
    name: string;
    description: string;
}

/** Payload for PUT /api/headcategorys/[id] */
export interface UpdateHeadCategoryPayload {
    name: string;
    description: string;
    departmentId: number;
    divisionId: number;
}

/** Response item from GET /api/headcategorys/selectheadcategory */
export interface HeadCategorySelectItem {
    id: number;
    name: string;
    description?: string;
    departmentId: number;
    divisionId: number;
    createdAt?: string;
    updatedAt?: string;
}

/** Response item from GET /api/users/admin or /api/users/adminassign (first_name + last_name สำหรับຊື່ວິຊາການ) */
export interface AdminAssignUser {
    id: number;
    username: string;
    employeeId: number;
    roleId: number;
    role?: { id: number; name: string; description: string };
    employee: {
        id: number;
        first_name?: string;
        last_name?: string;
        emp_code?: string;
        divisionId: number;
        departmentId?: number;
        department?: { id: number; department_name: string; department_code: string; department_status: string };
        division?: { id: number; division_name: string; division_code: string; division_status: string; branch_id: number; departmentId: number };
        [key: string]: unknown;
    };
}

/** Row for grouped Support Team (ວິຊາການ) table: section header or user row. ใช้ departmentId เปรียบเทียบกับ users จาก /api/users/admin */
export type SupportTeamTechnicalRow =
    | { type: 'section'; headCategoryId: number; name: string; divisionId: number; departmentId: number }
    | { type: 'user'; id: number; fullName: string; divisionId: number; departmentId?: number; raw: AdminAssignUser };

// --- Division (for dropdown from /api/divisions) ---
export interface DivisionOption {
    id: number;
    division_name: string;
    division_code: string;
    division_status: string;
    branch_id: number;
    departmentId: number;
}

// --- Support Team Types ---
export interface SupportTeamData {
    id: number;
    name: string; 
    description: string;
    status: string;
    createdAt?: string;
    issueCategoryId?: number;
    issueCategoryName?: string; 
    assignedAdmins?: { id: number; name: string }[]; 
}

export interface CreateSupportTeamPayload {
    name: string;
    description: string;
    status: string;
    issueCategoryId?: number;
    assignedAdminIds?: number[];
}
// --- Enums for Tabs (New) ---
export enum BuildingTabs {
    BUILDING = 0,
    LEVEL = 1
}

export enum IssueTabs {
    CATEGORY = 0,
    TOPIC = 1,
    ICON = 2
}

export enum ServiceRequestTabs {
    CATEGORY = 0,
    TOPIC = 1,
    ICON = 2
}

export enum SupportTeamTabs {
    ISSUE_CATEGORY = 0,  // ທິມສະໜັບສະໜູນ
    TECHNICAL = 1,       // ວິຊາການ
    ROLE_MANAGEMENT = 2  // ສະຖານະ (Roles)
}

// --- Role Management (tab ສະຖານະ) ---
export interface RoleSelectItem {
    id: number;
    name: string;
    description?: string;
}

export interface UserRoleData {
    id: number;
    userId: number;
    userName?: string;
    roleId: number;
    roleName?: string;
    description?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateUserRolePayload {
    userId: number;
    roleId: number;
    description?: string;
}

export interface UpdateUserRolePayload {
    userId: number;
    roleId: number;
    description?: string;
}
