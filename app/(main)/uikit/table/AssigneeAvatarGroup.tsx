"use client";
import React from "react";
import { Avatar } from "primereact/avatar";
import { AvatarGroup } from "primereact/avatargroup";
import { Assignee } from "./types";
import { ASSIGNEE_STATUS_MAP, STATUS_MAP } from "./constants"; 

interface Props {
    assignees: Assignee[];
    /** helpdesk status (จาก updatehelpdeskstatus) ใช้แสดงใน tooltip ให้ตรงกับคอลัมน์ ສະຖານະ */
    ticketStatus?: string;
    /** ລາຍການສະຖານະຈາກ API ເພື່ອ lookup ຊື່ສະຖານະຈາກ statusId */
    statusList?: { id: number; name: string }[];
    onClick: () => void;
}

export const AssigneeAvatarGroup = React.memo(({ assignees, ticketStatus, statusList = [], onClick }: Props) => {
    
    const safeAssignees = assignees || [];
    const statusById = React.useMemo(() => new Map(statusList.map((s) => [s.id, s])), [statusList]);

    const getInitials = (name: string) => {
        return name ? name.substring(0, 2).toUpperCase() : '??';
    };

    const SEVERITY_COLORS: Record<string, { bg: string; text: string }> = {
        success:   { bg: '#22c55e', text: '#ffffff' },
        info:      { bg: '#3b82f6', text: '#ffffff' },
        warning:   { bg: '#f59e0b', text: '#ffffff' },
        danger:    { bg: '#ef4444', text: '#ffffff' },
        secondary: { bg: '#9ca3af', text: '#ffffff' },
        default:   { bg: '#9ca3af', text: '#ffffff' },
    };

    const getStatusColor = (user: Assignee) => {
        const statusName = user.statusId != null ? statusById.get(user.statusId)?.name ?? null : null;
        const severity = statusName
            ? (STATUS_MAP[statusName] ?? 'secondary')
            : (ASSIGNEE_STATUS_MAP[user.status]?.severity || 'secondary');
        return SEVERITY_COLORS[severity] || SEVERITY_COLORS.default;
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
                    /** ໃຊ້ statusId ຈາກ API ເປັນຫຼັກ (ສະຖານະຂອງ assignment ແຕ່ລະຄົນ) */
                    const statusFromApi = user.statusId != null ? statusById.get(user.statusId) : undefined;
                    const displayLabel = statusFromApi 
                        ? statusFromApi.name 
                        : (ASSIGNEE_STATUS_MAP[user.status] || ASSIGNEE_STATUS_MAP['default']).label;
                    const tooltipText = `${user.name} | ${displayLabel}`;

                    return (
                        <Avatar 
                            key={user.id} 
                            label={!user.image ? getInitials(user.name) : undefined}
                            image={user.image}
                            shape="circle"
                            size="normal"
                            style={{
                                backgroundColor: user.image ? 'transparent' : getStatusColor(user).bg,
                                color: user.image ? undefined : getStatusColor(user).text,
                                border: `3px solid ${getStatusColor(user).bg}`,
                            }}
                            
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
});