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

    const fetchData = useCallback(async (signal?: AbortSignal) => {
        if (!enabled) return;
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
    }, [enabled]);

    useEffect(() => {
        if (!enabled) { setItems([]); return; }
        const controller = new AbortController();
        fetchData(controller.signal);
        return () => controller.abort();
    }, [fetchData, triggerFetch, enabled]);

    /** Expose fetchData for external refresh (e.g. after save on SupportTeam page) */
    return { items, loading, fetchData };
}
