"use client";
import React, { useCallback, useEffect, useState, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { Checkbox } from "primereact/checkbox";
import { Toast } from "primereact/toast";
import { useRouter } from "next/navigation";
import { useTicketTable } from "./useTicketTable";
import { Ticket } from "./types";
import { STATUS_MAP, CUSTOM_TOOLTIP_CSS } from "./constants";
import { TicketActionMenu } from "@/app/components/TicketActionMenu";
import type { TicketActionMenuItem } from "@/app/components/TicketActionMenu";
import { sanitizeStyleContent } from "@/utils/sanitizeHtml";
import { PrioritySelector } from "./PrioritySelector";
import { TicketHeader } from "./TicketHeader";
import { AssigneeDialog } from "./AssigneeDialog";
import { TableTooltip } from "./TableTooltip";
import { TitleBody, RequesterBody, ContactBody, AssigneeBody } from "./TicketColumnTemplates";

const CENTER_PROPS = { align: 'center' as const, alignHeader: 'center' as const };

/** ไอคอนต่อ helpdesk status id จาก API helpdeskstatus/admin */
const DETAIL_STATUS_ICONS: Record<number, string> = {
    4: "pi pi-check-circle",   /* ແກ້ໄຂແລ້ວ */
    5: "pi pi-external-link", /* ສົ່ງອອກແປງນອກ */
    6: "pi pi-pause",          /* ພັກໃວ້ */
    7: "pi pi-times-circle",   /* ປິດວຽກແລ້ວ */
    8: "pi pi-circle",         /* ຍົກເລີກ */
};
/** id สถานะທີ່ບໍ່ໃຫ້ກົດ (ປິດວຽກແລ້ວ, ຍົກເລີກ) */
const DETAIL_STATUS_DISABLED_IDS = [7, 8] as const;

export default function TableDemo() {
    const router = useRouter();
    const toastRef = useRef<Toast>(null);
    const {
        tickets,
        loading,
        error,
        selectedTickets,
        globalFilter, onGlobalFilterChange,
        statusFilter, setStatusFilter,
        statusOptions,
        assignOptions,
        assignFilter, setAssignFilter,
        assignmentSectionTitle,
        priorityOptions,
        onCheckboxChange, onPriorityChange,
        dialogVisible, currentAssignees, currentTicketStatus, staffEmpCodeMap, openAssigneeDialog, closeDialog,
        onBulkAssign,
        isRole2,
        onReceiveTaskSelf,
        receiveSelfDisabled,
        canReceiveSelf,
        getDisplayStatus,
        adminStatusList,
        updateTicketStatus,
    } = useTicketTable(toastRef);

    const [first, setFirst] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(15);

    // ถ้ากรองแล้วจำนวนรายการน้อยลง: รีเซ็ตไปหน้าแรกเพื่อไม่ให้เห็นตารางว่าง (เพราะอยู่หน้าที่เกิน)
    useEffect(() => {
        setFirst(0);
    }, [globalFilter, statusFilter]);

    const getRowMenuItems = useCallback(
        (rowData: Ticket): TicketActionMenuItem[] =>
            adminStatusList.map((s) => {
                const id = s.id;
                const isDisabled = (DETAIL_STATUS_DISABLED_IDS as readonly number[]).includes(id);
                return {
                    label: s.name,
                    icon: DETAIL_STATUS_ICONS[id] ?? "pi pi-circle",
                    className: id === 8 ? "text-red-500" : undefined,
                    command: isDisabled ? () => {} : () => updateTicketStatus(rowData.id, id),
                    disabled: isDisabled,
                };
            }),
        [adminStatusList, updateTicketStatus]
    );

    const renderCheckboxBody = useCallback(
        (rowData: Ticket) => {
            const showCheckbox = isRole2 ? canReceiveSelf(rowData) : true;
            return (
                <div className="flex justify-content-center">
                    {showCheckbox ? (
                        <Checkbox checked={selectedTickets.some((t) => t.id === rowData.id)} onChange={(e) => onCheckboxChange(e, rowData)} />
                    ) : (
                        <span className="text-400">—</span>
                    )}
                </div>
            );
        },
        [isRole2, canReceiveSelf, selectedTickets, onCheckboxChange]
    );

    const renderAssigneeBody = useCallback(
        (rowData: Ticket) => AssigneeBody(rowData, (assignees) => openAssigneeDialog(assignees, rowData.status)),
        [openAssigneeDialog]
    );

    const renderStatusBody = useCallback(
        (rowData: Ticket) => {
            const displayStatus = getDisplayStatus(rowData);
            return (
                <Tag
                    value={displayStatus || "—"}
                    severity={(STATUS_MAP[displayStatus] ?? null) as any}
                    style={{ fontSize: "0.85rem" }}
                />
            );
        },
        [getDisplayStatus]
    );

    const renderPriorityBody = useCallback(
        (rowData: Ticket) => (
            <PrioritySelector
                priority={rowData.priority || "ບໍ່ລະບຸ"}
                options={priorityOptions}
                onChange={(option) => onPriorityChange(rowData.id, option)}
            />
        ),
        [priorityOptions, onPriorityChange]
    );

    const renderActionBody = useCallback(
        (rowData: Ticket) => <TicketActionMenu ticket={rowData} menuItems={getRowMenuItems(rowData)} />,
        [getRowMenuItems]
    );

    return (
        <div className="grid">
            <Toast ref={toastRef} position="top-center" />
            <style dangerouslySetInnerHTML={{ __html: sanitizeStyleContent(CUSTOM_TOOLTIP_CSS) }} />

            <div className="col-12">
                <div className="card">
                    <TableTooltip target=".js-tooltip-target" dependencies={[tickets, first]} />
                    <AssigneeDialog visible={dialogVisible} onHide={closeDialog} assignees={currentAssignees} ticketStatus={currentTicketStatus} sectionTitle={assignmentSectionTitle} empCodeMap={staffEmpCodeMap} />           
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
                        value={tickets ?? []}
                        paginator
                        rows={rowsPerPage}
                        rowsPerPageOptions={[15, 25, 50]}
                        paginatorTemplate="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
                        currentPageReportTemplate="ສະແດງ {first} ເຖີງ {last} ຈາກທັງໝົດ {totalRecords} ລາຍການ"
                        dataKey="id"
                        size="small"
                        scrollable
                        scrollHeight="60vh"
                        loading={loading && (tickets?.length ?? 0) === 0}
                        tableStyle={{ minWidth: "60rem" }}
                        style={{ fontSize: "calc(1rem + 1.5px)" }}
                        emptyMessage={loading && (tickets?.length ?? 0) === 0 ? undefined : <div className="text-center p-4">ບໍ່ພົບຂໍ້ມູນ</div>}
                        first={first}
                        onPage={(e) => {
                            setFirst(e.first);
                            setRowsPerPage(e.rows);
                        }}
                    >
                        <Column 
                            headerStyle={{ width: '3rem' }} style={{ maxWidth: '3rem' }} {...CENTER_PROPS} 
                            body={renderCheckboxBody}
                        />
                        
                        {/* ✅ [UPDATE] ใช้ field="id" แทนการคำนวณลำดับ */}
                        <Column 
                            field="id" 
                            header="ລະຫັດ" 
                            style={{ minWidth: "80px", fontWeight: 'bold' }} 
                            {...CENTER_PROPS} 
                        /> 

                        <Column field="title" header="ຫົວຂໍ້" body={TitleBody} style={{ minWidth: "200px" }} />
                        <Column field="date" header="ວັນທີ່ຮ້ອງຂໍ" style={{ minWidth: "170px" }} {...CENTER_PROPS} />
                        <Column header="ຜູ້ຮ້ອງຂໍ" body={RequesterBody} style={{ minWidth: "120px" }} {...CENTER_PROPS} />
                        <Column header="ເບີຕິດຕໍ່" body={ContactBody} style={{ minWidth: "110px" }} {...CENTER_PROPS} />
                        <Column header="ມອບໝາຍໃຫ້" body={renderAssigneeBody} style={{ minWidth: "140px" }} {...CENTER_PROPS} />   
                        <Column
                            field="status"
                            header="ສະຖານະ"
                            style={{ minWidth: "100px" }}
                            {...CENTER_PROPS}
                            body={renderStatusBody}
                        />
                        <Column
                            header="ຄວາມສຳຄັນ"
                            style={{ minWidth: "130px" }}
                            {...CENTER_PROPS}
                            body={renderPriorityBody}
                        />    
                        <Column header="ດຳເນີນການ" style={{ minWidth: "160px" }} {...CENTER_PROPS}
                            body={renderActionBody} 
                        />
                    </DataTable>
                </div>
            </div>
        </div>
    );
}