// src/uikit/MenuApps/hooks/useHeadCategorySelect.ts
import { useState, useCallback, useEffect } from 'react';
import axiosClientsHelpDesk from '@/config/axiosClientsHelpDesk';
import type { HeadCategorySelectItem } from '../types';

/** ເລືອກທີມຊ່ວຍເຫຼືອ — response: array of { id, name, description, departmentId, divisionId, createdAt, updatedAt } */
const ENDPOINT = 'headcategorys/selectheadcategory';

/** shouldFetch=false: ไม่เรียก API (Role 1 ບໍ່ໃຊ້ tab ວິຊາການ — หลีกเลี่ยง Forbidden) */
export function useHeadCategorySelect(triggerFetch: unknown = null, shouldFetch: boolean = true) {
    const [items, setItems] = useState<HeadCategorySelectItem[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchData = useCallback(async (signal?: AbortSignal) => {
        if (!shouldFetch) return;
        setLoading(true);
        try {
            const response = await axiosClientsHelpDesk.get(ENDPOINT, { signal });
            const data = response.data;
            if (Array.isArray(data)) {
                setItems(data);
            } else if (data?.data && Array.isArray(data.data)) {
                setItems(data.data);
            } else {
                setItems([]);
            }
        } catch (err: unknown) {
            if ((err as { name?: string })?.name === 'CanceledError') return;
            setItems([]);
        } finally {
            if (!signal?.aborted) setLoading(false);
        }
    }, [shouldFetch]);

    useEffect(() => {
        if (!shouldFetch) return;
        const controller = new AbortController();
        setLoading(true);
        fetchData(controller.signal);
        return () => controller.abort();
        // ບໍ່ລ້າງ items ເມື່ອ shouldFetch ເປັນ false — ເກັບ cache ເພື່ອບໍ່ໃຫ້ແສງ "ບໍ່ພົບຂໍ້ມູນ" ຕອນສະຫຼັບ tab
    }, [fetchData, triggerFetch, shouldFetch]);

    /** Expose fetchData for external refresh (e.g. after save on SupportTeam page) */
    return { items, loading, fetchData };
}
