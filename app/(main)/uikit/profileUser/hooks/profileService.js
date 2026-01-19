// ไฟล์นี้มีไว้เพื่อให้โค้ดเป็นระเบียบ ถ้ามีปัญหาเรื่องการเชื่อมต่อ หรือ URL ผิด ให้มาดูที่ไฟล์นี้เป็นที่แรก
// src/profile/profileService.js
import axiosClientsHelpDesk from '../../../../../config/axiosClientsHelpDesk';
import fakeDb from '../../../../../Fake-DB.json'; // Import ฐานข้อมูลจำลอง

const IS_MOCK_DATA = true;

/**
 * ดึงข้อมูล Master Data (Dropdown lists)
 * ตัด Delay ออกแล้ว ข้อมูลจะมาทันที
 */
export const getMasterData = async () => {
  if (IS_MOCK_DATA) {
    // Return ข้อมูลจาก JSON ทันที ไม่ต้องรอ
    return Promise.resolve({
      departments: fakeDb.departments,
      divisions: fakeDb.divisions,
      positions: fakeDb.positions
    });
  }

  try {
    // กรณีใช้ API จริง
    // const response = await axiosClientsHelpDesk.get('/master-data');
    // return response.data;
    return { departments: [], divisions: [], positions: [] };
  } catch (error) {
    console.error("Error fetching master data:", error);
    throw error;
  }
};

/**
 * ดึงข้อมูล Profile ตาม ID
 * @param {string} employeeId 
 */
export const getUserProfile = async (employeeId) => {
  if (IS_MOCK_DATA) {
    // ค้นหา User ใน JSON ทันที
    const foundUser = fakeDb.employees.find(emp => emp.employeeId === employeeId);
    
    if (foundUser) {
      return Promise.resolve(foundUser);
    } else {
      return Promise.reject(new Error("User not found in Mock DB"));
    }
  }

  try {
    const response = await axiosClientsHelpDesk.get(`/employees/${employeeId}`);
    return response.data; 
  } catch (error) {
    throw error;
  }
};

/**
 * อัปเดตข้อมูล Profile
 */
export const updateUserProfile = async (data) => {
  if (IS_MOCK_DATA) {
    console.log("Mock DB Updated:", data);
    return Promise.resolve({ success: true });
  }

  try {
    const response = await axiosClientsHelpDesk.put('/employees/update', data);
    return response.data;
  } catch (error) {
    throw error;
  }
};