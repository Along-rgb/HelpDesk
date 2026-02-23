// Component เล็กสุด (Atomic) ดูแลแค่เรื่องปุ่ม Link และ Font
// src/components/settings/SubMenuLink.tsx
import React from 'react';

interface SubMenuLinkProps {
    label: string;
    isActive: boolean;
    onClick: () => void;
    disabled?: boolean;
}

export const SubMenuLink: React.FC<SubMenuLinkProps> = ({ label, isActive, onClick, disabled = false }) => {
    return (
        <button
            type="button"
            onClick={disabled ? undefined : onClick}
            disabled={disabled}
            style={{ fontFamily: 'inherit' }}
            className={`
                border-none bg-transparent p-0 text-base white-space-nowrap transition-colors duration-200 outline-none
                ${disabled ? 'cursor-not-allowed text-400' : 'cursor-pointer'}
                ${!disabled && isActive ? 'text-blue-600 font-bold' : !disabled ? 'text-900 font-normal hover:text-blue-600' : ''}
            `}
        >
            {label}
        </button>
    );
};