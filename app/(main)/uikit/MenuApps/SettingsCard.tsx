// src/uikit/MenuApps/SettingsCard.tsx
import React from 'react';
import { MenuItem } from './types';
import { SubMenuLink } from './SubMenuLink';

interface SettingsCardProps {
    item: MenuItem;
    activeButton: string | null;
    onSubMenuClick: (itemId: string, label: string, path: string, tabIndex?: number) => void;
    /** Role 1: ວິຊາການ (tabIndex=1) disabled. Role 2: ທິມສະໜັບສະໜູນ (tabIndex=0) disabled */
    getSubMenuDisabled?: (itemId: string, tabIndex: number) => boolean;
}

export const SettingsCard: React.FC<SettingsCardProps> = ({ item, activeButton, onSubMenuClick, getSubMenuDisabled }) => {
    const displayItems = item.subMenus || [];

    return (
        <div className="surface-card shadow-1 p-3 border-round h-full flex flex-row align-items-start gap-3">
            <div className="flex align-items-center justify-content-center border-round-md overflow-hidden" style={{ minWidth: '3.5rem', height: '3.5rem' }}>
                {item.iconUrl ? (
                    <img src={item.iconUrl} alt="" className="w-full h-full object-contain" />
                ) : (
                    <i className={`${item.icon} text-5xl text-blue-600`}></i>
                )}
            </div>
            <div className="flex flex-column flex-1 overflow-hidden">
                <span className="text-xl font-medium text-blue-600 mb-2">
                    {item.title}
                </span>
                <div className="flex flex-wrap align-items-center column-gap-2 row-gap-1">
                    {displayItems.map((subItem, index) => {
                        const uniqueKey = `${item.id}-${subItem.label}`;
                        const isLastItem = index === displayItems.length - 1;
                        const disabled = getSubMenuDisabled?.(item.id, subItem.tabIndex) ?? false;

                        return (
                            <React.Fragment key={uniqueKey}>
                                <SubMenuLink
                                    label={subItem.label}
                                    isActive={activeButton === uniqueKey}
                                    onClick={() => onSubMenuClick(item.id, subItem.label, item.path, subItem.tabIndex)}
                                    disabled={disabled}
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