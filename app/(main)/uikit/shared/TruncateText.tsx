'use client';

import React from 'react';

/** Shared truncate-text renderer — used by ReportTable and RepairHistoryPage */
const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const displayText = element.textContent ?? '';
    if (element.scrollWidth > element.clientWidth) {
        element.setAttribute('data-pr-tooltip', displayText);
        element.style.cursor = 'pointer';
    } else {
        element.removeAttribute('data-pr-tooltip');
        element.style.cursor = 'text';
    }
};

export function renderTruncateText(
    text: string | undefined | null,
    maxWidth: string = '150px',
    align: 'left' | 'center' = 'left'
) {
    const displayText = text || '-';
    return (
        <div
            className="custom-tooltip-target"
            onMouseEnter={handleMouseEnter}
            data-pr-position="bottom"
            data-pr-at="center bottom"
            data-pr-my="center top"
            style={{
                maxWidth,
                width: 'fit-content',
                minWidth: '20px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                cursor: 'text',
                textAlign: align,
                margin: align === 'center' ? '0 auto' : '0',
            }}
        >
            {displayText}
        </div>
    );
}
