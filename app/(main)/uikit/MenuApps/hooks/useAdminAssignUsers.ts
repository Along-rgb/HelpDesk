// src/uikit/MenuApps/hooks/useAdminAssignUsers.ts
import { useState, useCallback, useEffect } from 'react';
import axiosClientsHelpDesk from '@/config/axiosClientsHelpDesk';
import type { AdminAssignUser } from '../types';

const ENDPOINT = 'users/adminassign';

/** enabled=false: ไม่เรียก API (สำหรับ Role 1 เพื่อหลีกเลี่ยง Forbidden). Role 2 ໃຊ້ GET/POST/PUT/DELETE ວິຊາການ. */
export function useAdminAssignUsers(triggerFetch: unknown = null, enabled: boolean = true) {
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
        if (!enabled) return;
        const controller = new AbortController();
        setLoading(true);
        fetchData(controller.signal);
        return () => controller.abort();
        // ບໍ່ລ້າງ items ເມື່ອ disabled — ເກັບ cache ເພື່ອບໍ່ໃຫ້ແສງ "ບໍ່ພົບຂໍ້ມູນ" ຕອນສະຫຼັບ tab
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
