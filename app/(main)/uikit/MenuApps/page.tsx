// src/uikit/MenuApps/page.tsx (หรือ path ของคุณ)
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MENU_ITEMS } from './data';
import { SettingsCard } from './SettingsCard';

const SettingsPage = () => {
    const router = useRouter();
    const [activeButton, setActiveButton] = useState<string | null>(null);

    // [Clean Code] 1. เพิ่ม parameter "tabIndex" (ใส่ ? เพื่อบอกว่ามีหรือไม่มีก็ได้)
    const handleSubMenuClick = (itemId: string, label: string, mainPath: string, tabIndex?: number) => {
        const uniqueKey = `${itemId}-${label}`;
        setActiveButton(uniqueKey);
        
        // [Clean Code] 2. ตรวจสอบว่ามี tabIndex ไหม? ถ้ามีให้เติม ?tab=... ต่อท้าย URL
        const destination = tabIndex !== undefined 
            ? `${mainPath}?tab=${tabIndex}` 
            : mainPath;
        router.push(destination); 
    };

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