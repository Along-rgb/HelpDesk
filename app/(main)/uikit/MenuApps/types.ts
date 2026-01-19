// src/uikit/MenuApps/types.ts
// --- Menu Types ---

export interface MenuItem {
    id: string;
    title: string;
    descriptions: string[];
    icon: string;
    path: string;
    subMenus?: { label: string; tabIndex: number }[];
}

// --- Support Team Types ---
export interface SupportTeamData {
    id: number;
    name: string; // ຊື່ວິຊາການ ຫຼື ຊື່ທົ່ວໄປ
    description: string;
    status: string;
    createdAt?: string;

    // [ເພີ່ມໃຫມ່] ສຳລັບ Tab ຜູ້ຄຸ້ມຄອງລະບົບ
    issueCategoryId?: number;
    issueCategoryName?: string; // ຊື່ໝວດບັນຫາທີ່ຈະສະແດງໃນຕາຕະລາງ
    assignedAdmins?: { id: number; name: string }[]; // ລາຍຊື່ Admin ທີ່ຖືກມອບໝາຍ
}

// Payload ສຳລັບ Create/Update
export interface CreatePayload {
    name: string;
    description: string;
    status: string;

    // [ເພີ່ມໃຫມ່]
    issueCategoryId?: number;
    assignedAdminIds?: number[];
}

// --- Building Types ---
export interface BuildingData {
    id: number;
    name: string;
    code: string;
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
}

export interface CreateIssuePayload {
    title: string;
    description: string;
    status: string;
    type?: string;
}

// --- Service Request Types ---
export interface ServiceRequestData {
    id: number;
    name: string;
    description: string;
    status: string;
    createdAt?: string;
}

export interface CreateServiceRequestPayload {
    name: string;
    description: string;
    status: string;
}