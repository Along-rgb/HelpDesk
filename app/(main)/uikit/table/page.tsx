"use client";
import React, { useState, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { Checkbox } from "primereact/checkbox";
import { Toast } from "primereact/toast";
import { useRouter } from "next/navigation";
import { useTicketTable } from "./useTicketTable";
import { Ticket } from "./types";
import { STATUS_MAP, CUSTOM_TOOLTIP_CSS } from "./constants";
import { sanitizeStyleContent } from "@/utils/sanitizeHtml";
import { TicketActionMenu } from "@/app/components/TicketActionMenu";
import { PrioritySelector } from "./PrioritySelector";
import { TicketHeader } from "./TicketHeader";
import { AssigneeDialog } from "./AssigneeDialog";
import { TableTooltip } from "./TableTooltip";
import { TitleBody, RequesterBody, ContactBody, AssigneeBody } from "./TicketColumnTemplates";

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
        dialogVisible, currentAssignees, currentTicketStatus, openAssigneeDialog, closeDialog,
        onBulkAssign,
        isRole2,
        onReceiveTaskSelf,
        receiveSelfDisabled,
        canReceiveSelf,
    } = useTicketTable(toastRef);

    const [first, setFirst] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(15);

    const centerProps = { align: 'center' as const, alignHeader: 'center' as const };

    return (
        <div className="grid">
            <Toast ref={toastRef} position="top-center" />
            <style dangerouslySetInnerHTML={{ __html: sanitizeStyleContent(CUSTOM_TOOLTIP_CSS) }} />

            <div className="col-12">
                <div className="card">
                    <TableTooltip target=".js-tooltip-target" dependencies={[tickets, first]} />
                    <AssigneeDialog visible={dialogVisible} onHide={closeDialog} assignees={currentAssignees} ticketStatus={currentTicketStatus} sectionTitle={assignmentSectionTitle} />           
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
                        currentPageReportTemplate="ສະແດງ {first} ເຖີງ {last} ຈາກທັງໝົດ {totalRecords} ລາຍການ"
                        dataKey="id"
                        size="small"
                        scrollable
                        scrollHeight="60vh"
                        loading={loading}
                        tableStyle={{ minWidth: "60rem" }}
                        style={{ fontSize: "calc(1rem + 1.5px)" }}
                        emptyMessage={loading ? undefined : <div className="text-center p-4">ບໍ່ພົບຂໍ້ມູນ</div>}
                        first={first}
                        onPage={(e) => {
                            setFirst(e.first);
                            setRowsPerPage(e.rows);
                        }}
                    >
                        <Column 
                            headerStyle={{ width: '3rem' }} style={{ maxWidth: '3rem' }} {...centerProps} 
                            body={(rowData: Ticket) => {
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
                            }}
                        />
                        
                        {/* ✅ [UPDATE] ใช้ field="id" แทนการคำนวณลำดับ */}
                        <Column 
                            field="id" 
                            header="ລະຫັດ" 
                            style={{ minWidth: "80px", fontWeight: 'bold' }} 
                            {...centerProps} 
                        /> 

                        <Column field="title" header="ຫົວຂໍ້" body={TitleBody} style={{ minWidth: "200px" }} />
                        <Column field="date" header="ວັນທີ່ຮ້ອງຂໍ" style={{ minWidth: "170px" }} {...centerProps} />
                        <Column header="ຜູ້ຮ້ອງຂໍ" body={RequesterBody} style={{ minWidth: "120px" }} {...centerProps} />
                        <Column header="ເບີຕິດຕໍ່" body={ContactBody} style={{ minWidth: "110px" }} {...centerProps} />
                        <Column header="ມອບໝາຍໃຫ້" body={(rowData: Ticket) => AssigneeBody(rowData, (assignees) => openAssigneeDialog(assignees, rowData.status))} style={{ minWidth: "140px" }} {...centerProps} />   
                        <Column
                            field="status"
                            header="ສະຖານະ"
                            style={{ minWidth: "100px" }}
                            {...centerProps}
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
                            style={{ minWidth: "130px" }}
                            {...centerProps}
                            body={(rowData: Ticket) => (
                                <PrioritySelector
                                    priority={rowData.priority || "ບໍ່ລະບຸ"}
                                    options={priorityOptions}
                                    onChange={(option) => onPriorityChange(rowData.id, option)}
                                />
                            )}
                        />    
                        <Column header="ດຳເນີນການ" style={{ minWidth: "160px" }} {...centerProps}
                            body={(rowData) => <TicketActionMenu ticket={rowData} />} 
                        />
                    </DataTable>
                </div>
            </div>
        </div>
    );
}