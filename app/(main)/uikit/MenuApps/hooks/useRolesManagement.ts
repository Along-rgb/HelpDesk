// src/uikit/MenuApps/hooks/useRolesManagement.ts — GET/PUT/DELETE /api/roles (SuperAdmin only)
import { useState, useRef, useCallback, useEffect } from 'react';
import { Toast } from 'primereact/toast';
import axiosClientsHelpDesk from '@/config/axiosClientsHelpDesk';
import type { RoleData } from '../types';

const ENDPOINT = 'roles';

export function useRolesManagement(enabled: boolean = true) {
    const toast = useRef<Toast>(null);
    const [items, setItems] = useState<RoleData[]>([]);
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
            setLoading(true);
            fetchData();
        }
    }, [fetchData, enabled]);

    const saveData = useCallback(
        async (payload: { name: string; description?: string }, id?: number): Promise<boolean> => {
            try {
                if (id != null) {
                    await axiosClientsHelpDesk.put(`${ENDPOINT}/${id}`, payload);
                } else {
                    await axiosClientsHelpDesk.put(ENDPOINT, payload);
                }
                toast.current?.show({ severity: 'success', summary: 'Success', detail: id ? 'ແກ້ໄຂຂໍ້ມູນສຳເລັດ' : 'ເພີ່ມຂໍ້ມູນສຳເລັດ' });
                await fetchData();
                return true;
            } catch (err: unknown) {
                const msg =
                    err && typeof err === 'object' && 'response' in err
                        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
                        : null;
                const detail = typeof msg === 'string' ? msg : 'ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກ';
                toast.current?.show({ severity: 'error', summary: 'Error', detail, life: 4000 });
                return false;
            }
        },
        [fetchData]
    );

    const deleteData = useCallback(
        async (item: RoleData): Promise<void> => {
            try {
                await axiosClientsHelpDesk.delete(`${ENDPOINT}/${item.id}`);
                toast.current?.show({ severity: 'success', summary: 'Success', detail: 'ລຶບຂໍ້ມູນສຳເລັດ' });
                await fetchData();
            } catch (err: unknown) {
                const msg =
                    err && typeof err === 'object' && 'response' in err
                        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
                        : null;
                const detail = typeof msg === 'string' ? msg : 'ລຶບຂໍ້ມູນບໍ່ສຳເລັດ';
                toast.current?.show({ severity: 'error', summary: 'Error', detail, life: 4000 });
            }
        },
        [fetchData]
    );

    return {
        toast,
        items,
        loading,
        saveData,
        deleteData,
        fetchData,
    };
}
