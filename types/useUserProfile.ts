// =====================================================
// useUserProfile Hook - สำหรับใช้ใน AppMenu
// ดึงชื่อผู้ใช้และ Role จาก Profile Store (API /api/roles: 1=SuperAdmin, 2=Admin, 3=Staff, 4=User)
// =====================================================

import { useDisplayName } from '@/app/store/user/userProfileStore';
import { useUserProfileStore } from '@/app/store/user/userProfileStore';

export const useUserProfile = () => {
    const displayName = useDisplayName();
    const currentUser = useUserProfileStore((s) => s.currentUser);
    const roleId =
        (currentUser as { roleId?: number; role?: { id?: number } })?.roleId ??
        (currentUser as { role?: { id?: number } })?.role?.id ??
        null;

    const emp = currentUser?.employee as { divisionId?: number; departmentId?: number } | undefined;
    const divisionId = emp?.divisionId ?? null;
    const departmentId = emp?.departmentId ?? null;

    return {
        displayName: displayName || 'User',
        roleId,
        divisionId: divisionId ?? undefined,
        departmentId: departmentId ?? undefined,
    };
};