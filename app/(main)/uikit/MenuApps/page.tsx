'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { MENU_ITEMS } from './data';
import { SettingsCard } from './SettingsCard';
import { useAdminRouteGuard } from '@/app/hooks/useAdminRouteGuard';
import { useUserProfile } from '@/types/useUserProfile';
import { useIssueIcons } from './hooks/useIssueIcons';
import { useServiceRequestIcons } from './hooks/useServiceRequestIcons';
import { IssueTabs, ServiceRequestTabs } from './types';

const SettingsPage = () => {
    const router = useRouter();
    const [activeButton, setActiveButton] = useState<string | null>(null);
    const { loading, allowed } = useAdminRouteGuard('/uikit/profileUser');
    const { roleId } = useUserProfile();

    const { items: issueIcons } = useIssueIcons(IssueTabs.ICON);
    const { items: serviceIcons } = useServiceRequestIcons(ServiceRequestTabs.ICON);

    const itemsWithIcons = useMemo(() => {
        const issueFirstIcon = [...issueIcons].sort((a, b) => a.sortOrder - b.sortOrder)[0]?.iconUrl;
        const serviceFirstIcon = [...serviceIcons].sort((a, b) => a.sortOrder - b.sortOrder)[0]?.iconUrl;
        return MENU_ITEMS.map((item) => {
            if (item.id === 'issues' && issueFirstIcon) return { ...item, iconUrl: issueFirstIcon };
            if (item.id === 'services' && serviceFirstIcon) return { ...item, iconUrl: serviceFirstIcon };
            return item;
        });
    }, [issueIcons, serviceIcons]);

    const visibleItems = useMemo(() => itemsWithIcons, [itemsWithIcons]);

    /** Role 1: ວິຊາການ (tabIndex=1) disabled. Role 2: ທິມສະໜັບສະໜູນ (tabIndex=0) disabled — ใน card เท่านั้น */
    const getSubMenuDisabled = useMemo(() => {
        const r = Number(roleId);
        return (itemId: string, tabIndex: number) => {
            if (itemId !== 'users') return false;
            if (r === 1 && tabIndex === 1) return true;
            if (r === 2 && tabIndex === 0) return true;
            return false;
        };
    }, [roleId]);

    const handleSubMenuClick = (itemId: string, label: string, mainPath: string, tabIndex?: number) => {
        const uniqueKey = `${itemId}-${label}`;
        setActiveButton(uniqueKey);
        const destination = tabIndex !== undefined
            ? `${mainPath}?tab=${tabIndex}`
            : mainPath;
        router.push(destination);
    };

    if (loading) {
        return (
            <div className="flex align-items-center justify-content-center p-8">
                <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem' }}></i>
            </div>
        );
    }
    if (!allowed) {
        return null;
    }

    return (
        <div className="layout-dashboard p-4">
            <h4 className="mb-4 text-900 font-bold">ການຕັ້ງຄ່າ ແລະ ຈັດການຂໍ້ມູນ</h4>

            <div className="grid">
                {visibleItems.map((item) => (
                    <div key={item.id} className="col-12 md:col-6 lg:col-3 p-2">
                        {/* ส่งฟังก์ชันที่แก้แล้วลง prop เดิม */}
                        <SettingsCard 
                            item={item}
                            activeButton={activeButton}
                            onSubMenuClick={handleSubMenuClick}
                            getSubMenuDisabled={getSubMenuDisabled}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SettingsPage;