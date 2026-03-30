// src/app/reports/utils/reportConfig.ts
import { ColumnProps } from 'primereact/column';

export const MENU_ITEMS = [
    { label: 'ແຍກຕາມຫົວຂໍ້ເລື່ອງ', icon: 'pi pi-list' },
    { label: 'ແຍກຕາມໝວດໝູ່', icon: 'pi pi-tags' },
    { label: 'ແຍກຕາມສັງກັດ', icon: 'pi pi-building' },
    { label: 'ແຍກຕາມວິຊາການຊ່າງ', icon: 'pi pi-users' }
];

export const getGroupConfig = (index: number) => {
    switch (index) {
        case 0: return { field: 'topic', label: 'ຫົວຂໍ້' };
        case 1: return { field: 'category', label: 'ໝວດໝູ່' };
        case 2: return { field: 'department_main', label: 'ຝ່າຍ' };
        case 3: return { field: 'technician', label: 'ວີຊາການ' }; 
        default: return { field: 'topic', label: 'ຫົວຂໍ້' };
    }
};

export const getViewConfig = (activeIndex: number) => ({
    isDepartmentTab: activeIndex === 2,
    showCategory: activeIndex !== 1,
    showTopic: activeIndex !== 0,
    // แสดงสถานะสำหรับ tab 0, 1, 2 (แทนที่ note column)
    showStatus: activeIndex !== 3,
    // ซ่อน note column ทั้งหมด (ใช้ status แทน)
    showNote: false,
});