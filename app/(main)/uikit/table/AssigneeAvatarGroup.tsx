"use client";
import React from "react";
import { Avatar } from "primereact/avatar";
import { AvatarGroup } from "primereact/avatargroup";
import { Assignee } from "./types";
import { ASSIGNEE_STATUS_MAP } from "./constants"; 

interface Props {
    assignees: Assignee[];
    /** helpdesk status (จาก updatehelpdeskstatus) ใช้แสดงใน tooltip ให้ตรงกับคอลัมน์ ສະຖານະ */
    ticketStatus?: string;
    onClick: () => void;
}

export const AssigneeAvatarGroup = ({ assignees, ticketStatus, onClick }: Props) => {
    
    const safeAssignees = assignees || [];

    const getInitials = (name: string) => {
        return name ? name.substring(0, 2).toUpperCase() : '??';
    };

    const getColor = (name: string) => {
        const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];
        const index = (name || '').length % colors.length;
        return colors[index];
    };

    return (
        <div 
            className="flex align-items-center justify-content-center cursor-pointer hover:surface-100 p-1 border-round transition-duration-200"
            onClick={(e) => {
                e.stopPropagation(); 
                onClick(); 
            }}
        >
            <AvatarGroup className="mb-0">
                {safeAssignees.slice(0, 3).map((user) => {
                    // Logic Tooltip: ชื่อ | สถานะ
                    const statusInfo = ASSIGNEE_STATUS_MAP[user.status] || ASSIGNEE_STATUS_MAP['default'];
                    const tooltipText = ticketStatus ? `${user.name} | ${ticketStatus}` : `${user.name} | ${statusInfo.label}`;

                    return (
                        <Avatar 
                            key={user.id} 
                            label={!user.image ? getInitials(user.name) : undefined}
                            image={user.image}
                            shape="circle"
                            size="normal"
                            style={{ backgroundColor: getColor(user.name), color: '#ffffff', border: '2px solid #ffffff' }}
                            
                            // ✅ ใช้ Class เดียวกันกับหน้า Page
                            className="js-tooltip-target"
                            data-pr-tooltip={tooltipText}
                            data-pr-position="bottom" // Assignee ให้ชี้ลงข้างล่างตามรูปจะสวยกว่า
                        />
                    );
                })}
                
                {safeAssignees.length > 3 && (
                    <Avatar 
                        label={`+${safeAssignees.length - 3}`} 
                        shape="circle" 
                        size="normal" 
                        style={{ backgroundColor: '#9ca3af', color: '#ffffff', border: '2px solid #ffffff' }} 
                        
                        className="js-tooltip-target"
                        data-pr-tooltip={`ຍັງມີອີກ ${safeAssignees.length - 3} ຄົນ`}
                        data-pr-position="bottom"
                    />
                )}
            </AvatarGroup>
        </div>
    );
};