// src/uikit/MenuApps/hooks/useUserRoles.ts — full CRUD on /api/user-roles (placeholder; update endpoint as needed)
import { useCoreApi } from './useCoreApi';
import type { UserRoleData, CreateUserRolePayload, UpdateUserRolePayload } from '../types';

const ENDPOINT = 'user-roles';

export function useUserRoles(enabled: boolean = true) {
    const { toast, items, loading, saveData, deleteData, fetchData } = useCoreApi<
        UserRoleData,
        CreateUserRolePayload | UpdateUserRolePayload
    >(ENDPOINT, {}, null, enabled, { silentFetchError: true });

    return {
        toast,
        items,
        loading,
        saveData,
        deleteData: (item: UserRoleData) => deleteData(item.id),
        fetchData,
    };
}
