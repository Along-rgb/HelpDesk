// src/components/settings/SettingsCard.tsx
import React from 'react';
import { MenuItem } from './types';
import { SubMenuLink } from './SubMenuLink';

interface SettingsCardProps {
    // ใช้ any ไปก่อนเพื่อให้รองรับทั้งแบบเก่าและใหม่ (หรือคุณจะไปแก้ interface MenuItem ใน types.ts ก็ได้)
    item: any; 
    activeButton: string | null;
    // [Update] เพิ่ม parameter tabIndex? เพื่อรองรับการส่งเลข Tab
    onSubMenuClick: (itemId: string, label: string, path: string, tabIndex?: number) => void;
}

export const SettingsCard: React.FC<SettingsCardProps> = ({ item, activeButton, onSubMenuClick }) => {
    // [Clean Logic] ตรวจสอบว่ามีข้อมูลแบบ subMenus (ใหม่) หรือไม่? ถ้าไม่มีให้ใช้ descriptions (เก่า)
    // ทำให้โค้ดนี้รองรับทั้ง data.ts แบบใหม่และเก่าพร้อมกัน ไม่ error
    const displayItems = item.subMenus || item.descriptions || [];

    return (
        <div className="surface-card shadow-1 p-3 border-round h-full flex flex-row align-items-start gap-3">
            {/* Icon Section */}
            <div className="flex align-items-center justify-content-center border-round-md" style={{ minWidth: '3.5rem', height: '3.5rem' }}>
                <i className={`${item.icon} text-5xl text-blue-600`}></i>
            </div>

            {/* Content Section */}
            <div className="flex flex-column flex-1 overflow-hidden">
                <span className="text-xl font-medium text-blue-600 mb-2">
                    {item.title}
                </span>

                <div className="flex flex-wrap align-items-center column-gap-2 row-gap-1">
                    {displayItems.map((subItem: any, index: number) => {
                        // [Logic] ถ้าเป็นแบบใหม่ subItem จะเป็น Object { label, tabIndex }
                        // ถ้าเป็นแบบเก่า subItem จะเป็น String เฉยๆ
                        const label = subItem.label || subItem;
                        const tabIndex = subItem.tabIndex; // จะได้ค่า undefined ถ้าเป็นแบบเก่า

                        const uniqueKey = `${item.id}-${label}`;
                        const isLastItem = index === displayItems.length - 1;

                        return (
                            <React.Fragment key={uniqueKey}>
                                <SubMenuLink
                                    label={label}
                                    isActive={activeButton === uniqueKey}
                                    onClick={() => onSubMenuClick(item.id, label, item.path, tabIndex)}
                                />
                                {/* เส้นคั่น (|) */}
                                {!isLastItem && <span className="text-400 select-none">|</span>}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};