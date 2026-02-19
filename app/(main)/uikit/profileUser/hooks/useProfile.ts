// =====================================================
// useProfile Hook - Clean Architecture
// รวม Logic การดึงข้อมูล, การบันทึก และ State ทั้งหมด
// =====================================================

import { useState, useEffect, useMemo } from 'react';
import { useUserProfileStore } from '@/app/store/user/userProfileStore';
import { updateUserProfile, getMasterData } from './profileService';
import { UserProfile } from '@/global/types';

export type DropdownOption = { label: string; code: number };

export const useProfile = () => {
  // ดึง State และ Actions จาก Store (currentUser มี employee.departmentId, divisionId, posId)
  const { profileData, currentUser, loading, error, fetchUserProfile } = useUserProfileStore();

  // Master data จาก API (departments, divisions, positions, positionCodes)
  const [masterRaw, setMasterRaw] = useState<{
    departments: UserProfile.Department[];
    divisions: UserProfile.Division[];
    positions: UserProfile.Position[];
    positionCodes: UserProfile.PositionCode[];
  }>({
    departments: [],
    divisions: [],
    positions: [],
    positionCodes: [],
  });

  // Local UI State
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [originalData, setOriginalData] = useState<any>(null);
  const [formData, setFormData] = useState({
    employeeId: '',
    firstName: '',
    lastName: '',
    departmentId: null as number | null,
    divisionId: null as number | null,
    posId: null as number | null,
    email: '',
    contactPhone: '',
    appPhone: '',
  });

  // =========================================
  // Load Profile + Master Data เมื่อ Mount
  // =========================================
  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  useEffect(() => {
    getMasterData().then(setMasterRaw);
  }, []);

  // =========================================
  // ค่าเริ่มต้นจาก employee (departmentId, divisionId, posId)
  // =========================================
  useEffect(() => {
    const emp = currentUser?.employee;
    if (emp) {
      const mapped = {
        employeeId: String(emp.id ?? ''),
        firstName: emp.first_name || '',
        lastName: emp.last_name || '',
        departmentId: emp.departmentId ?? null,
        divisionId: emp.divisionId ?? null,
        posId: emp.posId ?? null,
        email: emp.email || '',
        contactPhone: emp.tel || '',
        appPhone: '' as string,
      };
      setFormData(mapped);
      setOriginalData(mapped);
    }
  }, [currentUser]);

  // =========================================
  // Options สำหรับ Select (useMemo)
  // ຝ່າຍ: [department_code]-department_name
  // ພະແນກ: [division_code]-division_name
  // ຕຳແໜ່ງ: [pos_code_name]-pos_name (Join Position + PositionCode)
  // =========================================
  // ค่าที่แสดงเป็น [code]-name ໃຫ້ຕົວເລກ/ລະຫັດຢູ່ໃນ [ ]
  const departmentOptions: DropdownOption[] = useMemo(() => {
    return masterRaw.departments.map((d) => ({
      label: `[${d.department_code}]-${d.department_name}`,
      code: d.id,
    }));
  }, [masterRaw.departments]);

  const divisionOptions: DropdownOption[] = useMemo(() => {
    return masterRaw.divisions.map((d) => ({
      label: `[${d.division_code}]-${d.division_name}`,
      code: d.id,
    }));
  }, [masterRaw.divisions]);

  const positionOptions: DropdownOption[] = useMemo(() => {
    const codeMap = new Map<number, UserProfile.PositionCode>();
    masterRaw.positionCodes.forEach((pc) => codeMap.set(pc.id, pc));
    return masterRaw.positions.map((pos) => {
      const pc = codeMap.get(pos.poscodeId);
      const posCodeName = pc?.pos_code_name ?? '';
      const label = posCodeName ? `[${posCodeName}]-${pos.pos_name}` : pos.pos_name;
      return { label, code: pos.id };
    });
  }, [masterRaw.positions, masterRaw.positionCodes]);

  const masterData = useMemo(
    () => ({
      departmentOptions,
      divisionOptions,
      positionOptions,
    }),
    [departmentOptions, divisionOptions, positionOptions]
  );

  // =========================================
  // Handlers
  // =========================================

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDropdownChange = (e: any, name: string) => {
    const value = e.value ?? null;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggleEdit = () => {
    if (isEditing && originalData) {
      setFormData(originalData);
    }
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      // เตรียมข้อมูลสำหรับ API
      const updateData = {
        employeeId: Number(formData.employeeId),
        first_name: formData.firstName,
        last_name: formData.lastName,
        tel: formData.contactPhone,
        email: formData.email,
      };

      // เรียก API อัปเดต
      await updateUserProfile(updateData);

      alert('ບັນທຶກສຳເລັດ');

      // อัปเดต originalData
      setOriginalData(formData);
      setIsEditing(false);

      // Refresh profile data จาก API
      await fetchUserProfile();
    } catch (err: any) {
      console.error('Error saving profile:', err);
      alert('ເກີດຂໍ້ຜິດພາດ: ' + (err?.message || 'ບໍ່ສາມາດບັນທຶກໄດ້'));
    } finally {
      setIsSaving(false);
    }
  };

  return {
    loading,
    error,
    isSaving,
    isEditing,
    formData,
    profileData,
    masterData,
    handleChange,
    handleDropdownChange,
    handleToggleEdit,
    handleSave,
  };
};
