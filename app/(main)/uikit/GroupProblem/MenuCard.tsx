"use client"; 

import React, { useState, useMemo } from 'react';
import { ServiceItem } from './types';

// 1. ส่วน Configuration (การตั้งค่า)
// กำหนดธีมสีพื้นหลังแบบ Gradient สำหรับแต่ละประเภท
// สามารถเพิ่มสีใหม่ๆ ได้ที่นี่โดยไม่ต้องไปแก้ Logic ข้างล่าง
const GRADIENT_THEMES: Record<string, string> = {
  blue: 'linear-gradient(180deg, #60A5FA 0%, #3B82F6 100%)',   // สีฟ้า
  green: 'linear-gradient(180deg, #4ADE80 0%, #22C55E 100%)',  // สีเขียว
  orange: 'linear-gradient(180deg, #FB923C 0%, #F97316 100%)', // สีส้ม
  default: 'var(--surface-d)'                                  // สีเริ่มต้น (ถ้าไม่เจอสีข้างบน)
};

// 2. Helper Functions (ฟังก์ชันช่วยทำงาน)
// ฟังก์ชันสำหรับตรวจสอบ string ของ class สีที่ส่งเข้ามา เพื่อแปลงเป็น Key สำหรับ GRADIENT_THEMES
// ตัวอย่าง: รับค่า "bg-blue-100" -> จะ return "blue"
const getThemeKey = (colorClass: string): string => {
  if (!colorClass) return 'default';
  if (colorClass.includes('blue')) return 'blue';
  if (colorClass.includes('green')) return 'green';
  if (colorClass.includes('orange')) return 'orange';
  return 'default';
};

// 3. Component Definition (ส่วนประกอบหลัก)
interface MenuCardProps {
  item: ServiceItem; // รับข้อมูล ServiceItem (id, title, description, etc.) เข้ามา
}

export const MenuCard: React.FC<MenuCardProps> = ({ item }) => {
  // State สำหรับเช็คว่าเมาส์ชี้อยู่ที่การ์ดหรือไม่ (เพื่อทำ Animation)
  const [isHovered, setIsHovered] = useState(false);
  // คำนวณสีพื้นหลังเตรียมไว้ (ใช้ useMemo เพื่อไม่ให้คำนวณใหม่ทุกครั้งที่ render ถ้า item.color ไม่เปลี่ยน)
  const backgroundStyle = useMemo(() => {
    const themeKey = getThemeKey(item.color); // แปลง class สี เป็น key (blue/green/orange)
    return { background: GRADIENT_THEMES[themeKey] }; // ดึงค่า Gradient จาก constant ข้างบน
  }, [item.color]);

  return (
    // --- Layout ภายนอก ---
    // ใช้ Grid System ของ PrimeFlex (col-12 md:col-4) จัดการขนาด
    <div className="col-12 md:col-4 p-3">
      
      {/* --- ตัวการ์ดหลัก (Card Container) --- */}
      <div
        className={`surface-card border-round-xl cursor-pointer h-full 
          flex flex-column align-items-center relative overflow-hidden
          ${isHovered ? 'shadow-8' : 'shadow-2'} // เงาจะเข้มขึ้นเมื่อ Hover
        `}
        style={{
          minHeight: '380px',
          // เอฟเฟกต์การ์ดลอยขึ้นเล็กน้อยเมื่อ Hover
          transform: isHovered ? 'translateY(-12px)' : 'translateY(0)',
          transition: 'transform 300ms ease, box-shadow 300ms ease'
        }}
        // Event Handlers สำหรับตรวจจับเมาส์
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        
        {/* --- ส่วนหัวของการ์ด (Header Section) --- */}
        <div
          className="w-full flex align-items-center justify-content-center relative"
          style={{
            ...backgroundStyle, // ใส่สี Gradient ที่คำนวณไว้
            height: '160px',
            boxShadow: 'inset 0 -10px 20px -10px rgba(0,0,0,0.3)' // เงาด้านในเพื่อให้ดูมีมิติ
          }}
        >
          {/* Overlay เงาที่จะจางหายไปเมื่อ Hover (สร้าง Effect วูบวาบ) */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(135deg, rgba(0,0,0,0.25) 0%, transparent 60%)',
              opacity: isHovered ? 1 : 0, // แสดงเฉพาะตอน Hover
              transition: 'opacity 0.3s ease-in-out',
              zIndex: 1
            }}
          />

          {/* ไอคอน (Icon Image) */}
          <img
            src={item.icon}
            alt={item.title}
            className="relative"
            style={{
              zIndex: 2,
              width: '80px',
              height: '80px',
              objectFit: 'contain',
              // ขยายไอคอนเล็กน้อยเมื่อ Hover
              transform: isHovered ? 'scale(1.1)' : 'scale(1)',
              transition: 'transform 300ms ease'
            }}
          />
        </div>

        {/* --- ส่วนเนื้อหา (Body Section) --- */}
        <div className="flex flex-column flex-grow-1 p-4 text-center mt-2 w-full">
          {/* ชื่อหัวข้อ */}
          <span className="text-xl font-bold text-900 mb-3">{item.title}</span>
          
          {/* คำอธิบาย */}
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