// =====================================================
// useProfile Hook - แสดงข้อมูลคนที่ login เท่านั้น (read-only)
// ไม่เรียก Master Data (departments, divisions, positions) — ຕຳແໜ່ງ, ຝ່າຍ, ພະແນກ, ໜ່ວຍງານ จาก profileData เท่านั้น
// =====================================================

import { useEffect } from 'react';
import { useUserProfileStore } from '@/app/store/user/userProfileStore';

const LOG = (msg: string, data?: unknown) => {
  console.log('[profileUser]', msg, data !== undefined ? data : '');
};

export const useProfile = () => {
  const { profileData, loading, error, fetchUserProfile } = useUserProfileStore();
  LOG('useProfile render', { loading, hasError: !!error, hasProfileData: !!profileData });

  useEffect(() => {
    LOG('useProfile mount: ເອີ້ນ fetchUserProfile');
    fetchUserProfile();
  }, [fetchUserProfile]);

  return {
    loading,
    error,
    profileData,
  };
};
