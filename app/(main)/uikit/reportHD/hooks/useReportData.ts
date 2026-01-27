// src/app/reports/hooks/useReportData.ts
import { useState, useEffect } from 'react';
import { ReportService } from '../test';
import { ReportItem } from '../types';

export function useReportData(activeIndex: number, dateRange: Date[] | any) {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<ReportItem[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // สร้าง Controller สำหรับยกเลิก request เก่า
        const controller = new AbortController();
        
        const fetchData = async () => {
            // ✅ Logic ใหม่: ตรวจสอบก่อนว่าเลือกวันที่ครบหรือยัง
            // ถ้า dateRange เป็น null, หรือว่าง, หรือเลือกไม่ครบทั้ง Start/End
            if (!dateRange || dateRange.length < 2 || !dateRange[0] || !dateRange[1]) {
                setData([]); // สั่งให้ข้อมูลเป็นค่าว่างทันที
                setLoading(false);
                return; // จบการทำงาน ไม่ต้องไปเรียก API
            }

            setLoading(true);
            setError(null);
            
            try {
                const filter = {
                    startDate: dateRange[0],
                    endDate: dateRange[1],
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

        // Cleanup function
        return () => {
            controller.abort();
        };
    }, [activeIndex, dateRange]);

    return { data, loading, error };
}