// =====================================================
// User Profile API Response Types
// ตรงกับโครงสร้าง API Response จาก Backend
// =====================================================

export namespace UserProfile {
  // Department (ຝ່າຍ)
  export interface Department {
    id: number;
    department_name: string;
    department_code: string;
    department_status: string;
  }

  // Division (ພະແນກ/ສູນ)
  export interface Division {
    id: number;
    division_name: string;
    division_code: string;
    division_status: string;
    branch_id: number;
    departmentId: number;
  }

  // Office (ຫ້ອງການ)
  export interface Office {
    id: number;
    office_name: string;
    office_code: string;
    office_status: string;
  }

  // Unit (ໜ່ວຍງານ)
  export interface Unit {
    id: number;
    unit_name: string;
    unit_code: string;
    unit_status: string;
    unit_type: string;
    divisionId: number;
    officeId: number | null;
  }

  // Position (ຕຳແໜ່ງ)
  export interface Position {
    id: number;
    pos_name: string;
    pos_status: string;
    poscodeId: number;
  }

  // PositionCode (รหัสตำแหน่ง - Join กับ Position ผ่าน poscodeId)
  export interface PositionCode {
    id: number;
    pos_code_name: string;
    pos_code_status: string;
    posgroupId: number;
  }

  // Role
  export interface Role {
    id: number;
    name: string;
    description: string;
  }

  // Employee Detail (ຂໍ້ມູນພະນັກງານ)
  export interface Employee {
    id: number;
    first_name: string;
    last_name: string;
    emp_code: string;
    status: string;
    gender: string;
    tel: string;
    email: string | null;
    empimg: string;
    posId: number;
    departmentId: number;
    divisionId: number;
    officeId: number | null;
    unitId: number;
    createdAt: string;
    updatedAt: string;
    // Relations
    department: Department;
    division: Division;
    office: Office | null;
    unit: Unit;
    position: Position;
  }

  // User Login Response (Response จาก API Login)
  export interface UserLoginResponse {
    id: number;
    username: string;
    employeeId: number;
    roleId: number;
    role: Role;
    employee: Employee;
  }

  // Profile Display Data (ข้อมูลที่ใช้แสดงผลในหน้า Profile)
  export interface ProfileDisplayData {
    // Basic Info
    employeeId: string;
    emp_code: string;
    first_name: string;
    last_name: string;
    fullName: string;

    // Contact
    tel: string;
    email: string;

    // Organization
    department_name: string;
    division_name: string;
    unit_name: string;
    pos_name: string;

    // Image
    empimg: string;

    // Additional
    gender: string;
    status: string;
  }

  // Update Profile Request
  export interface UpdateProfileRequest {
    employeeId: number;
    first_name?: string;
    last_name?: string;
    tel?: string;
    email?: string;
  }

  // Profile Store State
  export interface ProfileStore {
    // State
    loading: boolean;
    error: string | null;
    currentUser: UserLoginResponse | null;
    profileData: ProfileDisplayData | null;

    // Actions
    setCurrentUser: (user: UserLoginResponse) => void;
    fetchUserProfile: () => Promise<void>;
    updateProfile: (data: UpdateProfileRequest) => Promise<void>;
    clearProfile: () => void;
  }
}
