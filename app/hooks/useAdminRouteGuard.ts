'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserProfileStore } from '@/app/store/user/userProfileStore';
import { AUTH_FORBIDDEN_TOAST_EVENT } from '@/global/types/api';

/** อนุญาตเฉพาะ Role 1 (SuperAdmin) และ 2 (Admin). Whitelist — ค่าอื่นหรือ null ถือว่าไม่มีสิทธิ์ */
const ALLOWED_ROLE_IDS = [1, 2] as const;

const NO_ACCESS_MSG = 'ທ່ານບໍ່ມີສິດເຂົ້າເຖິງໜ້ານີ້';

/**
 * Strict Route Guard สำหรับหน้าส่วน Admin (MainBoard, MenuApps ແລະ ອື່ນ).
 * ກວດ roleId — ຖ້າບໍ່ແມ່ນ 1 ຫຼື 2 ໃຫ້ redirect ໄປ profile ແລະ ແສງ toast.
 * ບໍ່ good ຜູ້ໃຊ້ອອກຕອນ loading ເພາະຂໍ້ມູນ role ອາດຍັງບໍ່ທັນโหลด.
 */
export function useAdminRouteGuard(redirectPath: string = '/uikit/profileUser') {
  const router = useRouter();
  const loading = useUserProfileStore((s) => s.loading);
  const currentUser = useUserProfileStore((s) => s.currentUser);
  const roleId =
    (currentUser as { roleId?: number; role?: { id?: number } })?.roleId ??
    (currentUser as { role?: { id?: number } })?.role?.id ??
    null;

  useEffect(() => {
    if (loading) return;
    if (roleId == null) return;
    if (ALLOWED_ROLE_IDS.includes(roleId as 1 | 2)) return;

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(AUTH_FORBIDDEN_TOAST_EVENT, { detail: { message: NO_ACCESS_MSG } })
      );
    }
    router.push(redirectPath);
  }, [loading, roleId, router, redirectPath]);

  return { loading, roleId, allowed: roleId != null && ALLOWED_ROLE_IDS.includes(roleId as 1 | 2) };
}
