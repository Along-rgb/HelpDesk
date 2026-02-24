// src/uikit/MenuApps/hooks/useAdminAssignUsers.ts
import { useState, useCallback, useEffect } from 'react';
import axiosClientsHelpDesk from '@/config/axiosClientsHelpDesk';
import type { AdminAssignUser } from '../types';

const ENDPOINT = 'users/adminassign';

/** enabled=false: ไม่เรียก API (สำหรับ Role 1 เพื่อหลีกเลี่ยง Forbidden). Role 2 ໃຊ້ GET/POST/PUT/DELETE ວິຊາການ. */
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

    /** POST (no id) or PUT (with id) to ENDPOINT. Returns true on success, false on error. */
    const saveData = useCallback(async (payload: Record<string, unknown>, id?: number): Promise<boolean> => {
        try {
            if (id != null) {
                await axiosClientsHelpDesk.put(`${ENDPOINT}/${id}`, payload);
            } else {
                await axiosClientsHelpDesk.post(ENDPOINT, payload);
            }
            await fetchData();
            return true;
        } catch {
            return false;
        }
    }, [fetchData]);

    /** DELETE by item.id, then refresh. Returns true on success, false on error. */
    const deleteData = useCallback(async (item: { id: number }): Promise<boolean> => {
        try {
            await axiosClientsHelpDesk.delete(`${ENDPOINT}/${item.id}`);
            await fetchData();
            return true;
        } catch {
            return false;
        }
    }, [fetchData]);

    return { items, loading, fetchData, saveData, deleteData };
}
