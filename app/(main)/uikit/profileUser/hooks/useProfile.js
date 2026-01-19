// รวม Logic การดึงข้อมูล, การบันทึก และ State ทั้งหมดไว้ที่นี่)

import { useState, useEffect } from 'react';
// ปรับ path ให้ตรงกับตำแหน่งไฟล์ service ของคุณ
import { getUserProfile, updateUserProfile, getMasterData } from './profileService'; 

export const useProfile = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [originalData, setOriginalData] = useState(null);
  const [masterData, setMasterData] = useState({ departments: [], divisions: [], positions: [] });
  const [formData, setFormData] = useState({
    employeeId: '', firstName: '', lastName: '',
    department: '', division: '', position: '',
    email: '', contactPhone: '', appPhone: ''
  });

  // Load Data
  useEffect(() => {
    const initPageData = async () => {
      setLoading(true);
      try {
        const [masterRes, profileRes] = await Promise.all([
          getMasterData(),
          getUserProfile('39879') // TODO: อาจจะเปลี่ยนเป็นรับ userId จาก props หรือ context ได้ในอนาคต
        ]);
        setMasterData(masterRes);
        
        const initData = {
            employeeId: profileRes.employeeId || '',
            firstName: profileRes.firstName || '',
            lastName: profileRes.lastName || '',
            department: profileRes.department || '',
            division: profileRes.division || '',
            position: profileRes.position || '',
            email: profileRes.email || '',
            contactPhone: profileRes.contactPhone || '',
            appPhone: profileRes.appPhone || ''
        };
        setFormData(initData);
        setOriginalData(initData);
      } catch (err) {
        console.error(err);
        setError('ບໍ່ສາມາດດຶງຂໍ້ມູນໄດ້');
      } finally {
        setLoading(false);
      }
    };
    initPageData();
  }, []);

  // Handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDropdownChange = (e, name) => {
    setFormData(prev => ({ ...prev, [name]: e.value }));
  };

  const handleToggleEdit = () => {
    if (isEditing) setFormData(originalData); // Revert ข้อมูลถ้ากดยกเลิก
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateUserProfile(formData);
      alert('ບັນທຶກສຳເລັດ');
      setOriginalData(formData);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      alert('ເກີດຂໍ້ຜິດພາດ');
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
    masterData,
    handleChange,
    handleDropdownChange,
    handleToggleEdit,
    handleSave
  };
};