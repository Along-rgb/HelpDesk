// src/uikit/MenuApps/data.ts
import { MenuItem } from './types';

export const MENU_ITEMS: MenuItem[] = [
    {
        id: 'users',
        title: 'ຜູ້ໃຊ້ ແລະ ການອະນຸຍາດ',
        icon: 'pi pi-users',
        path: '/uikit/MenuApps/Detail-category_SupportTeam',
        subMenus: [
            { label: 'ໝວດບັນຫາ', tabIndex: 0 },
            { label: 'ວິຊາການ', tabIndex: 1 },
            { label: 'ທີມຄຸ້ມຄອງ', tabIndex: 2 }
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