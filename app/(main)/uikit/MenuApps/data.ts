// src/uikit/MenuApps/data.ts
import { MenuItem } from './types';

export const MENU_ITEMS: MenuItem[] = [
    {
        id: 'users',
        title: 'ຜູ້ໃຊ້ ແລະ ການອະນຸຍາດ',
        icon: 'pi pi-users',
        path: '/uikit/MenuApps/Detail-category-SupportTeam',
        subMenus: [
            { label: 'ທິມສະໜັບສະໜູນ', tabIndex: 0 },
            { label: 'ວິຊາການ', tabIndex: 1 },
            { label: 'ສະຖານະ', tabIndex: 2 },
            { label: 'ພະນັກງານ', tabIndex: 3 }
        ]
    },
    {
        id: 'locations',
        title: 'ອາຄານສະຖານທີ່',
        icon: 'pi pi-building',
        path: '/uikit/MenuApps/Detail-category-Buildings',
        subMenus: [
            { label: 'ຕຶກ/ອາຄານ', tabIndex: 0 },
            { label: 'ລະດັບຊັ້ນ', tabIndex: 1 }
        ]
    },
    {
        id: 'issues',
        title: 'ການແຈ້ງບັນຫາ',
        icon: 'pi pi-ticket',
        path: '/uikit/MenuApps/Detail-category-Issues',
        subMenus: [
            { label: 'ໝວດໝູ່', tabIndex: 0 },
            { label: 'ລາຍການຫົວຂໍ້', tabIndex: 1 },
            { label: 'ເພີ່ມໄອຄອນ', tabIndex: 2 }
        ]
    }
];