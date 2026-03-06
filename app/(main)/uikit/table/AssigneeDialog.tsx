"use client";
import React from "react";
import { Dialog } from "primereact/dialog";
import { Avatar } from "primereact/avatar";
import { Tag } from "primereact/tag";
import { Assignee } from "./types";
import { ASSIGNEE_STATUS_MAP, STATUS_MAP } from "./constants";

interface Props {
    visible: boolean;
    onHide: () => void;
    assignees: Assignee[];
    /** helpdesk status (จาก updatehelpdeskstatus) ให้แสดงใน Dialog ตรงกับคอลัมน์ ສະຖານະ */
    ticketStatus?: string | null;
    /** หัวข้อส่วนมอบหมายงาน จาก headcategory (tabIndex=1) */
    sectionTitle?: string;
}

export const AssigneeDialog = ({ visible, onHide, assignees, ticketStatus, sectionTitle = "ມອບໝາຍໃຫ້" }: Props) => {
    const header = sectionTitle ? `${sectionTitle}` : "ມອບໝາຍໃຫ້";
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
                    const statusInfo = ASSIGNEE_STATUS_MAP[user.status] || ASSIGNEE_STATUS_MAP['default'];
                    const useHelpdeskStatus = ticketStatus != null && ticketStatus !== "";
                    const displayLabel = useHelpdeskStatus ? ticketStatus : statusInfo.label;
                    const displaySeverity = useHelpdeskStatus && STATUS_MAP[ticketStatus]
                        ? (STATUS_MAP[ticketStatus] as "success" | "info" | "warning" | "danger")
                        : (statusInfo.severity as "success" | "info" | "warning" | "danger");

                    return (
                        <div key={user.id} className="flex align-items-center justify-content-between p-2 border-bottom-1 surface-border">
                            <div className="flex align-items-center gap-2">
                                <Avatar icon="pi pi-user" shape="circle" className="surface-100 text-500 border-1 surface-border" />
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