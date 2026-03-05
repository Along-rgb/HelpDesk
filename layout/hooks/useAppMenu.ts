import { useMemo } from 'react';
import { useUserProfile } from '@/types/useUserProfile';

/** Role ID ตาม API /api/roles: 1=SuperAdmin, 2=Admin, 3=Staff, 4=User */
export const ROLE_ID = { SuperAdmin: 1, Admin: 2, Staff: 3, User: 4 } as const;

export type MenuItemWithRole = {
    label: string;
    icon: string;
    to: string;
    allowedRoles?: number[];
};

export const MENU_MODEL: MenuItemWithRole[] = [
    { label: 'ໜ້າຫຼັກ', icon: 'pi pi-fw pi-home', to: '/uikit/pageTechn', allowedRoles: [ROLE_ID.Staff] },
    { label: 'ຫນ້າຫຼັກ', icon: 'pi pi-fw pi-home', to: '/uikit/MainBoard', allowedRoles: [ROLE_ID.SuperAdmin, ROLE_ID.Admin] },
    { label: 'ລາຍງານ', icon: 'pi pi-fw pi-th-large', to: '/uikit/reportHD', allowedRoles: [ROLE_ID.SuperAdmin, ROLE_ID.Admin, ROLE_ID.Staff] },
    { label: 'ການຮ້ອງຂໍ', icon: 'pi pi-fw pi-ticket', to: '/uikit/table', allowedRoles: [ROLE_ID.SuperAdmin, ROLE_ID.Admin] },
    { label: 'ການແຈ້ງບັນຫາໃໝ່', icon: 'pi pi-fw pi-send', to: '/uikit/GroupProblem', allowedRoles: [ROLE_ID.SuperAdmin, ROLE_ID.Admin, ROLE_ID.Staff] },
    { label: 'ປະຫວັດການຊ້ອມແປງ', icon: 'pi pi-fw pi-folder-open', to: '/uikit/repair-history', allowedRoles: [ROLE_ID.SuperAdmin, ROLE_ID.Admin, ROLE_ID.Staff] },
    { label: 'ການຕັ້ງຄ່າ ແລະ ຈັດການຂໍ້ມູນ', icon: 'pi pi-fw pi-wrench', to: '/uikit/MenuApps', allowedRoles: [ROLE_ID.SuperAdmin, ROLE_ID.Admin] },
    { label: 'ກ່ຽວກັບລະບົບ', icon: 'pi pi-fw pi-info-circle', to: '/uikit/Aboutsystem' }
];

const USER_ROLE_MENU: MenuItemWithRole[] = [
    { label: 'ແຈ້ງບັນຫາໃໝ່', icon: 'pi pi-fw pi-send', to: '/uikit/GroupProblem', allowedRoles: [ROLE_ID.User] },
    { label: 'ປະຫວັດການຮ້ອງຂໍ', icon: 'pi pi-fw pi-folder-open', to: '/uikit/request-history', allowedRoles: [ROLE_ID.User] },
    { label: 'ກ່ຽວກັບລະບົບ', icon: 'pi pi-fw pi-info-circle', to: '/uikit/Aboutsystem' }
];

const USER_MENU_ITEMS: { label: string; icon: string; to: string; allowedRoles?: number[] }[] = [
    { label: 'ຂໍ້ມູນສ່ວນຕົວ', icon: 'pi pi-fw pi-user', to: '/uikit/profileUser', allowedRoles: [ROLE_ID.SuperAdmin, ROLE_ID.Admin, ROLE_ID.Staff, ROLE_ID.User] },
    { label: 'ປ່ຽນລະຫັດຜ່ານ', icon: 'pi pi-fw pi-key', to: '/uikit/changepassword' },
];

export function useAppMenu() {
    const { displayName, roleId } = useUserProfile();

    const visibleMenuItems = useMemo(() => {
        if (roleId == null) return MENU_MODEL;
        if (roleId === ROLE_ID.SuperAdmin) return MENU_MODEL.filter((item) => item.to !== '/uikit/pageTechn');
        if (roleId === ROLE_ID.User) return USER_ROLE_MENU;
        return MENU_MODEL.filter((item) => !item.allowedRoles || item.allowedRoles.includes(roleId));
    }, [roleId]);

    const visibleUserMenuItems = useMemo(() => {
        if (roleId == null) return USER_MENU_ITEMS;
        if (roleId === ROLE_ID.SuperAdmin) return USER_MENU_ITEMS;
        return USER_MENU_ITEMS.filter((item) => !item.allowedRoles || item.allowedRoles.includes(roleId));
    }, [roleId]);

    return { displayName, roleId, visibleMenuItems, visibleUserMenuItems };
}
