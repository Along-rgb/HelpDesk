'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MENU_ITEMS } from './data';
import { SettingsCard } from './SettingsCard';
import { useAdminRouteGuard } from '@/app/hooks/useAdminRouteGuard';

const SettingsPage = () => {
    const router = useRouter();
    const [activeButton, setActiveButton] = useState<string | null>(null);
    const { loading, allowed } = useAdminRouteGuard('/uikit/profileUser');

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
                {MENU_ITEMS.map((item) => (
                    <div key={item.id} className="col-12 md:col-6 lg:col-3 p-2">
                        {/* ส่งฟังก์ชันที่แก้แล้วลง prop เดิม */}
                        <SettingsCard 
                            item={item}
                            activeButton={activeButton}
                            onSubMenuClick={handleSubMenuClick}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SettingsPage;