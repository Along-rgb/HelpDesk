//  Logic ການດືງຂໍ້ມູນ, Loading, ແລະ Error handling ມາ file ນີ້
// src/app/reports/hooks/useReportData.ts
import { useState, useEffect } from 'react';
import { ReportService } from '../service'; // เช็ค path ให้ถูกตามโครงสร้างโฟลเดอร์จริง
import { ReportItem } from '../types';

export function useReportData(activeIndex: number, dateRange: Date[] | any) {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<ReportItem[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // สร้าง Controller สำหรับยกเลิก request เก่า
        const controller = new AbortController();
        
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            
            try {
                const filter = {
                    startDate: dateRange?.[0] || null,
                    endDate: dateRange?.[1] || null,
                    tabIndex: activeIndex
                };
                
                // ส่ง signal ไปด้วย
                const result = await ReportService.getReports(filter, controller.signal);
                
                // อัพเดท state เฉพาะเมื่อยังไม่โดน cancel
                if (!controller.signal.aborted) {
                    setData(result);
                }
            } catch (err: any) {
                // กรอง Error ที่เกิดจากการ Cancel ทิ้งไป
                if (!controller.signal.aborted && err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
                    console.error(err);
                    setError("ເກີດຂໍ້ຜິດພາດກະລຸນາລໍຖ້າ");
                    setData([]);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        fetchData();

        // Cleanup function: จะถูกเรียกเมื่อ activeIndex หรือ dateRange เปลี่ยน
        return () => {
            controller.abort();
        };
    }, [activeIndex, dateRange]);

    return { data, loading, error };
}