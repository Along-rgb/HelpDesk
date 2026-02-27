// table/TicketColumnTemplates.tsx
import React from "react";
import Link from "next/link"; 
import { Ticket, Assignee } from "./types";
import { AssigneeAvatarGroup } from "./AssigneeAvatarGroup";
import { ASSIGNEE_STATUS_MAP } from "./constants";

// ... (TitleBody และ RequesterBody เหมือนเดิม ไม่ต้องแก้)
export const TitleBody = (rowData: Ticket) => (
    <Link 
        href={`/uikit/ticket-detail/${rowData.id}`} 
        className="no-underline"
        style={{ color: 'inherit' }}
    >
        <span 
            className="js-tooltip-target cursor-pointer text-900 font-medium hover:text-blue-600 transition-colors transition-duration-200"       
            data-pr-tooltip={rowData.title || ""} 
            data-pr-position="top"
            style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        >
            {rowData.title}
        </span>
    </Link>
);

/** Requester: createdBy.employee first_name + last_name (or requester fallback) */
export const RequesterBody = (rowData: Ticket) => {
    const fullName =
        rowData.requester ||
        [rowData.firstname_req, rowData.lastname_req].filter(Boolean).join(" ").trim() ||
        "—";
    return (
        <span className="js-tooltip-target cursor-pointer text-700" data-pr-tooltip={fullName} data-pr-position="top" style={{ whiteSpace: "nowrap" }}>
            {fullName}
        </span>
    );
};

/** Employee Code: createdBy.employee.emp_code */
export const EmpCodeBody = (rowData: Ticket) => (
    <span className="text-700" style={{ whiteSpace: "nowrap" }}>
        {rowData.emp_code ?? "—"}
    </span>
);

/** Contact: telephone */
export const ContactBody = (rowData: Ticket) => (
    <span className="text-700" style={{ whiteSpace: "nowrap" }}>
        {rowData.contactPhone ?? "—"}
    </span>
);

export const AssigneeBody = (rowData: Ticket, action: (data: Assignee[]) => void) => {
    let displayData = rowData.assignees || [];
    
    if (displayData.length === 0 && rowData.assignTo) {
        displayData = [{ id: rowData.id, name: rowData.assignTo, status: 'doing' } as Assignee];
    }

    if (displayData.length === 0) return <span className="text-500 text-sm italic">ວ່າງ</span>;

    if (displayData.length === 1) {
        const user = displayData[0];
        const statusInfo = ASSIGNEE_STATUS_MAP[user.status] || ASSIGNEE_STATUS_MAP['default'];
        
        // ✅ [FIXED] แก้ไข logic การตัดชื่อ
        let displayName = user.name;
        if (displayName) {
            // 1. Trim ช่องว่างซ้ายขวาก่อน (เผื่อใน DB มีเว้นวรรคหน้าชื่อ)
            const cleanName = displayName.trim();
            const parts = cleanName.split(' ');

            // 2. เช็คว่าคำแรกเป็นคำนำหน้าชื่อหรือไม่ (เช่น ท., น., Mr., Ms., Dr.)
            // หรือถ้า parts[0] มีจุด (.) อยู่ด้วย ให้เดาว่าเป็นคำนำหน้า
            const isTitle = parts[0] === 'ທ.' || parts[0] === 'ນ.' || parts[0].includes('.');

            if (parts.length > 1 && isTitle) {
                // ถ้าเป็นคำนำหน้า ให้เอาคำที่ 2 (ชื่อจริง) มาต่อด้วย เช่น "ທ. ແສງປີຊາ"
                displayName = `${parts[0]} ${parts[1]}`;
            } else {
                // ถ้าไม่ใช่คำนำหน้า ให้เอาแค่คำแรกตามปกติ
                displayName = parts[0];
            }
        }
        
        let textColor = "text-700";
        if (statusInfo.severity === 'info') textColor = "text-blue-500";
        else if (statusInfo.severity === 'success') textColor = "text-green-500";
        else if (statusInfo.severity === 'warning') textColor = "text-orange-500";
        
        return (
            <div 
                className={`js-tooltip-target ${textColor} font-bold cursor-pointer text-sm`}
                onClick={() => action(displayData)}
                style={{ whiteSpace: 'nowrap' }}
                data-pr-tooltip={`${user.name} | ${statusInfo.label}`} 
                data-pr-position="bottom"
            >
                {displayName}
            </div>
        );
    }
    return <AssigneeAvatarGroup assignees={displayData} onClick={() => action(displayData)} />;
};