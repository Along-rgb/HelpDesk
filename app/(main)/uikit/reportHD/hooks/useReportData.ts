// src/app/reports/hooks/useReportData.ts
import { useState, useEffect } from 'react';
import { ReportService } from '@/app/(main)/uikit/reportHD/service';
import { ReportItem } from '@/app/(main)/uikit/reportHD/types';

export function useReportData(activeIndex: number, dateRange: Date[] | any) {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<ReportItem[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();

        const fetchData = async () => {
            if (!dateRange || dateRange.length < 2 || !dateRange[0] || !dateRange[1]) {
                setData([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const filter = {
                    startDate: dateRange[0],
                    endDate: dateRange[1],
                    tabIndex: activeIndex
                };
                const result = await ReportService.getReports(filter, controller.signal);

                if (!controller.signal.aborted) {
                    setData(result);
                }
            } catch (err: unknown) {
                const e = err as { name?: string; code?: string };
                if (!controller.signal.aborted && e.name !== 'CanceledError' && e.code !== 'ERR_CANCELED') {
                    if (process.env.NODE_ENV === 'development') {
                        const message = err instanceof Error ? err.message : String(err);
                        console.error('Report fetch error:', message);
                    }
                    setError('ເກີດຂໍ້ຜິດພາດກະລຸນາລໍຖ້າ');
                    setData([]);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        fetchData();

        return () => {
            controller.abort();
        };
    }, [activeIndex, dateRange]);

    return { data, loading, error };
}