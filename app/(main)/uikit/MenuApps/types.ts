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
export interface IssueData {
    id: number;
    title: string;
    description: string;
    status: string;
    createdAt?: string;
    type?: string;
    parentName?: string;
    parentId?: number;
}

export interface CreateIssuePayload {
    title: string;
    description: string;
    status: string;
    type?: string;
    parentId?: number;
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
}

export interface CreateServiceRequestPayload {
    name: string;
    description: string;
    status: string;
    parentId?: number;
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
    LEVEL = 1,
    ROOM = 2
}

export enum IssueTabs {
    CATEGORY = 0,
    TOPIC = 1
}

export enum ServiceRequestTabs {
    CATEGORY = 0,
    TOPIC = 1
}

export enum SupportTeamTabs {
    TECHNICAL = 0,
    SYSTEM_ADMIN = 1,
    REQUESTER = 2
}

// --- Menu Types ---
export interface SubMenuItem {
    label: string;
    tabIndex: number;
}