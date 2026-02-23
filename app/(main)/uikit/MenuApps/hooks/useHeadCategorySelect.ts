// src/uikit/MenuApps/hooks/useHeadCategorySelect.ts
import { useState, useCallback, useEffect } from 'react';
import axiosClientsHelpDesk from '@/config/axiosClientsHelpDesk';
import type { HeadCategorySelectItem } from '../types';

/** ເລືອກທີມຊ່ວຍເຫຼືອ — response: array of { id, name, description, departmentId, divisionId, createdAt, updatedAt } */
const ENDPOINT = 'headcategorys/selectheadcategory';

/** enabled=false: ไม่เรียก API (Role 1 ບໍ່ໃຊ້ tab ວິຊາການ — หลีกเลี่ยง Forbidden) */
export function useHeadCategorySelect(triggerFetch: unknown = null, enabled: boolean = true) {
    const [items, setItems] = useState<HeadCategorySelectItem[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchData = useCallback(async () => {
        if (!enabled) return;
        setLoading(true);
        try {
            const response = await axiosClientsHelpDesk.get(ENDPOINT);
            const data = response.data;
            if (Array.isArray(data)) {
                setItems(data);
            } else if (data?.data && Array.isArray(data.data)) {
                setItems(data.data);
            } else {
                setItems([]);
            }
        } catch {
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [enabled]);

    useEffect(() => {
        if (enabled) fetchData();
        else setItems([]);
    }, [fetchData, triggerFetch, enabled]);

    /** Expose fetchData for external refresh (e.g. after save on SupportTeam page) */
    return { items, loading, fetchData };
}
