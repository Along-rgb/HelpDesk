"use client";
import React from "react";
import { Dialog } from "primereact/dialog";
import { Avatar } from "primereact/avatar";
import { Tag } from "primereact/tag";
import { Assignee } from "./types";
import { ASSIGNEE_STATUS_MAP, STATUS_MAP } from "./constants";

/** ລາຍການຈາກ /api/helpdeskstatus/selecthelpdeskstatus (id, name) */
export type HelpdeskStatusOption = { id: number; name: string };

interface Props {
    visible: boolean;
    onHide: () => void;
    assignees: Assignee[];
    /** ລາຍການສະຖານະຈາກ selecthelpdeskstatus — ໃຊ້ id ເປີດບັນທັດ name */
    statusList?: HelpdeskStatusOption[];
    ticketStatus?: string | null;
    /** หัวข้อส่วนมอบหมายงาน จาก headcategory (tabIndex=1) */
    sectionTitle?: string;
}

const SEVERITY_COLORS: Record<string, { bg: string; text: string }> = {
    success:   { bg: '#22c55e', text: '#ffffff' },
    info:      { bg: '#3b82f6', text: '#ffffff' },
    warning:   { bg: '#f59e0b', text: '#ffffff' },
    danger:    { bg: '#ef4444', text: '#ffffff' },
    secondary: { bg: '#9ca3af', text: '#ffffff' },
    default:   { bg: '#9ca3af', text: '#ffffff' },
};

const getInitials = (name: string) => name ? name.substring(0, 2).toUpperCase() : '??';

/** Modal ສະຖານະ: ແຕ່ລະຄົນ (user role 3) ແສງຕາມສະຖານະຂອງ assignment ນັ້ນ — ໃຊ້ helpdeskStatusId ເປີດບັນທັດ name ຈາກ selecthelpdeskstatus */
export const AssigneeDialog = ({ visible, onHide, assignees, statusList = [], sectionTitle = "ມອບໝາຍໃຫ້" }: Props) => {
    const header = sectionTitle ? `${sectionTitle}` : "ມອບໝາຍໃຫ້";
    const statusById = React.useMemo(() => new Map(statusList.map((s) => [s.id, s])), [statusList]);

    const getStatusColor = (user: Assignee) => {
        const statusName = user.statusId != null ? statusById.get(user.statusId)?.name ?? null : null;
        const severity = statusName
            ? (STATUS_MAP[statusName] ?? 'secondary')
            : (ASSIGNEE_STATUS_MAP[user.status]?.severity || 'secondary');
        return SEVERITY_COLORS[severity] || SEVERITY_COLORS.default;
    };
    
    return (
        <Dialog
            header={header}
            visible={visible}
            style={{ width: '30vw', minWidth: '350px' }}
            onHide={onHide}
            draggable={false}
        >
            <div className="flex flex-column gap-3 mt-2">
                {assignees.map((user) => {
                    /** ໃຊ້ statusId ຈາກ API ເປັນຫຼັກ (ສະຖານະຂອງ assignment ແຕ່ລະຄົນ) */
                    const statusFromApi = user.statusId != null ? statusById.get(user.statusId) : undefined;
                    
                    /** ຖ້າມີ statusId ແລະພົບໃນ statusList ໃຫ້ໃຊ້ຊື່ຈາກ API */
                    const displayLabel = statusFromApi 
                        ? statusFromApi.name 
                        : (ASSIGNEE_STATUS_MAP[user.status] || ASSIGNEE_STATUS_MAP['default']).label;
                    
                    /** ກຳນົດສີຂອງ Tag ຕາມຊື່ສະຖານະ */
                    let rawSeverity: "success" | "info" | "warning" | "danger" | "secondary" | null;
                    
                    if (statusFromApi && STATUS_MAP[statusFromApi.name]) {
                        /** ໃຊ້ສີຈາກ STATUS_MAP ຖ້າພົບຊື່ສະຖານະຈາກ API */
                        rawSeverity = STATUS_MAP[statusFromApi.name] as "success" | "info" | "warning" | "danger" | null;
                    } else if (user.status && ASSIGNEE_STATUS_MAP[user.status]) {
                        /** Fallback ໄປໃຊ້ສີຈາກ ASSIGNEE_STATUS_MAP */
                        rawSeverity = ASSIGNEE_STATUS_MAP[user.status].severity as "success" | "info" | "warning" | "danger" | "secondary";
                    } else {
                        rawSeverity = "secondary";
                    }
                    
                    /** PrimeReact Tag ບໍ່ຮອງຮັບ severity="secondary" ໃຫ້ໃຊ້ undefined ແທນ */
                    const displaySeverity = rawSeverity === "secondary" || rawSeverity === null 
                        ? undefined 
                        : (rawSeverity as "success" | "info" | "warning" | "danger");

                    return (
                        <div key={user.id} className="flex align-items-center justify-content-between p-2 border-bottom-1 surface-border">
                            <div className="flex align-items-center gap-2">
                                <Avatar
                                    label={!user.image ? getInitials(user.name) : undefined}
                                    image={user.image}
                                    icon={!user.image && !user.name ? 'pi pi-user' : undefined}
                                    shape="circle"
                                    style={{
                                        backgroundColor: user.image ? 'transparent' : getStatusColor(user).bg,
                                        color: user.image ? undefined : getStatusColor(user).text,
                                        border: `3px solid ${getStatusColor(user).bg}`,
                                    }}
                                />
                                <div className="flex flex-column">
                                    <span className="font-bold text-sm">
                                        [{user.emp_code != null && String(user.emp_code).trim() !== "" ? String(user.emp_code).trim() : "—"}] - {user.name}
                                    </span>
                                    <span className="text-xs text-500">Staff / IT Support</span>
                                </div>
                            </div>
                            <Tag value={displayLabel} severity={displaySeverity} style={{ fontSize: '0.85rem' }} />
                        </div>
                    );
                })}
            </div>
        </Dialog>
    );
};