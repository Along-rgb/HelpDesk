// app/(main)/uikit/pageUser/TitleColumn.tsx
'use client';

import React from 'react';
import { Tooltip } from 'primereact/tooltip';
import { truncateText, generateTooltipId } from './utils';

interface TitleColumnProps {
    title: string;
    id: string;
    maxLength?: number;
}

export const TitleColumn: React.FC<TitleColumnProps> = ({ title, id, maxLength = 40 }) => {
    
    if (title.length <= maxLength) {
        return <span style={{ color: 'var(--text-color)' }}>{title}</span>;
    }

    const tooltipClass = generateTooltipId(id);
    const shortTitle = truncateText(title, maxLength);

    return (
        <>
            <span 
                className={tooltipClass} 
                data-pr-tooltip={title}
                style={{ 
                    cursor: 'default', 
                    color: 'var(--text-color)', 
                    display: 'inline-block'
                }}
            >
                {shortTitle}
            </span>
            <Tooltip 
                target={`.${tooltipClass}`} 
                position="bottom" 
                pt={{
                    arrow: {
                        style: { borderBottomColor: 'red' } 
                    }
                }}
            />
        </>
    );
};