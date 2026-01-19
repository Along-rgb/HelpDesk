"use client";
import React, { useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { Checkbox } from "primereact/checkbox";
import { useRouter } from "next/navigation";
import { useTicketTable } from "./useTicketTable"; 
import { Ticket } from "./types";
import { STATUS_MAP, CUSTOM_TOOLTIP_CSS } from "./constants"; 
import { TicketActionMenu } from "./TicketActionMenu";
import { PrioritySelector } from "./PrioritySelector";
import { TicketHeader } from "./TicketHeader";
import { AssigneeDialog } from "./AssigneeDialog";

import { TableTooltip } from "./TableTooltip";
import { TitleBody, RequesterBody, AssigneeBody } from "./TicketColumnTemplates";

export default function TableDemo() {
    const router = useRouter();
    const {
        tickets, 
        selectedTickets,
        globalFilter, onGlobalFilterChange,
        statusFilter, setStatusFilter,
        assignFilter, setAssignFilter,
        onCheckboxChange, onPriorityChange,
        dialogVisible, currentAssignees, openAssigneeDialog, closeDialog,
        onBulkAssign
    } = useTicketTable();

    const [first, setFirst] = useState(0);

    const centerProps = { align: 'center' as const, alignHeader: 'center' as const };

    return (
        <div className="grid">
            <style dangerouslySetInnerHTML={{__html: CUSTOM_TOOLTIP_CSS}} />

            <div className="col-12">
                <div className="card">
                    <TableTooltip target=".js-tooltip-target" dependencies={[tickets, first]} />
                    <AssigneeDialog visible={dialogVisible} onHide={closeDialog} assignees={currentAssignees} />           
                    <TicketHeader 
                        statusFilter={statusFilter} setStatusFilter={setStatusFilter}
                        assignFilter={assignFilter} setAssignFilter={setAssignFilter}
                        globalFilter={globalFilter} onGlobalFilterChange={onGlobalFilterChange}
                        isSelectionEmpty={selectedTickets.length === 0} 
                        onNewTicket={() => router.push("/uikit/GroupProblem")}
                         onNewService={() => router.push("/uikit/GroupServices")}
                        onBulkAssign={onBulkAssign}
                    />
                    <DataTable
                        value={tickets} paginator rows={10} dataKey="id" size="small"
                        scrollable scrollHeight="flex"
                        tableStyle={{ minWidth: '60rem' }} style={{ fontSize: '0.85rem' }}
                        emptyMessage={<div className="text-center p-4">ບໍ່ພົບຂໍ້ມູນ</div>}               
                        first={first} onPage={(e) => setFirst(e.first)}
                    >
                        <Column 
                            headerStyle={{ width: '3rem' }} style={{ maxWidth: '3rem' }} {...centerProps} 
                            body={(rowData: Ticket) => (
                                <div className="flex justify-content-center">
                                    <Checkbox checked={selectedTickets.some((t) => t.id === rowData.id)} onChange={(e) => onCheckboxChange(e, rowData)} />
                                </div>
                            )}
                        />
                        
                        {/* ✅ [UPDATE] ใช้ field="id" แทนการคำนวณลำดับ */}
                        <Column 
                            field="id" 
                            header="ລະຫັດ" 
                            style={{ minWidth: "80px", fontWeight: 'bold' }} 
                            {...centerProps} 
                        /> 

                        <Column field="title" header="ຫົວຂໍ້ເລື່ອງ" body={TitleBody} style={{ minWidth: "150px", maxWidth: "300px" }} />
                        <Column field="date" header="ວັນທີ່ຮ້ອງຂໍ" style={{ minWidth: "140px" }} {...centerProps} />
                        <Column field="firstname_req" header="ຜູ້ຮ້ອງຂໍ" body={RequesterBody} style={{ minWidth: "100px" }} {...centerProps} />                 
                        <Column header="ມອບໝາຍໃຫ້" style={{ minWidth: "140px" }} {...centerProps}
                            body={(rowData: Ticket) => AssigneeBody(rowData, openAssigneeDialog)}
                        />   
                        <Column 
                            field="status" header="ສະຖານະ" style={{ minWidth: "100px" }} {...centerProps} 
                            body={(rowData) => <Tag value={rowData.status} severity={STATUS_MAP[rowData.status] as any} style={{ fontSize: '0.75rem' }} />}
                        />                   
                        <Column header="ຄວາມສຳຄັນ" style={{ minWidth: "130px" }} {...centerProps}
                            body={(rowData) => <PrioritySelector priority={rowData.priority} onChange={(val) => onPriorityChange(rowData.id, val)} />}
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