# 📘 User Profile System - Clean Architecture

## 🎯 สรุประบบ

ระบบแสดงข้อมูล User Profile แบบอัตโนมัติหลังจาก Login โดยใช้ Clean Code Architecture

## 📊 โครงสร้างข้อมูล API

ข้อมูลที่แสดงจาก API Response:
- ✅ `emp_code` - รหัสพนักงาน
- ✅ `first_name` - ชื่อ
- ✅ `last_name` - นามสกุล
- ✅ `department_name` - ชื่อฝ่าย
- ✅ `division_name` - ชื่อพะแนก/สูน
- ✅ `tel` - เบอร์โทรศัพท์
- ✅ `email` - อีเมล
- ✅ `pos_name` - ชื่อตำแหน่ง

## 🏗️ สถาปัตยกรรม (Clean Architecture)

```
📁 HelpDesk_SVC/
│
├── 📁 global/types/
│   ├── userProfile.d.ts          ✨ NEW - TypeScript Types ตรงกับ API
│   └── index.d.ts                🔄 UPDATED - Export types
│
├── 📁 config/
│   └── axiosClientsHelpDesk.ts   ✅ มี Token Interceptor
│
├── 📁 app/store/user/
│   ├── userProfileStore.ts       ✨ NEW - Profile State Management
│   ├── usersStore.ts             ✅ ใช้สำหรับ Login API
│   └── loginAuthStore.ts         ✅ ใช้สำหรับ Auth Token
│
├── 📁 app/(full-page)/auth/login/
│   └── page.tsx                  🔄 UPDATED - บันทึกข้อมูลลง Profile Store
│
├── 📁 app/(main)/uikit/profileUser/
│   ├── page.tsx                  ✨ NEW - Profile Page (TypeScript)
│   ├── page.jsx                  ⚠️ OLD - เก่า (ไม่ใช้แล้ว)
│   └── hooks/
│       ├── useProfile.ts         ✨ NEW - Profile Logic Hook
│       ├── useProfile.js         ⚠️ OLD - เก่า
│       ├── profileService.ts     ✨ NEW - API Service
│       └── profileService.js     ⚠️ OLD - เก่า
│
├── 📁 layout/
│   └── AppMenu.tsx               ✅ ใช้ useUserProfile
│
└── 📁 types/
    └── useUserProfile.ts         🔄 UPDATED - ใช้ข้อมูลจาก Store
```

## 🔄 Flow การทำงาน

### 1️⃣ Login Flow
```
User Login (page.tsx)
    ↓
Call API: /auth/login
    ↓
Response: { data: UserLoginResponse }
    ↓
Save to:
  ├─ localStorage.setItem('token')
  ├─ localStorage.setItem('userData')
  ├─ authenStore.setAuthData()
  └─ userProfileStore.setCurrentUser() ✨ NEW
    ↓
Redirect to /uikit/MainBoard
```

### 2️⃣ Profile Display Flow
```
User เข้าหน้า Profile (/uikit/profileUser)
    ↓
useProfile() Hook
    ↓
fetchUserProfile() from Store
    ↓
Check: มี currentUser ใน Store ไหม?
  ├─ Yes → ใช้ข้อมูลจาก Store
  └─ No → ดึงจาก localStorage
    ↓
Call API: /users/{employeeId}
    ↓
Map ข้อมูลเป็น ProfileDisplayData
    ↓
แสดงผลในหน้า Profile
```

### 3️⃣ Menu Display Flow
```
AppMenu Component
    ↓
useUserProfile() Hook
    ↓
useDisplayName() from Store
    ↓
แสดงชื่อผู้ใช้ใน Menu
```

## 🔧 การใช้งาน

### ดึงข้อมูล Profile ในหน้าต่างๆ

```typescript
import { useUserProfileStore, useProfileData } from '@/app/store/user/userProfileStore';

// ในหน้า Profile
const { profileData, loading, error } = useProfileData();

// ดึงชื่อแสดงใน Menu
import { useDisplayName } from '@/app/store/user/userProfileStore';
const displayName = useDisplayName();

// ดึงข้อมูลทั้งหมดจาก Store
const { currentUser, profileData, fetchUserProfile } = useUserProfileStore();
```

### Update Profile

```typescript
const { updateProfile } = useUserProfileStore();

await updateProfile({
  employeeId: 9191,
  first_name: "ເປີ້ນ",
  last_name: "ມະນີວົງ",
  tel: "02055628617",
  email: "example@edl.com.la"
});
```

## 📝 API Endpoints ที่ใช้

```
POST /auth/login              - Login
GET  /users/{employeeId}      - ดึงข้อมูล Profile
PUT  /users/update            - อัปเดต Profile
```

## ⚙️ Configuration

### ปรับ API Base URL
ไฟล์: `config/axiosClientsHelpDesk.ts`
```typescript
baseURL: 'http://192.168.20.163:4000/api'
```

### Token Management
- Token ถูกเพิ่มอัตโนมัติใน Request Headers ผ่าน Axios Interceptor
- Token ถูกบันทึกใน localStorage key: `'token'`

## 🎨 Features

✅ **Auto-load User Data** - โหลดข้อมูลอัตโนมัติหลัง Login
✅ **Clean Architecture** - แยก Logic, Service, และ UI ชัดเจน
✅ **Type Safety** - ใช้ TypeScript Types ตรงกับ API
✅ **State Persistence** - บันทึกข้อมูลลง localStorage
✅ **Centralized State** - ใช้ Zustand Store จัดการ State
✅ **Real API Integration** - เชื่อมต่อกับ Backend จริง
✅ **Error Handling** - จัดการ Error ทุกขั้นตอน

## 🚀 Next Steps (ถ้าต้องการพัฒนาต่อ)

1. เพิ่ม Master Data API สำหรับ Dropdown (Department, Division, Position)
2. เพิ่ม Image Upload สำหรับแก้ไขรูป Profile
3. เพิ่ม Form Validation ด้วย Zod Schema
4. เพิ่ม Loading Skeleton แทน Text "Loading..."
5. เพิ่ม Toast Notification หลัง Update Profile สำเร็จ

## 🐛 Troubleshooting

### ถ้าข้อมูลไม่แสดง
1. เช็ค Console ว่ามี Error ไหม
2. เช็ค Network Tab ว่า API Call สำเร็จไหม
3. เช็ค localStorage ว่ามี `userData` ไหม
4. เช็ค Token ว่าหมดอายุหรือไม่

### ถ้า API Structure ต่างจากที่กำหนด
1. แก้ไข Types ใน `global/types/userProfile.d.ts`
2. แก้ไข `mapUserToProfileData()` ใน `userProfileStore.ts`

## 📞 Support

หากพบปัญหาหรือต้องการความช่วยเหลือ:
- ตรวจสอบ Console Logs
- ตรวจสอบ Network Requests
- ตรวจสอบ API Response Structure
