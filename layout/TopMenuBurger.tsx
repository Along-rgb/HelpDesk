'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export type BurgerMenuItem = { label: string; icon: string; to: string };

type TopMenuBurgerProps = {
    visibleMenuItems: BurgerMenuItem[];
    visibleUserMenuItems: BurgerMenuItem[];
    displayName: string;
};

export default function TopMenuBurger({
    visibleMenuItems,
    visibleUserMenuItems,
    displayName
}: TopMenuBurgerProps) {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Node;
            if (
                panelRef.current?.contains(target) ||
                buttonRef.current?.contains(target)
            )
                return;
            setOpen(false);
        };
        if (open) document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [open]);

    const close = () => setOpen(false);

    return (
        <div className="layout-topmenu-burger" ref={panelRef}>
            <button
                ref={buttonRef}
                type="button"
                className="layout-topmenu-burger-btn"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-label="ເປີດເມນູ"
            >
                <i className="pi pi-bars" />
            </button>
            {open && (
                <div className="layout-topmenu-burger-panel">
                    <div className="layout-topmenu-burger-panel-inner">
                        {/* ส่วน User — อยู่ด้านบน */}
                        <div className="layout-topmenu-burger-user">
                            <div className="layout-topmenu-burger-user-name">
                                <i className="pi pi-user" />
                                <span>{displayName}</span>
                            </div>
                            {visibleUserMenuItems.map((item) => (
                                <Link
                                    key={item.to}
                                    href={item.to}
                                    className="layout-topmenu-burger-link"
                                    onClick={close}
                                >
                                    <i className={item.icon} />
                                    <span>{item.label}</span>
                                </Link>
                            ))}
                            <hr className="layout-topmenu-burger-sep" />
                            <Link
                                href="/auth/login"
                                className="layout-topmenu-burger-link layout-topmenu-burger-logout"
                                onClick={close}
                            >
                                <i className="pi pi-sign-out" />
                                <span>ອອກຈາກລະບົບ</span>
                            </Link>
                        </div>
                        {/* เมนูหลัก — อยู่ด้านล่าง */}
                        <ul className="layout-topmenu-burger-list">
                            {visibleMenuItems.map((item) => {
                                const isActive = item.to && pathname === item.to;
                                return (
                                    <li key={`${item.label}-${item.to}`}>
                                        <Link
                                            href={item.to}
                                            className={`layout-topmenu-burger-link ${isActive ? 'active-route' : ''}`}
                                            onClick={close}
                                        >
                                            <i className={item.icon} />
                                            <span>{item.label}</span>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}
