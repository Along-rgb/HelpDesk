// Component เล็กสุด (Atomic) ดูแลแค่เรื่องปุ่ม Link และ Font
// src/components/settings/SubMenuLink.tsx
import React from 'react';

interface SubMenuLinkProps {
    label: string;
    isActive: boolean;
    onClick: () => void;
}

export const SubMenuLink: React.FC<SubMenuLinkProps> = ({ label, isActive, onClick }) => {
    return (
        <button
            type="button"
            onClick={onClick}
            // ใส่ font-family inherit เพื่อให้ Font ไม่เพี้ยน
            style={{ fontFamily: 'inherit' }} 
            className={`
                cursor-pointer border-none bg-transparent p-0 text-sm white-space-nowrap transition-colors duration-200 outline-none
                ${isActive 
                    ? 'text-blue-600 font-bold' 
                    : 'text-900 font-normal hover:text-blue-600'
                }
            `}
        >
            {label}
        </button>
    );
};