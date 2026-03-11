"use client";
import React from "react";
import { Dialog } from "primereact/dialog";
import { Avatar } from "primereact/avatar";
import { Tag } from "primereact/tag";
import { Assignee } from "./types";
import { ASSIGNEE_STATUS_MAP } from "./constants";

/** Map id/employeeId → emp_code สำหรับ lookup ตอนแสดงใน modal (แก้ไขกรณี loading/enrich ยังไม่ทัน) */
export type EmpCodeMap = Map<number, string>;

interface Props {
    visible: boolean;
    onHide: () => void;
    assignees: Assignee[];
    /** ไม่ใช้แสดงใน Modal — Modal แสดงสถานะส่วนตัว (user.status) เท่านั้น */
    ticketStatus?: string | null;
    /** หัวข้อส่วนมอบหมายงาน จาก headcategory (tabIndex=1) */
    sectionTitle?: string;
    /** Lookup emp_code จาก assignOptions — แสดงใน modal แม้ snapshot ยังไม่มี emp_code (loading/ມອບໝາຍ) */
    empCodeMap?: EmpCodeMap | null;
}

function getDisplayEmpCode(user: Assignee, empCodeMap?: EmpCodeMap | null): string {
    const fromUser = user.emp_code != null && String(user.emp_code).trim() !== "" ? String(user.emp_code).trim() : null;
    if (fromUser) return fromUser;
    if (empCodeMap) {
        const byId = empCodeMap.get(Number(user.id));
        if (byId) return byId;
        if (user.employeeId != null) {
            const byEmpId = empCodeMap.get(Number(user.employeeId));
            if (byEmpId) return byEmpId;
        }
    }
    return "—";
}

export const AssigneeDialog = ({ visible, onHide, assignees, sectionTitle = "ມອບໝາຍໃຫ້", empCodeMap }: Props) => {
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
                    // สถานะส่วนตัวของช่าง (assignment) — ไม่ใช้ ticketStatus
                    const statusInfo = ASSIGNEE_STATUS_MAP[user.status] ?? ASSIGNEE_STATUS_MAP.default;
                    const displayLabel = statusInfo.label;
                    const displaySeverity = statusInfo.severity as "success" | "info" | "warning" | "danger" | "secondary";
                    const displayEmpCode = getDisplayEmpCode(user, empCodeMap);

                    return (
                        <div key={user.id} className="flex align-items-center justify-content-between p-2 border-bottom-1 surface-border">
                            <div className="flex align-items-center gap-2">
                                <Avatar icon="pi pi-user" shape="circle" className="surface-100 text-500 border-1 surface-border" />
                                <div className="flex flex-column">
                                    <span className="font-bold text-sm">
                                        [{displayEmpCode}] - {user.name}
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