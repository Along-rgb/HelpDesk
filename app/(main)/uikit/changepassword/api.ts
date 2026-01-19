// api.ts
import axios from 'axios';

// ⚠️ สำคัญ: แก้ URL นี้ให้ตรงกับ Backend ของคุณ (เช่น http://localhost:8080/...)
const API_URL = '#';

export const validateForm = (data: any) => {
  if (!data.currentPassword || !data.newPassword || !data.confirmPassword) {
    return { isValid: false, message: 'ກະລຸນາຕື່ມຂໍ້ມູນໃຫ້ຄົບຖ້ວນ (Please fill all fields)' };
  }
  if (data.newPassword !== data.confirmPassword) {
    return { isValid: false, message: 'ລະຫັດຜ່ານໃໝ່ບໍ່ກົງກັນ (New passwords do not match)' };
  }
  if (data.newPassword.length < 6) {
    return { isValid: false, message: 'ລະຫັດຜ່ານຕ້ອງມີຢ່າງໜ້ອຍ 6 ຕົວ (Password too short)' };
  }
  return { isValid: true, message: '' };
};

export const changePasswordAPI = async (data: any) => {
  // 1. ดึง Token (ถ้า login แล้วเก็บใน localStorage)
  // ถ้าเก็บที่อื่นให้แก้ตรงนี้ เช่น sessionStorage.getItem('token')
  const token = localStorage.getItem('token'); 

  try {
    const response = await axios.post(API_URL, {
      currentPassword: data.currentPassword,
      newPassword: data.newPassword
    }, {
      // 2. ส่ง Token ไปยืนยันตัวตน
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error: any) {
    // ดึงข้อความ Error จาก Server มาแสดง
    throw new Error(error.response?.data?.message || 'ລະບົບມີບັນຫາ ຫຼື ບໍ່ສາມາດເຊື່ອມຕໍ່ລະບົບໄດ້ ');
  }
};