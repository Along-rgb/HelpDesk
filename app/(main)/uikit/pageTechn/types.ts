// pageTechn/types.ts
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
