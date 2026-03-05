import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import AppMenuitem from './AppMenuitem';
import { MenuProvider } from './context/menucontext';
import { AppMenuItem } from '@/types';
import { useUserProfile } from '../types/useUserProfile';

/** Role ID ตาม API /api/roles: 1=SuperAdmin (ເຮັດໄດ້ທຸກຢ່າງ ເຫັນທຸກຢ່າງ ເຂົ້າໄດ້ທຸກຢ່າງ), 2=Admin, 3=Staff, 4=User */
const ROLE_ID = { SuperAdmin: 1, Admin: 2, Staff: 3, User: 4 } as const;

type MenuItemWithRole = AppMenuItem & { allowedRoles?: number[] };

const MENU_MODEL: MenuItemWithRole[] = [
    { label: 'ໜ້າຫຼັກ', icon: 'pi pi-fw pi-home', to: '/uikit/pageTechn', allowedRoles: [ROLE_ID.Staff] },
    { label: 'ຫນ້າຫຼັກ', icon: 'pi pi-fw pi-home', to: '/uikit/MainBoard', allowedRoles: [ROLE_ID.SuperAdmin, ROLE_ID.Admin] },
    { label: 'ລາຍງານ', icon: 'pi pi-fw pi-th-large', to: '/uikit/reportHD', allowedRoles: [ROLE_ID.SuperAdmin, ROLE_ID.Admin, ROLE_ID.Staff] },
    /** ການຮ້ອງຂໍ — เฉพาะ Role 1 (SuperAdmin) ແລະ Role 2 (Admin) */
    { label: 'ການຮ້ອງຂໍ', icon: 'pi pi-fw pi-ticket', to: '/uikit/table', allowedRoles: [ROLE_ID.SuperAdmin, ROLE_ID.Admin] },
    { label: 'ການແຈ້ງບັນຫາໃໝ່', icon: 'pi pi-fw pi-send', to: '/uikit/GroupProblem', allowedRoles: [ROLE_ID.SuperAdmin, ROLE_ID.Admin, ROLE_ID.Staff] },
    { label: 'ປະຫວັດການຊ້ອມແປງ', icon: 'pi pi-fw pi-folder-open', to: '/uikit/repair-history', allowedRoles: [ROLE_ID.SuperAdmin, ROLE_ID.Admin, ROLE_ID.Staff] },
    /** Role 3 (Staff) เห็นเมนูเหมือน Role 2 แต่ไม่เห็นรายการนี้ */
    { label: 'ການຕັ້ງຄ່າ ແລະ ຈັດການຂໍ້ມູນ', icon: 'pi pi-fw pi-wrench', to: '/uikit/MenuApps', allowedRoles: [ROLE_ID.SuperAdmin, ROLE_ID.Admin] },
    { label: 'ກ່ຽວກັບລະບົບ', icon: 'pi pi-fw pi-info-circle', to: '/uikit/Aboutsystem' }
];

/** เมนูสำหรับ Role User (id: 4) เท่านั้น — ແຈ້ງບັນຫາໃໝ່, ປະຫວັດການຮ້ອງຂໍ, ກ່ຽວກັບລະບົບ */
const USER_ROLE_MENU: MenuItemWithRole[] = [
    { label: 'ແຈ້ງບັນຫາໃໝ່', icon: 'pi pi-fw pi-send', to: '/uikit/GroupProblem' },
    { label: 'ປະຫວັດການຮ້ອງຂໍ', icon: 'pi pi-fw pi-folder-open', to: '/uikit/request-history' },
    { label: 'ກ່ຽວກັບລະບົບ', icon: 'pi pi-fw pi-info-circle', to: '/uikit/Aboutsystem' }
];

// เมนู User — ຂໍ້ມູນສ່ວນຕົວ (profileUser) ເປີດໃຫ້ທຸກ Role (1,2,3,4) ເພື່ອທົດສອບ; ປ່ຽນລະຫັດຜ່ານ ໃຫ້ທຸກ Role
const USER_MENU_ITEMS: { label: string; icon: string; to: string; allowedRoles?: number[] }[] = [
    { label: 'ຂໍ້ມູນສ່ວນຕົວ', icon: 'pi pi-fw pi-user', to: '/uikit/profileUser', allowedRoles: [ROLE_ID.SuperAdmin, ROLE_ID.Admin, ROLE_ID.Staff, ROLE_ID.User] },
    { label: 'ປ່ຽນລະຫັດຜ່ານ', icon: 'pi pi-fw pi-key', to: '/uikit/changepassword' },
];

const AppMenu = () => {
    const [isUserOpen, setIsUserOpen] = useState(false);
    const { displayName, roleId } = useUserProfile();

    const visibleMenuItems = useMemo(() => {
        if (roleId == null) return MENU_MODEL;
        // Role 1 (SuperAdmin), 2 (Admin): ไม่แสดงเมนู ໜ້າຫຼັກ path uikit/pageTechn — เฉพาะ Role 3 (Staff) เท่านั้น
        if (roleId === ROLE_ID.SuperAdmin) return MENU_MODEL.filter((item) => item.to !== '/uikit/pageTechn');
        if (roleId === ROLE_ID.User) return USER_ROLE_MENU;
        return MENU_MODEL.filter((item) => !item.allowedRoles || item.allowedRoles.includes(roleId));
    }, [roleId]);

    const visibleUserMenuItems = useMemo(() => {
        if (roleId == null) return USER_MENU_ITEMS;
        if (roleId === ROLE_ID.SuperAdmin) return USER_MENU_ITEMS;
        return USER_MENU_ITEMS.filter((item) => !item.allowedRoles || item.allowedRoles.includes(roleId));
    }, [roleId]);

    const toggleUserMenu = () => setIsUserOpen(prev => !prev);

    return (
        <MenuProvider>
            <ul className="layout-menu">
                {/* User Dropdown */}
                <li className="layout-root-menuitem">
                    <button 
                        type="button" 
                        className="cursor-pointer p-link flex align-items-center w-full p-3 border-none bg-transparent text-left"
                        onClick={toggleUserMenu}
                    >
                        <i className="pi pi-fw pi-user layout-menuitem-icon mr-2"></i>
                        <span className="layout-menuitem-text">{displayName}</span>
                        <i className={`pi pi-fw pi-angle-down layout-submenu-toggler ml-auto ${isUserOpen ? 'rotate-180' : ''}`}></i>
                    </button>

                    {isUserOpen && (
                        <ul className="pl-4">
                            {visibleUserMenuItems.map((item) => (
                                <li key={item.to}>
                                    <Link href={item.to} className="flex align-items-center p-3 cursor-pointer text-color hover:surface-100 border-round transition-duration-150 transition-colors w-full">
                                        <i className={`${item.icon} layout-menuitem-icon mr-2`}></i>
                                        <span className="layout-menuitem-text">{item.label}</span>
                                    </Link>
                                </li>
                            ))}

                            <li className="menu-separator"><hr className="my-1 border-top-1 surface-border border-none" /></li>
                            <li className="logout-item">
                                <Link href="/auth/login" className="flex align-items-center p-3 cursor-pointer text-color hover:surface-100 border-round transition-duration-150 transition-colors w-full">
                                    <i className="pi pi-fw pi-sign-out layout-menuitem-icon mr-2"></i>
                                    <span className="layout-menuitem-text">ອອກຈາກລະບົບ</span>
                                </Link>
                            </li>
                        </ul>
                    )}
                </li>

                <div className="menu-separator-container"><hr /></div>

                {visibleMenuItems.map((item, i) => (
                    !item?.seperator ? <AppMenuitem item={item} root={true} index={i} key={`${item.label}-${item.to}`} /> : null
                ))}
            </ul>
        </MenuProvider>
    );
};

export default AppMenu;