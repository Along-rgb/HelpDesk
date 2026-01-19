'use client'; // Next.js 13 App Router
import React, { useEffect, useContext } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation'; 
import { CSSTransition } from 'react-transition-group';
import { MenuContext } from './context/menucontext';
import { LayoutContext } from './context/layoutcontext';
import { AppMenuItem } from '@/types';

interface AppMenuitemProps {
    item: AppMenuItem;
    root?: boolean;
    index: number;
    className?: string;
    separator?: boolean;
}

const AppMenuitem = (props: AppMenuitemProps) => {
    const { activeMenu, setActiveMenu } = useContext(MenuContext);
    const { layoutState, onMenuToggle } = useContext(LayoutContext);
    
    // --- แก้ไข: ใช้ usePathname แทน useRouter ของเก่า ---
    const pathname = usePathname();
    const searchParams = useSearchParams();
    
    const item = props.item;
    const key = props.root ? String(props.index) : props.className || '';
    
    // เช็คว่าลิงก์นี้ตรงกับหน้าปัจจุบันไหม
    const isActiveRoute = item.to && pathname === item.to;
    
    const active = activeMenu === key || activeMenu.startsWith(key + '-');

    useEffect(() => {
        // ເບີ່ງ Active Route ເມື່ອ URL ປ່ຽນ
        if (item.to && pathname === item.to) {
            setActiveMenu(key);
        }
    }, [pathname, searchParams]); // ເພີ່ມ dependency ເພື່ອໃຫ້ເຮັດວຽກເມື່ຶອ URL ປ່ຽນ

    const itemClick = (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
        // 1. ຖ້າເມນູ "ບໍ່ແມ່ນ" ລີ້ງປ່ຽນຫນ້າ (ເປັນພຽງປຸ່ມເປີດ Submenu)
        if (!item.to) {
            event.preventDefault();
            
            if (item.items) {
                if (active) {
                    setActiveMenu(''); // ປິດ
                } else {
                    setActiveMenu(key); // ເປີດ
                }
            }
        } 
        
        // 2. ຖ້າເປີດລີ້ງເປັນ (Item ຍ່ອຍ)
        if (item.to) {
            // ຖ້າຢູ່ໃນ mode Mobile ໃຫ້ປິດ Sidebar ຫລັງຈາກກົດເລືອກເມນູແລ້ວ
            if (layoutState.staticMenuMobileActive) {
                onMenuToggle();
            }
        }

        if (item.command) {
            item.command({ originalEvent: event, item: item });
        }
    };

    const subMenu = item.items && item.visible !== false && (
        <CSSTransition timeout={{ enter: 1000, exit: 450 }} classNames="layout-submenu" in={props.root ? true : active} key={item.label}>
            <ul>
                {item.items.map((child, i) => {
                    return <AppMenuitem item={child} index={i} className={key + '-' + i} key={child.label} />;
                })}
            </ul>
        </CSSTransition>
    );

    return (
        <li className={(isActiveRoute ? 'active-route ' : '') + (active ? 'active-menuitem' : '')}>
            {item.to && !item.items ? (
                <Link href={item.to} className={isActiveRoute ? 'active-route' : ''} onClick={(e) => itemClick(e)} target={item.target}>
                    <i className={item.icon + ' layout-menuitem-icon'}></i>
                    <span className="layout-menuitem-text">{item.label}</span>
                    {item.items && <i className="pi pi-fw pi-angle-down layout-submenu-toggler"></i>}
                </Link>
            ) : (
                <a href={item.url} onClick={(e) => itemClick(e)} target={item.target} tabIndex={0}>
                    <i className={item.icon + ' layout-menuitem-icon'}></i>
                    <span className="layout-menuitem-text">{item.label}</span>
                    {item.items && <i className="pi pi-fw pi-angle-down layout-submenu-toggler"></i>}
                </a>
            )}
            {subMenu}
        </li>
    );
};

export default AppMenuitem;