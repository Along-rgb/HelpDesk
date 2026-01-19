// src/components/settings/data.ts
import { MenuItem } from './types';

// ปรับโครงสร้างข้อมูลให้ระบุ "tabIndex" ได้ชัดเจน
export const MENU_ITEMS: any[] = [ // ใช้ any ชั่วคราว หรือแก้ Interface MenuItem ให้รองรับ subMenus
    {
        id: 'users',
        title: 'ຜູ້ໃຊ້ ແລະ ການອະນຸຍາດ',
        icon: 'pi pi-users',
        path: '/uikit/MenuApps/Detail-category_SupportTeam',
        // [Clean Code] เปลี่ยนจาก descriptions ธรรมดา เป็น subMenus ที่มี target ชัดเจน
        subMenus: [
            // { label: 'ກຸ່ມທີມຊ່ວຍເຫຼືອ', tabIndex: 0 },
            { label: 'ວິຊາການ', tabIndex: 0 }, 
            { label: 'ຜູ້ຄຸ້ມຄອງລະບົບ', tabIndex: 1 },
            { label: 'ຜູ້ຮ້ອງຂໍ', tabIndex: 2 }
        ]
    },
    {
        id: 'locations',
        title: 'ອາຄານສະຖານທີ່',
        icon: 'pi pi-building',
        path: '/uikit/MenuApps/Detail-category_Buildings',
        subMenus: [
            { label: 'ຕຶກ/ອາຄານ', tabIndex: 0 },
            { label: 'ລະດັບຊັ້ນ', tabIndex: 1 },
            { label: 'ຫ້ອງ', tabIndex: 2 }
        ]
    },
    {
        id: 'issues',
        title: 'ການແຈ້ງບັນຫາ',
        icon: 'pi pi-ticket',
        path: '/uikit/MenuApps/Detail-category_Issues',
        subMenus: [
            { label: 'ໝວດໝູ່', tabIndex: 0 },
            { label: 'ລາຍການຫົວຂໍ້', tabIndex: 1 }
        ]
    },
    {
        id: 'services',
        title: 'ການຮ້ອງຂໍບໍລິການ',
        icon: 'pi pi-shopping-cart',
        path: '/uikit/MenuApps/Detail-category_Service_Requests',
        subMenus: [
            { label: 'ໝວດໝູ່', tabIndex: 0 },
            { label: 'ລາຍການຫົວຂໍ້', tabIndex: 1 }
        ]
    }
];