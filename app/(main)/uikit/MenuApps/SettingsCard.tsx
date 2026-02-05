// src/uikit/MenuApps/SettingsCard.tsx
import React from 'react';
import { MenuItem } from './types';
import { SubMenuLink } from './SubMenuLink';

interface SettingsCardProps {
    item: MenuItem; // ใช้ Type ที่ถูกต้อง
    activeButton: string | null;
    onSubMenuClick: (itemId: string, label: string, path: string, tabIndex?: number) => void;
}

export const SettingsCard: React.FC<SettingsCardProps> = ({ item, activeButton, onSubMenuClick }) => {
    // ไม่ต้อง check descriptions แล้ว เพราะ type บังคับให้มี subMenus
    const displayItems = item.subMenus || [];

    return (
        <div className="surface-card shadow-1 p-3 border-round h-full flex flex-row align-items-start gap-3">
            <div className="flex align-items-center justify-content-center border-round-md" style={{ minWidth: '3.5rem', height: '3.5rem' }}>
                <i className={`${item.icon} text-5xl text-blue-600`}></i>
            </div>
            <div className="flex flex-column flex-1 overflow-hidden">
                <span className="text-xl font-medium text-blue-600 mb-2">
                    {item.title}
                </span>
                <div className="flex flex-wrap align-items-center column-gap-2 row-gap-1">
                    {displayItems.map((subItem, index) => {
                        const uniqueKey = `${item.id}-${subItem.label}`;
                        const isLastItem = index === displayItems.length - 1;

                        return (
                            <React.Fragment key={uniqueKey}>
                                <SubMenuLink
                                    label={subItem.label}
                                    isActive={activeButton === uniqueKey}
                                    onClick={() => onSubMenuClick(item.id, subItem.label, item.path, subItem.tabIndex)}
                                />
                                {!isLastItem && <span className="text-400 select-none">|</span>}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};