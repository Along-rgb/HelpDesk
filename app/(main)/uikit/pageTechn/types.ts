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
    /** assignment id (ใช้ตอน role 3 กด “ຮັບວຽກເອງ” และอ้างอิง selection/API) */
    assignmentId?: number;
    /** Role 3: helpdeskStatus.id ของ assignment — ใช้เช็คแสดง checkbox (id ไม่ใช่ 2,3 = รอรับงาน) */
    assignmentHelpdeskStatusId?: number;
    /** Role 3: status ในแถวคือสถานะระดับ Assignment (a.helpdeskStatus.name) ไม่ใช่สถานะรวมของ Ticket */
}

/** ข้อมูลฟอร์มລາຍງານວຽກ (Report Work Modal) */
export interface ReportWorkFormData {
  workDetail: string;
  completedDate: Date | null;
  imageFiles: File[];
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
    /** สถานะรวมของ Ticket (helpdeskRequest.helpdeskStatus). Role 3 ໃຊ້ assignment status ໃນ TicketRow ແທນ */
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
    /** assignment id ສຳລັບສົ່ງ PUT /api/assignments/accept body: { id: [...] } */
    assignmentIds?: number[];
    /** role 3: แยกงานตาม assignment ของตัวเอง (1 assignment = 1 row) */
    myAssignments?: { assignmentId: number; assignee: Assignee; statusName?: string; statusId?: number }[];
}
