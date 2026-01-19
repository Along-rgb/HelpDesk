import React, { useState } from 'react';
import Link from 'next/link';
import AppMenuitem from './AppMenuitem';
import { MenuProvider } from './context/menucontext';
import { AppMenuItem } from '@/types';
import { useUserProfile } from '../types/useUserProfile'; 

const MENU_MODEL: AppMenuItem[] = [
    { label: 'ຫນ້າຫຼັກ', icon: 'pi pi-fw pi-home', to: '/uikit/MainBoard' },
    { label: 'ລາຍງານ', icon: 'pi pi-fw pi-th-large', to: '/uikit/reportHD' },
    { label: 'ການຮ້ອງຂໍ', icon: 'pi pi-fw pi-ticket', to: '/uikit/table' },
    { label: 'ການຕັ້ງຄ່າ ແລະ ຈັດການຂໍ້ມູນ', icon: 'pi pi-fw pi-wrench', to: '/uikit/MenuApps' },
    { label: 'ກ່ຽວກັບລະບົບ', icon: 'pi pi-fw pi-info-circle', to: '/uikit/Aboutsystem' }
];

// ⭐ สร้าง Config สำหรับเมนู User (Clean Code)
const USER_MENU_ITEMS = [
    { label: 'ຂໍ້ມູນສ່ວນຕົວ', icon: 'pi pi-fw pi-user', to: '/uikit/profileUser' },
    { label: 'ປ່ຽນລະຫັດຜ່ານ', icon: 'pi pi-fw pi-key', to: '/uikit/changepassword' },
];

const AppMenu = () => {
    const [isUserOpen, setIsUserOpen] = useState(false);
    const { displayName } = useUserProfile();

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
                            {/* ⭐ Loop เมนูย่อยแทนการ Hardcode */}
                            {USER_MENU_ITEMS.map((item) => (
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

                {MENU_MODEL.map((item, i) => (
                    !item?.seperator ? <AppMenuitem item={item} root={true} index={i} key={item.label} /> : null
                ))}
            </ul>
        </MenuProvider>
    );
};

export default AppMenu;