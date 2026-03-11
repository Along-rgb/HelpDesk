'use client';
import React, { useState, createContext, useCallback, useMemo } from 'react';
import { LayoutState, ChildContainerProps, LayoutConfig, LayoutContextProps } from '@/types';
export const LayoutContext = createContext({} as LayoutContextProps);

export const LayoutProvider = ({ children }: ChildContainerProps) => {
    const [layoutConfig, setLayoutConfig] = useState<LayoutConfig>({
        ripple: false,
        inputStyle: 'outlined',
        menuMode: 'static',
        colorScheme: 'light',
        theme: 'lara-light-blue',
        scale: 14
    });

    const [layoutState, setLayoutState] = useState<LayoutState>({
        staticMenuDesktopInactive: false,
        overlayMenuActive: false,
        profileSidebarVisible: false,
        configSidebarVisible: false,
        staticMenuMobileActive: false,
        menuHoverActive: false
    });

    const onMenuToggle = useCallback(() => {
        const isOverlay = layoutConfig.menuMode === 'overlay';
        const isDesktop = typeof window !== 'undefined' && window.innerWidth > 991;
        if (isOverlay) {
            setLayoutState((prev) => ({ ...prev, overlayMenuActive: !prev.overlayMenuActive }));
        } else if (isDesktop) {
            setLayoutState((prev) => ({ ...prev, staticMenuDesktopInactive: !prev.staticMenuDesktopInactive }));
        } else {
            setLayoutState((prev) => ({ ...prev, staticMenuMobileActive: !prev.staticMenuMobileActive }));
        }
    }, [layoutConfig.menuMode]);

    const showProfileSidebar = useCallback(() => {
        setLayoutState((prev) => ({ ...prev, profileSidebarVisible: !prev.profileSidebarVisible }));
    }, []);

    const value = useMemo<LayoutContextProps>(
        () => ({
            layoutConfig,
            setLayoutConfig,
            layoutState,
            setLayoutState,
            onMenuToggle,
            showProfileSidebar
        }),
        [layoutConfig, layoutState, onMenuToggle, showProfileSidebar]
    );

    return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
};
