// src/app/reports/service.ts
import axios from 'axios';
import { env } from '@/config/env';
import { ReportItem, ReportFilter } from './types';

const API_URL = env.reportsApiUrl; 

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
        } catch (error: unknown) {
            if (axios.isCancel(error)) {
                throw error;
            }
            const message = error instanceof Error ? error.message : String(error);
            console.error('Error fetching reports:', message);
            return [];
        }
    }
};