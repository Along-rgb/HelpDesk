"use client";
import React from "react";
import { Avatar } from "primereact/avatar";
import { AvatarGroup } from "primereact/avatargroup";
import { Assignee } from "./types";
import { ASSIGNEE_STATUS_MAP } from "./constants";

const getInitials = (name: string) => {
    return name ? name.substring(0, 2).toUpperCase() : "??";
};

const getColor = (name: string) => {
    const colors = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6"];
    const index = (name || "").length % colors.length;
    return colors[index];
};

/** แสดง assignee เดียวเป็น Avatar + ชื่อ ในบล็อกเดียว */
export const AssigneeSingleAvatar = React.memo(({
    assignee,
    ticketStatus,
    displayName,
    onClick,
}: {
    assignee: Assignee;
    ticketStatus?: string;
    displayName: string;
    onClick?: () => void;
}) => {
    const statusInfo = ASSIGNEE_STATUS_MAP[assignee.status] || ASSIGNEE_STATUS_MAP["default"];
    const tooltipText = ticketStatus ? `${assignee.name} | ${ticketStatus}` : `${assignee.name} | ${statusInfo.label}`;

    const content = (
        <>
            <Avatar
                label={!assignee.image ? getInitials(assignee.name) : undefined}
                image={assignee.image}
                shape="circle"
                size="normal"
                style={{
                    backgroundColor: getColor(assignee.name),
                    color: "#ffffff",
                    border: "2px solid #ffffff",
                    flexShrink: 0,
                }}
                className="js-tooltip-target"
                data-pr-tooltip={tooltipText}
                data-pr-position="bottom"
            />
            <span className="ml-2 font-bold text-sm truncate" style={{ minWidth: 0 }}>
                {displayName}
            </span>
        </>
    );

    if (onClick) {
        return (
            <div
                className="flex align-items-center cursor-pointer hover:surface-100 p-1 border-round transition-duration-200"
                onClick={(e) => {
                    e.stopPropagation();
                    onClick();
                }}
            >
                {content}
            </div>
        );
    }
    return <div className="flex align-items-center p-1">{content}</div>;
});
AssigneeSingleAvatar.displayName = 'AssigneeSingleAvatar';

interface Props {
    assignees: Assignee[];
    ticketStatus?: string;
    onClick: () => void;
}

export const AssigneeAvatarGroup = React.memo(({ assignees, ticketStatus, onClick }: Props) => {
    const safeAssignees = assignees || [];

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
                    const statusInfo = ASSIGNEE_STATUS_MAP[user.status] || ASSIGNEE_STATUS_MAP["default"];
                    const tooltipText = ticketStatus
                        ? `${user.name} | ${ticketStatus}`
                        : `${user.name} | ${statusInfo.label}`;

                    return (
                        <Avatar
                            key={String(user.id)}
                            label={!user.image ? getInitials(user.name) : undefined}
                            image={user.image}
                            shape="circle"
                            size="normal"
                            style={{
                                backgroundColor: getColor(user.name),
                                color: "#ffffff",
                                border: "2px solid #ffffff",
                            }}
                            className="js-tooltip-target"
                            data-pr-tooltip={tooltipText}
                            data-pr-position="bottom"
                        />
                    );
                })}

                {safeAssignees.length > 3 && (
                    <Avatar
                        label={`+${safeAssignees.length - 3}`}
                        shape="circle"
                        size="normal"
                        style={{
                            backgroundColor: "#9ca3af",
                            color: "#ffffff",
                            border: "2px solid #ffffff",
                        }}
                        className="js-tooltip-target"
                        data-pr-tooltip={`ຍັງມີອີກ ${safeAssignees.length - 3} ຄົນ`}
                        data-pr-position="bottom"
                    />
                )}
            </AvatarGroup>
        </div>
    );
});
AssigneeAvatarGroup.displayName = 'AssigneeAvatarGroup';
