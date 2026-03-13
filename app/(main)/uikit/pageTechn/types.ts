// pageTechn/types.ts
export interface Assignee {
    id: number | string;
    name: string;
    image?: string;
    phone?: string;
    status: 'doing' | 'done' | 'waiting';
    /** id ສະຖານະຈາກ helpdeskStatus — ໃຊ້ເອີ້ນ selecthelpdeskstatus ແລ້ວແສງ name */
    statusId?: number;
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
    /** id ສະຖານະຈາກ helpdeskStatus (ໃຊ້ເຊັ່ນເງື່ອນໄຂ checkbox / ຮັບວຽກເອງ) */
    statusId?: number;
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
    /** ລາຍການ assignment ຂອງ current user (ຈາກ helpdeskDetailToTicket) — ໃຊ້ໃນ role 3 */
    myAssignments?: { assignmentId: number; assignee: Assignee; statusName?: string; statusId?: number }[];
}

/** ฟอร์มລາຍງານວຽກ (Report Work modal) */
export interface ReportWorkFormData {
    workDetail: string;
    completedDate: Date | null;
    imageFiles?: File[];
}
