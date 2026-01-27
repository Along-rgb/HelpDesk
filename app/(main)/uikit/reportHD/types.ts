// src/app/reports/types.ts

// หน้าตาของข้อมูล 1 แถวในตาราง
export interface ReportItem {
    id: number | string;
    code: string;
    topic: string;
    detail: string;
    requester: string;      // ผู้ร้องขอ
    department_main?: string; // ฝ่าย
    department_sub?: string;  // แผนก
    building: string;
    floor: string;
    room: string;
    date: string ;           // วันที่ (รับเป็น String จาก API)
    note: string;
    
    // Field เสริมที่อาจมีหรือไม่มี
    technician?: string;
    category?: string;
    department?: string;
}

// สิ่งที่ส่งไปค้นหา (Filter)
export interface ReportFilter {
    startDate: Date | null;
    endDate: Date | null;
    tabIndex: number; // 0=หัวข้อ, 1=หมวดหมู่, 2=สังกัด, 3=วิชาการ
}