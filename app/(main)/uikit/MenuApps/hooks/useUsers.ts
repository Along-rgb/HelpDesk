// src/uikit/MenuApps/hooks/useUsers.ts — GET /api/users (Role 1 only; Role 2 ใช้ /api/users/admin ผ่าน useAdminUsers)
import { useState, useCallback, useEffect } from 'react';
import axiosClientsHelpDesk from '@/config/axiosClientsHelpDesk';
import type { AdminAssignUser } from '../types';

/** Role 1 (SuperAdmin) — response: array of users จาก /api/users (ຫ້າມ Role 2 ເອີ້ນ endpoint ນີ້ ເພາະຈະໄດ້ 403) */
const ENDPOINT = 'users';

/** enabled=false: ບໍ່ເອີ້ນ API (ໃຊ້ເມື່ອບໍ່ແມ່ນ Role 1 ເພື່ອຫຼີກເວັ້ນ Forbidden) */
export function useUsers(triggerFetch: unknown = null, enabled: boolean = true) {
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

    return { items, loading, fetchData };
}
