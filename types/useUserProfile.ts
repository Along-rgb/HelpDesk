// =====================================================
// useUserProfile Hook - สำหรับใช้ใน AppMenu
// ดึงชื่อผู้ใช้จาก Profile Store
// =====================================================

import { useDisplayName } from '@/app/store/user/userProfileStore';

/**
 * Hook สำหรับดึงชื่อผู้ใช้แสดงใน Menu
 * ใช้ข้อมูลจาก userProfileStore
 */
export const useUserProfile = () => {
    const displayName = useDisplayName();

    return { displayName };
};