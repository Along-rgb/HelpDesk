'use client'; // สำคัญมาก: ต้องมีบรรทัดนี้เพื่อส่ง Event Handlers ได้

import React from 'react';
import { useMenu } from './UserMenu';
import { MenuCard } from './MenuUser';

const PageUser = () => {
    // ดึงข้อมูลและฟังก์ชันจัดการ Path จาก Hook
    const { services, handleNavigate, isLoading } = useMenu();

    if (isLoading) {
        return <div className="p-4 text-center">Loading...</div>;
    }

    return (
        <div className="p-4">
            <div className="grid">
                {services.map((item) => (
                    <MenuCard 
                        key={item.id} 
                        item={item} 
                        // ส่งฟังก์ชันจัดการคลิกไปที่ Props
                        onSelect={handleNavigate} 
                    />
                ))}
            </div>
        </div>
    );
};

export default PageUser;