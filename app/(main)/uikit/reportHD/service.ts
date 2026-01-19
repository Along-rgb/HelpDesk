// src/app/reports/service.ts
import axios from 'axios';
import { ReportItem, ReportFilter } from './types';

// เปลี่ยน URL นี้ให้ตรงกับ Backend ของคุณ
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'; 

export const ReportService = {
    // เพิ่ม parameter 'signal' (Optional) เพื่อรองรับการ Cancel Request
    getReports: async (filter: ReportFilter, signal?: AbortSignal): Promise<ReportItem[]> => {
        try {
            // เตรียม Parameters
            const params = {
                startDate: filter.startDate?.toISOString(),
                endDate: filter.endDate?.toISOString(),
                type: filter.tabIndex 
            };

            // ยิง API พร้อมส่ง signal ไปด้วย
            const response = await axios.get(`${API_URL}/reports`, { 
                params,
                signal: signal // ส่ง signal ให้ axios จัดการ cancel
            });
            
            return response.data;
        } catch (error: any) {
            // ถ้าเป็นการ Cancel request ไม่ต้อง log error
            if (axios.isCancel(error)) {
                console.log('Request canceled:', error.message);
                throw error; // throw ต่อให้หน้าบ้านรู้ว่าเป็น cancel
            }

            console.error("Error fetching reports:", error);
            // กรณี Error อื่นๆ ให้ส่งค่าว่างกลับไป หรือ throw error ตามต้องการ
            return []; 
        }
    }
};