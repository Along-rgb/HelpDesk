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

    const fetchData = useCallback(async () => {
        if (!shouldFetch) return;
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
    }, [shouldFetch]);

    useEffect(() => {
        if (shouldFetch) {
            setLoading(true); // ບໍ່ໃຫ້ແສງ empty ຕອນເປີດໜ້າ/refresh
            fetchData();
        }
        // ບໍ່ລ້າງ items ເມື່ອ shouldFetch ເປັນ false — ເກັບ cache ເພື່ອບໍ່ໃຫ້ແສງ "ບໍ່ພົບຂໍ້ມູນ" ຕອນສະຫຼັບ tab
    }, [fetchData, triggerFetch, shouldFetch]);

    /** Expose fetchData for external refresh (e.g. after save on SupportTeam page) */
    return { items, loading, fetchData };
}
