// src/uikit/MenuApps/hooks/useUserRoles.ts
// ຕາມ API.md: ບໍ່ມີ /api/user-roles ຫຼື /api/userroles. ລາຍການສະຖານະ = ລາຍຜູ້ໃຊ້ຈາກ /api/users (Role 1) ຫຼື /api/users/admin (Role 2). ແກ້ໄຂສິດ ໃຊ້ PUT /api/users/[id] (ຕາມ API.md บรรทัด 414).
import { useState, useRef, useCallback, useEffect } from 'react';
import { Toast } from 'primereact/toast';
import axiosClientsHelpDesk from '@/config/axiosClientsHelpDesk';
import type { UserRoleData, CreateUserRolePayload, UpdateUserRolePayload } from '../types';
import type { AdminAssignUser } from '../types';

function mapUserToRoleData(u: AdminAssignUser): UserRoleData {
    const first = u.employee?.first_name ?? '';
    const last = u.employee?.last_name ?? '';
    const userName = `${first} ${last}`.trim() || u.username || String(u.id);
    return {
        id: u.id,
        userId: u.id,
        userName,
        roleId: u.roleId,
        roleName: u.role?.name,
    };
}

/** Role 1 → GET /api/users, Role 2 → GET /api/users/admin. ບໍ່ເອີ້ນ endpoint ທີ່ບໍ່ມີໃນ API.md. */
function getUsersEndpoint(roleId: number | string | null | undefined): string {
    return Number(roleId) === 2 ? 'users/admin' : 'users';
}

export function useUserRoles(
    roleId: number | string | null | undefined,
    enabled: boolean = true
) {
    const toast = useRef<Toast>(null);
    const [items, setItems] = useState<UserRoleData[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchData = useCallback(async () => {
        if (!enabled || (Number(roleId) !== 1 && Number(roleId) !== 2)) {
            setItems([]);
            return;
        }
        const endpoint = getUsersEndpoint(roleId);
        setLoading(true);
        try {
            const response = await axiosClientsHelpDesk.get<AdminAssignUser[]>(endpoint);
            const data = response.data;
            const list = Array.isArray(data) ? data : (data as { data?: AdminAssignUser[] })?.data;
            const arr = Array.isArray(list) ? list : [];
            setItems(arr.map(mapUserToRoleData));
        } catch {
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [roleId, enabled]);

    useEffect(() => {
        if (enabled) fetchData();
        else setItems([]);
    }, [fetchData, enabled]);

    const saveData = useCallback(
        async (payload: CreateUserRolePayload | UpdateUserRolePayload, _id?: number): Promise<boolean> => {
            try {
                const userId = payload.userId;
                await axiosClientsHelpDesk.put(`users/${userId}`, {
                    roleId: payload.roleId,
                    ...(payload.description != null && payload.description !== '' ? { description: payload.description } : {}),
                });
                toast.current?.show({ severity: 'success', summary: 'Success', detail: 'ແກ້ໄຂຂໍ້ມູນສຳເລັດ' });
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
        async (item: UserRoleData): Promise<void> => {
            try {
                await axiosClientsHelpDesk.delete(`users/${item.userId}`);
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
