// src/app/reports/hooks/useReportData.ts
import { useState, useEffect, useMemo } from 'react';
import { ReportService } from '@/app/(main)/uikit/reportHD/service';
import { ReportItem } from '@/app/(main)/uikit/reportHD/types';

export function useReportData(activeIndex: number, dateRange: Date[] | any) {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<ReportItem[]>([]);
    const [error, setError] = useState<string | null>(null);

    const startTs = dateRange?.[0] instanceof Date ? dateRange[0].getTime() : 0;
    const endTs = dateRange?.[1] instanceof Date ? dateRange[1].getTime() : 0;

    const stableDateRange = useMemo(() => {
        if (!startTs || !endTs) return null;
        return [new Date(startTs), new Date(endTs)] as const;
    }, [startTs, endTs]);

    useEffect(() => {
        const controller = new AbortController();

        const fetchData = async () => {
            if (!stableDateRange) {
                setData([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const filter = {
                    startDate: stableDateRange[0],
                    endDate: stableDateRange[1],
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
    }, [activeIndex, stableDateRange]);

    return { data, loading, error };
}