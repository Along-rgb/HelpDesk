// src/uikit/MenuApps/hooks/useAdminAssignUsers.ts
import { useState, useCallback, useEffect } from 'react';
import axiosClientsHelpDesk from '@/config/axiosClientsHelpDesk';
import type { AdminAssignUser } from '../types';

const ENDPOINT = 'users/adminassign';

/** enabled=false: ไม่เรียก API (สำหรับ Role 1 เพื่อหลีกเลี่ยง Forbidden) */
export function useAdminAssignUsers(triggerFetch: unknown = null, enabled: boolean = true) {
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
