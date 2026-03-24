"use client";
import React, { useState, useRef, useCallback, useMemo } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { Checkbox } from "primereact/checkbox";
import { Toast } from "primereact/toast";
import { useTicketTable } from "./useTicketTable";
import { Ticket } from "./types";
import { STATUS_MAP, STATUS_ICON_MAP, STATUS_ICON_FALLBACK, CUSTOM_TOOLTIP_CSS } from "./constants";
import { sanitizeStyleContent } from "@/utils/sanitizeHtml";
import { TicketActionMenu } from "@/app/components/TicketActionMenu";
import { PrioritySelector } from "./PrioritySelector";
import { TicketHeader } from "./TicketHeader";
import { AssigneeDialog } from "./AssigneeDialog";
import { TableTooltip } from "./TableTooltip";
import { TitleBody, RequesterBody, ContactBody, AssigneeBody, buildStatusByIdMap } from "./TicketColumnTemplates";

const STATUS_DONE_ID = 4;
const STATUS_EXTERNAL_ID = 5;
const STATUS_PAUSE_ID = 6;
const STATUS_CLOSED_ID = 7;
const STATUS_CANCEL_ID = 8;
const CENTER_PROPS = { align: 'center' as const, alignHeader: 'center' as const };

/** ກວດສອບວ່າມີຊ່າງຢ່າງໜ້ອຍ 1 ຄົນ ທີ່ statusId === 4 (ແກ້ໄຂແລ້ວ) */
function hasAssigneeFixed(ticket: Ticket): boolean {
    return (ticket.assignees ?? []).some((a) => a.statusId === STATUS_DONE_ID);
}

/** ກວດສອບວ່າມີຊ່າງຢ່າງໜ້ອຍ 1 ຄົນ ທີ່ statusId === 5 (ສົ່ງອອກແປງນອກ) */
function hasAssigneeExternal(ticket: Ticket): boolean {
    return (ticket.assignees ?? []).some((a) => a.statusId === STATUS_EXTERNAL_ID);
}

/** ກວດສອບວ່າມີຊ່າງຢ່າງໜ້ອຍ 1 ຄົນ ທີ່ statusId === 6 (ພັກໃວ້) */
function hasAssigneePaused(ticket: Ticket): boolean {
    return (ticket.assignees ?? []).some((a) => a.statusId === STATUS_PAUSE_ID);
}

export default function TableDemo() {
    const toastRef = useRef<Toast>(null);
    const { tickets, loading, error, selectedTickets, globalFilter, onGlobalFilterChange, statusFilter, setStatusFilter, statusOptions, assignOptions, assignFilter, setAssignFilter, assignmentSectionTitle, priorityOptions, onCheckboxChange, onPriorityChange, dialogVisible, currentAssignees, currentTicketStatus, statusList, statusListForModal, openAssigneeDialog, closeDialog, onBulkAssign, isRole2, onReceiveTaskSelf, receiveSelfDisabled, canReceiveSelf, onStatusChange } = useTicketTable(toastRef);

    const [first, setFirst] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(15);

    /** Memoize statusByIdMap so AssigneeBody doesn't rebuild Map per row */
    const statusByIdMap = useMemo(() => buildStatusByIdMap(statusListForModal), [statusListForModal]);

    const onPageChange = useCallback((e: { first: number; rows: number }) => {
        setFirst(e.first);
        setRowsPerPage(e.rows);
    }, []);

    /** ສ້າງ menu items ສຳລັບ TicketActionMenu ແຕ່ລະແຖວ */
    const buildMenuItems = useCallback(
        (rowData: Ticket) => {
            const tStatusId = rowData.statusId;

            if (tStatusId === STATUS_CLOSED_ID) return [];

            if (tStatusId === STATUS_DONE_ID) {
                return statusList
                    .filter((s) => s.id === STATUS_CLOSED_ID)
                    .map((s) => ({
                        label: s.name,
                        icon: STATUS_ICON_MAP[s.name] ?? STATUS_ICON_FALLBACK,
                        command: () => onStatusChange(rowData.id, s.id),
                    }));
            }

            if (tStatusId === STATUS_PAUSE_ID || tStatusId === STATUS_EXTERNAL_ID) {
                const hasDone = hasAssigneeFixed(rowData);
                if (hasDone) {
                    return statusList
                        .filter((s) => s.id === STATUS_DONE_ID || s.id === STATUS_CLOSED_ID)
                        .map((s) => ({
                            label: s.name,
                            icon: STATUS_ICON_MAP[s.name] ?? STATUS_ICON_FALLBACK,
                            command: () => onStatusChange(rowData.id, s.id),
                        }));
                }
                if (tStatusId === STATUS_PAUSE_ID && hasAssigneeExternal(rowData)) {
                    return statusList
                        .filter((s) => s.id === STATUS_EXTERNAL_ID || s.id === STATUS_CANCEL_ID)
                        .map((s) => ({
                            label: s.name,
                            icon: STATUS_ICON_MAP[s.name] ?? STATUS_ICON_FALLBACK,
                            command: () => onStatusChange(rowData.id, s.id),
                        }));
                }
                if (tStatusId === STATUS_EXTERNAL_ID && hasAssigneePaused(rowData)) {
                    return statusList
                        .filter((s) => s.id === STATUS_PAUSE_ID)
                        .map((s) => ({
                            label: s.name,
                            icon: STATUS_ICON_MAP[s.name] ?? STATUS_ICON_FALLBACK,
                            command: () => onStatusChange(rowData.id, s.id),
                        }));
                }
                return [];
            }

            const hasDone = hasAssigneeFixed(rowData);
            const hasPausedOrExternal = hasAssigneePaused(rowData) || hasAssigneeExternal(rowData);
            return statusList
                .map((s) => {
                    if (s.id === STATUS_DONE_ID) {
                        if (!hasDone) return null;
                        return {
                            label: s.name,
                            icon: STATUS_ICON_MAP[s.name] ?? STATUS_ICON_FALLBACK,
                            command: () => onStatusChange(rowData.id, s.id),
                        };
                    }
                    if (s.id === STATUS_CLOSED_ID) {
                        if (!hasDone) return null;
                        return {
                            label: s.name,
                            icon: STATUS_ICON_MAP[s.name] ?? STATUS_ICON_FALLBACK,
                            command: () => onStatusChange(rowData.id, s.id),
                        };
                    }
                    if (s.id === STATUS_PAUSE_ID || s.id === STATUS_EXTERNAL_ID) {
                        if (!hasPausedOrExternal) return null;
                        return {
                            label: s.name,
                            icon: STATUS_ICON_MAP[s.name] ?? STATUS_ICON_FALLBACK,
                            command: () => onStatusChange(rowData.id, s.id),
                        };
                    }
                    return {
                        label: s.name,
                        icon: STATUS_ICON_MAP[s.name] ?? STATUS_ICON_FALLBACK,
                        command: () => onStatusChange(rowData.id, s.id),
                    };
                })
                .filter((item): item is NonNullable<typeof item> => item != null);
        },
        [statusList, onStatusChange]
    );

    return (
        <div className="grid">
            <Toast ref={toastRef} position="top-center" />
            <style dangerouslySetInnerHTML={{ __html: sanitizeStyleContent(CUSTOM_TOOLTIP_CSS) }} />

            <div className="col-12">
                <div className="card">
                    <TableTooltip target=".js-tooltip-target" dependencies={[tickets, first]} />
                    <AssigneeDialog visible={dialogVisible} onHide={closeDialog} assignees={currentAssignees} statusList={statusListForModal} ticketStatus={currentTicketStatus} sectionTitle={assignmentSectionTitle} />           
                    <TicketHeader
                        statusFilter={statusFilter} setStatusFilter={setStatusFilter}
                        statusOptions={statusOptions}
                        assignOptions={assignOptions}
                        assignmentSectionTitle={assignmentSectionTitle}
                        assignFilter={assignFilter} setAssignFilter={setAssignFilter}
                        globalFilter={globalFilter} onGlobalFilterChange={onGlobalFilterChange}
                        isSelectionEmpty={selectedTickets.length === 0}
                        onBulkAssign={onBulkAssign}
                        showReceiveSelfButton={isRole2}
                        receiveSelfDisabled={receiveSelfDisabled}
                        onReceiveTaskSelf={onReceiveTaskSelf}
                    />
                    {error && (
                        <div className="flex align-items-center gap-2 p-3 mb-3 surface-100 border-round text-red-600">
                            <i className="pi pi-exclamation-triangle" />
                            <span>{error}</span>
                        </div>
                    )}
                    <DataTable
                        value={tickets}
                        paginator
                        rows={rowsPerPage}
                        rowsPerPageOptions={[15, 25, 50]}
                        paginatorTemplate="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
                        currentPageReportTemplate="ສະແດງ {first} ເຖີມ {last} ຈາກທັງໝົດ {totalRecords} ລາຍການ"
                        dataKey="id"
                        size="small"
                        scrollable
                        scrollHeight="60vh"
                        tableStyle={{ minWidth: "55rem" }}
                        style={{ fontSize: "0.95rem" }}
                        emptyMessage={loading ? undefined : <div className="text-center p-4">ບໍ່ພົບຂໍ້ມູນ</div>}
                        first={first}
                        onPage={onPageChange}
                    >
                        <Column 
                            headerStyle={{ width: '3rem' }} style={{ maxWidth: '3rem' }} {...CENTER_PROPS} 
                            body={(rowData: Ticket) => {
                                const totalAssignees = rowData.assignees?.length ?? 0;
                                const isClosedMultiAssign = totalAssignees > 1 && (rowData.statusId === STATUS_DONE_ID || rowData.statusId === STATUS_CLOSED_ID);
                                const showCheckbox = isClosedMultiAssign ? false : (isRole2 ? canReceiveSelf(rowData) : true);
                                return (
                                    <div className="flex justify-content-center">
                                        {showCheckbox ? (
                                            <Checkbox checked={selectedTickets.some((t) => t.id === rowData.id)} onChange={(e) => onCheckboxChange(e, rowData)} />
                                        ) : (
                                            <span className="text-400">—</span>
                                        )}
                                    </div>
                                );
                            }}
                        />
                        <Column 
                            field="id" 
                            header="ລະຫັດ" 
                            style={{ minWidth: "70px", fontWeight: 'bold' }} 
                            {...CENTER_PROPS} 
                        /> 
                        <Column field="title" header="ຫົວຂໍ້" body={(rowData: Ticket) => <TitleBody rowData={rowData} />} style={{ minWidth: "180px" }} />
                        <Column field="date" header="ວັນທີ່ຮ້ອງຂໍ" style={{ minWidth: "140px" }} {...CENTER_PROPS} />
                        <Column header="ຜູ້ຮ້ອງຂໍ" body={(rowData: Ticket) => <RequesterBody rowData={rowData} />} style={{ minWidth: "110px" }} {...CENTER_PROPS} />
                        <Column header="ເບີຕິດຕໍ່" body={(rowData: Ticket) => <ContactBody rowData={rowData} />} style={{ minWidth: "100px" }} {...CENTER_PROPS} />
                        <Column header="ມອບໝາຍໃຫ້" body={(rowData: Ticket) => AssigneeBody(rowData, (assignees) => openAssigneeDialog(assignees, rowData.status), statusByIdMap)} style={{ minWidth: "120px" }} {...CENTER_PROPS} />
                        <Column
                            field="status"
                            header="ສະຖານະ"
                            style={{ minWidth: "90px" }}
                            {...CENTER_PROPS}
                            body={(rowData: Ticket) => (
                                <Tag
                                    value={rowData.status || "—"}
                                    severity={(STATUS_MAP[rowData.status] ?? null) as any}
                                    style={{ fontSize: "0.85rem" }}
                                />
                            )}
                        />
                        <Column
                            header="ຄວາມສຳຄັນ"
                            style={{ minWidth: "110px" }}
                            {...CENTER_PROPS}
                            body={(rowData: Ticket) => (
                                <PrioritySelector
                                    priority={rowData.priority || "ບໍ່ລະບຸ"}
                                    options={priorityOptions}
                                    onChange={(option) => onPriorityChange(rowData.id, option)}
                                    disabled={rowData.statusId !== 1 && rowData.statusId !== 2}
                                />
                            )}
                        />    
                        <Column header="ດຳເນີນການ" style={{ minWidth: "130px" }} {...CENTER_PROPS}
                            body={(rowData: Ticket) => {
                                const menuItems = buildMenuItems(rowData);
                                const isClosed = rowData.statusId === STATUS_CLOSED_ID;
                                const ticketDone = rowData.statusId === STATUS_DONE_ID || isClosed;
                                const totalAssigneesAction = rowData.assignees?.length ?? 0;
                                const hideForClosedMultiAssign = totalAssigneesAction > 1 && ticketDone;
                                const ticketPausedOrExternal = rowData.statusId === STATUS_PAUSE_ID || rowData.statusId === STATUS_EXTERNAL_ID;
                                const showBadge = !ticketDone && (
                                    ticketPausedOrExternal
                                        ? hasAssigneeFixed(rowData)
                                        : (hasAssigneeFixed(rowData) || hasAssigneePaused(rowData) || hasAssigneeExternal(rowData))
                                );
                                return (
                                    <div style={{ position: "relative", display: "inline-block" }}>
                                        <div
                                            className="js-tooltip-target"
                                            data-pr-tooltip={showBadge ? "ມີການແກ້ໄຂສຳເລັດແລ້ວ" : undefined}
                                            data-pr-position="top"
                                        >
                                            <TicketActionMenu
                                                ticket={rowData}
                                                variant="techn"
                                                menuItems={menuItems.length > 0 ? menuItems : undefined}
                                                hideDropdown={isClosed || (ticketPausedOrExternal && !hasAssigneeFixed(rowData) && !(rowData.statusId === STATUS_PAUSE_ID && hasAssigneeExternal(rowData)) && !(rowData.statusId === STATUS_EXTERNAL_ID && hasAssigneePaused(rowData))) || (hideForClosedMultiAssign && !(isRole2 && rowData.statusId === STATUS_DONE_ID))}
                                            />
                                        </div>
                                        {showBadge && (
                                            <span
                                                style={{
                                                    position: "absolute",
                                                    top: "-6px",
                                                    right: "-6px",
                                                    background: "#ef4444",
                                                    color: "#fff",
                                                    borderRadius: "50%",
                                                    width: "18px",
                                                    height: "18px",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    fontSize: "11px",
                                                    fontWeight: 700,
                                                    lineHeight: 1,
                                                    pointerEvents: "none",
                                                    zIndex: 1,
                                                    boxShadow: "0 1px 3px rgba(0,0,0,0.18)",
                                                }}
                                            >
                                                1
                                            </span>
                                        )}
                                    </div>
                                );
                            }}
                        />
                    </DataTable>
                </div>
            </div>
        </div>
    );
}