// pageTechn/types.ts
export interface Assignee {
    id: number | string;
    name: string;
    image?: string;
    phone?: string;
    status: 'doing' | 'done' | 'waiting';
}

/** แถวที่แสดงในตาราง — สำหรับ role 3,4 จะมี rowAssignee (หนึ่งคนต่อแถว), role 1,2 ใช้ ticket อย่างเดียว */
export interface TicketRow extends Ticket {
    rowId: string;
    rowAssignee?: Assignee;
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
    assignDate?: string; // ວັນທີມອບໝາຍ
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
    contactPhone?: string;
    email?: string;
}
