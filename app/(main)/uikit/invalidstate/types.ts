// types.ts

export interface City {
    name: string;
    code?: string;
}

export interface ExistingFile {
    name: string;
    url: string;
}

// UI State (หน้าฟอร์ม) — payload: ticketId, buildingId, floorId, turningId, room, numberSKT, telephone, details, hdFile, hdImgs
export interface TicketForm {
    /** From URL — ຫົວຂໍ້ (display + payload ticketId) */
    ticketId: number | null;
    /** From URL — ຊື່ຫົວຂໍ້ for display */
    topic: City | null;
    /** ເລກ ຊຄທ → numberSKT */
    assetNumber: string;
    building: City | null;
    /** ເບີໂທ → telephone */
    phoneNumber: string;
    /** ເສັ້ນທາງ → turningId (route.code) */
    route: City | null;
    /** ລະດັບຊັ້ນ → floorId (level.code) */
    level: City | null;
    /** ໝາຍເລກຫ້ອງ → room */
    room: string;
    /** ລາຍລະອຽດເພີ່ມເຕີມ → details */
    description: string;
    /** ແນບໄຟລ໌ → hdFile (first file) */
    attachments: File[];
    /** ແນບຮູບ → hdImgs */
    images: File[];
    /** ໄຟລ໌ PDF ທີ່ມີຢູ່ໃນ Server (edit mode) */
    existingAttachments: ExistingFile[];
    /** ຮູບທີ່ມີຢູ່ໃນ Server (edit mode) */
    existingImages: ExistingFile[];
}

// Database Schema (ตรงกับ Fake-DB.json)
export interface Assignee {
    id: number;
    name: string;
    image?: string;
    status: 'doing' | 'done' | 'waiting';
}

export interface Ticket {
   id: string;
    title: string;
    date: string; // String format: "19/11/2025 11:22 AM"
    requester: string;
    assignTo?: string; 
    assignees?: Assignee[]; 
    status: string;
    priority: string;
    verified: boolean;
}

export interface MasterData {
    categories: City[];
    buildings: City[];
    routes: City[];
    levels: City[];
    rooms: City[];
}