// app/(main)/uikit/invalidstate/ticketData.ts
import { City } from './types';

// 1. กำหนดข้อมูลหมวดหมู่ที่นี่ "ที่เดียว"
export const STATIC_CATEGORIES: City[] = [
    { name: "ຄອມພີວເຕີທົ່ວໄປ (computer)", code: "IT" },
    { name: "ອິນເຕີເນັດ-ເນັດເວີກ (Internet-Network)", code: "NET" },
    { name: "ໂປຣແກຣມ (Software)", code: "SOFT" },
    { name: "ການສື່ສານ (Communication)", code: "PHONE" },
     { name: "ຂໍບໍລິການກ່ຽວກັບຄອມພີວເຕີທົ່ວໄປ (computer)", code: "SerCOM" },
      { name: "ຂໍບໍລິການກ່ຽວກັບໂປຣແກຮມ (Software)", code: "SerSOFT" },
       { name: "ຂໍບໍລິການອື່ນໆ (Other Services)", code: "SerOTHER" },
];

// 2. สร้าง Map สำหรับค้นหาชื่อจาก Code (O(1) Lookup) เพื่อใช้ในหน้า UI
// ผลลัพธ์จะเป็น: { "IT": "ຄອມພີວເຕີທົ່ວໄປ...", "NET": "..." }
export const CATEGORY_MAP: Record<string, string> = STATIC_CATEGORIES.reduce((acc, curr) => {
    if (curr.code) acc[curr.code] = curr.name;
    return acc;
}, {} as Record<string, string>);