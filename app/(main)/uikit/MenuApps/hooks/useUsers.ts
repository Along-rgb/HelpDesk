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
        if (enabled) {
            // ຄັ້ງທຳອິດ (ຍັງບໍ່ມີຂໍ້ມູນ) ເອີ້ນ API; ກັບມາແຖບອີກຄັ້ງ ບໍ່ refetch ເພື່ອບໍ່ໃຫ້ຂໍ້ມູນຫາຍ/loading ຊ້ຳ
            if (items.length === 0) fetchData();
        }
        // ບໍ່ລ້າງ items ເມື່ອ enabled=false ເພື່ອເມື່ອກັບມາແຖບ ສະແດງຂໍ້ມູນເກົ່າໄດ້ທັນທີ
    }, [fetchData, triggerFetch, enabled, items.length]);

    return { items, loading, fetchData };
}
