// app/(main)/uikit/pageUser/MenuUser.tsx
'use client';
import React from 'react';
import { MenuCardType } from './types';
import './menu-style.css';

interface MenuCardProps {
    item: MenuCardType;
    onSelect: (path: string) => void;
}

export const MenuCard: React.FC<MenuCardProps> = ({ item, onSelect }) => {
    return (
        <div className="col-12 md:col-6 lg:col-4 p-3">
            <div 
                onClick={() => onSelect(item.path)}
                className={`custom-card-container ${item.color} cursor-pointer`}
            >
                <div className="card-badge">0</div>

                <div className="card-content flex flex-row align-items-center justify-content-center p-4">
                    <div className="text-white">
                        <div className="text-2xl font-bold">{item.title}</div>
                    </div>
                    <div className="icon-wrapper">
                         <img 
                            src={item.icon} 
                            alt={item.title} 
                            className="img-icon-svg" 
                         />
                    </div>
                </div>
            </div>
        </div>
    );
};