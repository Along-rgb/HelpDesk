// table/TicketColumnTemplates.tsx
import React from "react";
import Link from "next/link";
import { encryptId } from "@/lib/crypto";
import { Ticket, Assignee } from "./types";
import { AssigneeAvatarGroup } from "./AssigneeAvatarGroup";
import { ASSIGNEE_STATUS_MAP, STATUS_MAP } from "./constants";

export const TitleBody = React.memo(({ rowData }: { rowData: Ticket }) => (
    <Link
        href={`/uikit/ticket-detail/${encryptId(rowData.id)}`}
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
));
TitleBody.displayName = 'TitleBody';

/** Requester: แสดงแค่ชื่อในเซลล์, tooltip แสดงชื่อ + นามสกุล */
export const RequesterBody = React.memo(({ rowData }: { rowData: Ticket }) => {
    const fullName =
        rowData.requester ||
        [rowData.firstname_req, rowData.lastname_req].filter(Boolean).join(" ").trim() ||
        "—";
    const displayName = rowData.firstname_req ?? (fullName !== "—" ? fullName.split(/\s+/)[0] ?? fullName : "—");
    return (
        <span className="js-tooltip-target cursor-pointer text-700" data-pr-tooltip={fullName} data-pr-position="top" style={{ whiteSpace: "nowrap" }}>
            {displayName}
        </span>
    );
});
RequesterBody.displayName = 'RequesterBody';

/** Employee Code: createdBy.employee.emp_code */
export const EmpCodeBody = React.memo(({ rowData }: { rowData: Ticket }) => (
    <span className="text-700" style={{ whiteSpace: "nowrap" }}>
        {rowData.emp_code ?? "—"}
    </span>
));
EmpCodeBody.displayName = 'EmpCodeBody';

/** Contact: telephone */
export const ContactBody = React.memo(({ rowData }: { rowData: Ticket }) => (
    <span className="text-700" style={{ whiteSpace: "nowrap" }}>
        {rowData.contactPhone ?? "—"}
    </span>
));
ContactBody.displayName = 'ContactBody';

/**
 * Build statusById map once per statusList (not per row).
 * Call this in the parent and pass the map to AssigneeBody to avoid N×Map allocations.
 */
export function buildStatusByIdMap(statusList?: { id: number; name: string }[]): Map<number, { id: number; name: string }> {
    return new Map((statusList || []).map((s) => [s.id, s]));
}

export const AssigneeBody = (
    rowData: Ticket,
    action: (data: Assignee[]) => void,
    statusByIdMap: Map<number, { id: number; name: string }>
) => {
    let displayData = rowData.assignees || [];
    
    if (displayData.length === 0 && rowData.assignTo) {
        displayData = [{ id: rowData.id, name: rowData.assignTo, status: 'doing' } as Assignee];
    }

    if (displayData.length === 0) return <span className="text-500 text-sm italic">ຍັງບໍ່ໄດ້ມອບໝາຍ</span>;

    if (displayData.length === 1) {
        const user = displayData[0];
        /** ໃຊ້ statusId ຈາກ API ເປັນຫຼັກ (ສະຖານະຂອງ assignment ແຕ່ລະຄົນ) */
        const statusFromApi = user.statusId != null ? statusByIdMap.get(user.statusId) : undefined;
        const displayLabel = statusFromApi 
            ? statusFromApi.name 
            : (ASSIGNEE_STATUS_MAP[user.status] || ASSIGNEE_STATUS_MAP['default']).label;
        
        // ใช้สีตาม assignment status ของคนนั้น (ไม่ใช่ ticket status)
        const assigneeStatusName = statusFromApi?.name ?? null;
        const assigneeSeverity = assigneeStatusName
            ? (STATUS_MAP[assigneeStatusName] ?? null)
            : null;
        let textColor = "text-700";
        if (assigneeSeverity === "info") textColor = "text-blue-500";
        else if (assigneeSeverity === "success") textColor = "text-green-500";
        else if (assigneeSeverity === "warning") textColor = "text-orange-500";
        else if (assigneeSeverity === "danger") textColor = "text-red-500";
        else {
            const statusInfo = ASSIGNEE_STATUS_MAP[user.status] || ASSIGNEE_STATUS_MAP['default'];
            if (statusInfo.severity === "info") textColor = "text-blue-500";
            else if (statusInfo.severity === "success") textColor = "text-green-500";
            else if (statusInfo.severity === "warning") textColor = "text-orange-500";
        }

        let displayName = user.name;
        if (displayName) {
            const cleanName = displayName.trim();
            const parts = cleanName.split(' ');
            const isTitle = parts[0] === 'ທ.' || parts[0] === 'ນ.' || parts[0].includes('.');
            if (parts.length > 1 && isTitle) {
                displayName = `${parts[0]} ${parts[1]}`;
            } else {
                displayName = parts[0];
            }
        }

        return (
            <div
                className={`js-tooltip-target ${textColor} font-bold cursor-pointer text-sm`}
                onClick={() => action(displayData)}
                style={{ whiteSpace: 'nowrap' }}
                data-pr-tooltip={`${user.name} | ${displayLabel}`}
                data-pr-position="bottom"
            >
                {displayName}
            </div>
        );
    }
    const statusListArr = Array.from(statusByIdMap.values());
    return <AssigneeAvatarGroup assignees={displayData} ticketStatus={rowData.status} statusList={statusListArr} onClick={() => action(displayData)} />;
};