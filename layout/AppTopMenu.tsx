'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppMenu, ROLE_ID } from './hooks/useAppMenu';
import TopMenuBurger from './TopMenuBurger';

const TOPMENU_BREAKPOINT = 1024;

function useTopMenuNarrow() {
    const [narrow, setNarrow] = useState(() =>
        typeof window !== 'undefined'
            ? window.matchMedia(`(max-width: ${TOPMENU_BREAKPOINT}px)`).matches
            : false
    );
    useEffect(() => {
        const mql = window.matchMedia(`(max-width: ${TOPMENU_BREAKPOINT}px)`);
        const handler = () => setNarrow(mql.matches);
        mql.addEventListener('change', handler);
        return () => mql.removeEventListener('change', handler);
    }, []);
    return narrow;
}

export default function AppTopMenu() {
    const pathname = usePathname();
    const { visibleMenuItems, displayName, visibleUserMenuItems, roleId } = useAppMenu();
    const isUserRole = roleId === ROLE_ID.User;
    const isNarrow = useTopMenuNarrow();
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const userButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                userMenuRef.current?.contains(e.target as Node) ||
                userButtonRef.current?.contains(e.target as Node)
            )
                return;
            setUserMenuOpen(false);
        };
        if (userMenuOpen) document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [userMenuOpen]);

    return (
        <nav className="layout-topmenu">
            {isNarrow ? (
                <>
                    <div className="layout-topmenu-spacer" aria-hidden="true" />
                    <TopMenuBurger
                        visibleMenuItems={visibleMenuItems}
                        visibleUserMenuItems={visibleUserMenuItems}
                        displayName={displayName}
                    />
                </>
            ) : (
                <>
                    {isUserRole && <div className="layout-topmenu-spacer" aria-hidden="true" />}
                    <ul className="layout-topmenu-list">
                        {visibleMenuItems.map((item) => {
                            const isActive = item.to && pathname === item.to;
                            return (
                                <li key={`${item.label}-${item.to}`}>
                                    <Link
                                        href={item.to}
                                        className={`layout-topmenu-link ${isActive ? 'active-route' : ''}`}
                                    >
                                        <i className={item.icon} />
                                        <span>{item.label}</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                    {isUserRole && <div className="layout-topmenu-spacer" aria-hidden="true" />}
                    <div className="layout-topmenu-user" ref={userMenuRef}>
                        <button
                            ref={userButtonRef}
                            type="button"
                            className="layout-topmenu-user-btn"
                            onClick={() => setUserMenuOpen((v) => !v)}
                        >
                            <i className="pi pi-user" />
                            <span>{displayName}</span>
                            <i className={`pi pi-angle-down layout-topmenu-user-chevron ${userMenuOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {userMenuOpen && (
                            <div className="layout-topmenu-user-dropdown">
                                {visibleUserMenuItems.map((item) => (
                                    <Link
                                        key={item.to}
                                        href={item.to}
                                        className="layout-topmenu-user-dropdown-item"
                                        onClick={() => setUserMenuOpen(false)}
                                    >
                                        <i className={item.icon} />
                                        <span>{item.label}</span>
                                    </Link>
                                ))}
                                <hr className="layout-topmenu-user-dropdown-sep" />
                                <Link
                                    href="/auth/login"
                                    className="layout-topmenu-user-dropdown-item layout-topmenu-user-dropdown-logout"
                                    onClick={() => setUserMenuOpen(false)}
                                >
                                    <i className="pi pi-sign-out" />
                                    <span>ອອກຈາກລະບົບ</span>
                                </Link>
                            </div>
                        )}
                    </div>
                </>
            )}
        </nav>
    );
}
