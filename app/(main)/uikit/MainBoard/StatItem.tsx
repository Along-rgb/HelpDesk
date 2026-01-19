import React from 'react';

interface StatItemProps {
    label: string;
    value: number;
}

export const StatItem: React.FC<StatItemProps> = ({ label, value }) => {
    return (
        <div className="flex justify-content-between align-items-center mb-3 border-bottom-1 surface-border pb-2">
            <span className="text-700">{label}</span>
            <span className="font-bold text-900">{value}</span>
        </div>
    );
};