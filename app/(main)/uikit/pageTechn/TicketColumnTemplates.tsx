"use client";
import React from "react";
import Link from "next/link";
import { Ticket, Assignee } from "./types";
import { ASSIGNEE_STATUS_MAP } from "./constants";

/** แปลงชื่อสำหรับแสดง (ตัดคำนำหน้า/เอาแค่ส่วนที่ใช้แสดง) */
function getDisplayName(user: Assignee): string {
    let displayName = user.name || "";
    if (displayName) {
        const cleanName = displayName.trim();
        const parts = cleanName.split(" ");
        const isTitle =
            parts[0] === "ທ." || parts[0] === "ນ." || (parts[0] && parts[0].includes("."));
        if (parts.length > 1 && isTitle) {
            return `${parts[0]} ${parts[1]}`;
        }
        return parts[0] || displayName;
    }
    return displayName;
}

export const TitleBody = (rowData: Ticket) => (
    <Link
        href={`/uikit/ticket-detail/${rowData.id}`}
        className="no-underline"
        style={{ color: "inherit" }}
    >
        <span
            className="js-tooltip-target cursor-pointer text-900 font-medium hover:text-blue-600 transition-colors transition-duration-200"
            data-pr-tooltip={rowData.title || ""}
            data-pr-position="top"
            style={{
                display: "block",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
            }}
        >
            {rowData.title}
        </span>
    </Link>
);

export const RequesterBody = (rowData: Ticket) => {
    const firstName = rowData.firstname_req || "";
    const lastName = rowData.lastname_req || "";
    const requesterFull = rowData.requester || "";
    const fullName =
        [firstName, lastName].filter(Boolean).join(" ").trim() || requesterFull || firstName || lastName;
    const displayName = firstName.trim() || (requesterFull ? requesterFull.split(" ")[0] || requesterFull : "");

    return (
        <span
            className="js-tooltip-target cursor-pointer text-700"
            data-pr-tooltip={fullName}
            data-pr-position="top"
            style={{ whiteSpace: "nowrap" }}
        >
            {displayName || fullName}
        </span>
    );
};

/** แสดงชื่อ assignee เดียว (สำหรับแถวที่ขยายแล้ว role 3,4) */
export const AssigneeSingleBody = (assignee: Assignee) => {
    const displayName = getDisplayName(assignee);
    const statusInfo = ASSIGNEE_STATUS_MAP[assignee.status] || ASSIGNEE_STATUS_MAP["default"];
    let textColor = "text-700";
    if (statusInfo.severity === "info") textColor = "text-blue-500";
    else if (statusInfo.severity === "success") textColor = "text-green-500";
    else if (statusInfo.severity === "warning") textColor = "text-orange-500";
    const fullName = assignee.name || "";
    return (
        <span
            className={`js-tooltip-target ${textColor} font-bold text-sm`}
            style={{ whiteSpace: "nowrap" }}
            data-pr-tooltip={fullName}
            data-pr-position="top"
        >
            {displayName || fullName}
        </span>
    );
};

export const AssigneeBody = (rowData: Ticket, action: (data: Assignee[]) => void) => {
    let displayData = rowData.assignees || [];

    if (displayData.length === 0 && rowData.assignTo) {
        displayData = [{ id: rowData.id, name: rowData.assignTo, status: "doing" } as Assignee];
    }

    if (displayData.length === 0)
        return <span className="text-500 text-sm italic">ຍັງບໍ່ໄດ້ມອບໝາຍ</span>;

    const statusInfoFirst =
        ASSIGNEE_STATUS_MAP[displayData[0].status] || ASSIGNEE_STATUS_MAP["default"];
    let textColor = "text-700";
    if (statusInfoFirst.severity === "info") textColor = "text-blue-500";
    else if (statusInfoFirst.severity === "success") textColor = "text-green-500";
    else if (statusInfoFirst.severity === "warning") textColor = "text-orange-500";

    // Tooltip: รายชื่อทั้งหมด (first_name last_name)
    const tooltipText = displayData
        .map((u) => u.name || "")
        .filter((name) => !!name && !!name.trim())
        .join(" • ");

    // แสดงเป็นรายชื่อ (ไม่ใช้ AvatarGroup)
    const nameList =
        displayData.length === 1
            ? getDisplayName(displayData[0])
            : displayData.map((u) => getDisplayName(u)).join(", ");

    return (
        <div
            className={`js-tooltip-target ${textColor} font-bold cursor-pointer text-sm`}
            onClick={() => action(displayData)}
            style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
            data-pr-tooltip={tooltipText}
            data-pr-position="bottom"
        >
            {nameList}
        </div>
    );
};
