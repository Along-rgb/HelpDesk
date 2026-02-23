// src/uikit/MenuApps/hooks/useAdminUsers.ts — GET /api/users/admin (ຊື່ວິຊາການ)
import { useState, useCallback, useEffect } from 'react';
import axiosClientsHelpDesk from '@/config/axiosClientsHelpDesk';
import type { AdminAssignUser } from '../types';

/** ຊື່ວິຊາການ — response: array of { id, username, employee: { first_name, last_name, divisionId, ... } } */
const ENDPOINT = 'users/admin';

/** enabled=false: ไม่เรียก API (Role 1 ບໍ່ໃຊ້ tab ວິຊາການ — หลีกเลี่ยง Forbidden) */
export function useAdminUsers(triggerFetch: unknown = null, enabled: boolean = true) {
    const [items, setItems] = useState<AdminAssignUser[]>([]);
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
