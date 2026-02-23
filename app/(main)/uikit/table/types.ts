import { string } from "zod";

// table/types.ts
export interface Assignee {
    id: number | string;
    name: string;
    image?: string;
    phone?: string;
    status: 'doing' | 'done' | 'waiting';
}

export interface Ticket {
    id: number | string;
    title: string;
    date: string;
    firstname_req?: string; 
    lastname_req?: string;
    requester?: string;  
    assignTo?: string; 
    assignees?: Assignee[]; 
    assignDate?: string; // ວັນທີມອບໝາຍ (เมื่อ Role 1,2 ມອບໝາຍວຽກ)
    status: string;
    priority: string;
    verified: boolean;
    employeeId?: number |string;
    // ✅ Field ที่มีใน Fake-DB.json และ รูปภาพ
    description?: string;
    category?: string;
    building?: string;
    level?: string;
    room?: string;
    division?: string;    // แผนก
    department?: string;  // ฝ่าย
    contactPhone?: string;
    email?: string;
}