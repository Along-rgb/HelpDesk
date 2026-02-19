// app/(main)/uikit/group-services/MenuCard.tsx
"use client"; 

import React, { useState, useMemo } from 'react';
// Import ຈາກ types ໃນ folder ດຽວກັນ
import { ServiceItem } from './types';

// 1. Configuration - ໃຊ້ Theme ສີດຽວກັນກັບ GroupProblem
const GRADIENT_THEMES: Record<string, string> = {
  blue: 'linear-gradient(180deg, #60A5FA 0%, #3B82F6 100%)',
  green: 'linear-gradient(180deg, #4ADE80 0%, #22C55E 100%)',
  orange: 'linear-gradient(180deg, #FB923C 0%, #F97316 100%)',
  default: 'var(--surface-d)'
};

// 2. Helper Functions
const getThemeKey = (colorClass: string): string => {
  if (!colorClass) return 'default';
  if (colorClass.includes('blue')) return 'blue';
  if (colorClass.includes('green')) return 'green';
  if (colorClass.includes('orange')) return 'orange';
  return 'default';
};

// 3. Component
interface MenuCardProps {
  item: ServiceItem;
}

export const MenuCard: React.FC<MenuCardProps> = ({ item }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const backgroundStyle = useMemo(() => {
    const themeKey = getThemeKey(item.color);
    return { background: GRADIENT_THEMES[themeKey] };
  }, [item.color]);

  return (
    <div className="col-12 md:col-4 p-3">
      <div
        className={`surface-card border-round-xl cursor-pointer h-full 
          flex flex-column align-items-center relative overflow-hidden
          ${isHovered ? 'shadow-8' : 'shadow-2'}
        `}
        style={{
          minHeight: '380px',
          transform: isHovered ? 'translateY(-12px)' : 'translateY(0)',
          transition: 'transform 300ms ease, box-shadow 300ms ease'
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Header Section */}
        <div
          className="w-full flex align-items-center justify-content-center relative"
          style={{
            ...backgroundStyle,
            height: '160px',
            boxShadow: 'inset 0 -10px 20px -10px rgba(0,0,0,0.3)'
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(135deg, rgba(0,0,0,0.25) 0%, transparent 60%)',
              opacity: isHovered ? 1 : 0,
              transition: 'opacity 0.3s ease-in-out',
              zIndex: 1
            }}
          />
          <img
            src={item.icon}
            alt={item.title}
            className="relative"
            style={{
              zIndex: 2,
              width: '80px',
              height: '80px',
              objectFit: 'contain',
              transform: isHovered ? 'scale(1.1)' : 'scale(1)',
              transition: 'transform 300ms ease'
            }}
          />
        </div>

        {/* Body Section */}
        <div className="flex flex-column flex-grow-1 p-4 text-center mt-2 w-full">
          <span className="text-xl font-bold text-900 mb-3">{item.title}</span>
          <p className="text-600 line-height-3 text-sm m-0">{item.description}</p>

          {/* ຈຳນວນລາຍການ Ticket - ວາງດ້ານລຸ່ມກາງ */}
          {item.ticketCount != null && (
            <p className="text-500 mt-auto pt-3 mb-0 font-medium w-full flex justify-content-center" style={{ fontSize: '15px' }}>
              {item.ticketCount} ລາຍການ
            </p>
          )}
        </div>
      </div>
    </div>
  );
};