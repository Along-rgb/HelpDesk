// types.ts

export interface City {
    name: string;
    code?: string;
}

// UI State (หน้าฟอร์ม)
export interface TicketForm {
    category: City | null;
    assetNumber?: string;
    topic: City | null;
    building: City | null;
    level: City | null;
    roomNumber: City | null;
    description: string;
   attachments: File[];
    images: File[];
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
    levels: City[];
    rooms: City[];
}