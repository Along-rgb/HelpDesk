"use client";
import React, { useState, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import { useTicketTableTechn } from "./useTicketTableTechn";
import { TicketRow } from "./types";
import { Ticket } from "./types";
import { STATUS_MAP, CUSTOM_TOOLTIP_CSS, PRIORITY_MAP } from "./constants";
import { sanitizeStyleContent } from "@/utils/sanitizeHtml";
import { TicketActionMenu } from "@/app/components/TicketActionMenu";
import type { TicketActionMenuItem } from "@/app/components/TicketActionMenu";
import { TicketHeaderTechn } from "./TicketHeaderTechn";
import { AssigneeDialog } from "./AssigneeDialog";
import { TableTooltip } from "./TableTooltip";
import { TitleBody, RequesterBody, AssigneeBody, AssigneeSingleBody } from "./TicketColumnTemplates";

/** ລຳດັບສະຖານະໃນ dropdown ລາຍລະອຽດ: ແກ້ໄຂແລ້ວ, ພັກໃວ້, ສົ່ງອອກແປງນອກ, ປິດວຽກແລ້ວ (id 6 = Dis — กดไม่ได้) */
const DETAIL_STATUS_ORDER = [3, 5, 4, 6];
const DETAIL_STATUS_ICONS: Record<number, string> = {
    3: "pi pi-check",
    5: "pi pi-pause",
    4: "pi pi-send",
    6: "pi pi-times-circle",
};
/** id ປິດວຽກແລ້ວ — ໃຫ້ Dis (disabled) กดไม่ได้ */
const DETAIL_STATUS_DISABLED_ID = 6;

function buildDetailMenuItems(
    ticket: Ticket,
    statusList: { id: number; name: string }[],
    updateTicketStatus: (ticketId: string | number, helpdeskStatusId: number) => Promise<void>
): TicketActionMenuItem[] {
    const byId = new Map(statusList.map((s) => [s.id, s]));
    return DETAIL_STATUS_ORDER.filter((id) => byId.has(id)).map((id) => {
        const s = byId.get(id)!;
        const isDisabled = id === DETAIL_STATUS_DISABLED_ID;
        return {
            label: s.name,
            icon: DETAIL_STATUS_ICONS[id] ?? "pi pi-circle",
            command: isDisabled ? () => {} : () => updateTicketStatus(ticket.id, id),
            disabled: isDisabled, // ປິດວຽກແລ້ວ (id 6) = Dis กดไม่ได้
        };
    });
}

export default function PageTechnDemo() {
    const toastRef = useRef<Toast>(null);
    const {
        displayRows,
        loading,
        globalFilter,
        onGlobalFilterChange,
        statusFilter,
        setStatusFilter,
        statusOptions,
        dialogVisible,
        currentAssignees,
        openAssigneeDialog,
        closeDialog,
        showAction,
        getTicketFromRow,
        statusList,
        updateTicketStatus,
    } = useTicketTableTechn(toastRef);

    const [first, setFirst] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(15);

    const centerProps = { align: "center" as const, alignHeader: "center" as const };

    return (
        <div className="grid">
            <Toast ref={toastRef} position="top-center" />
            <style dangerouslySetInnerHTML={{ __html: sanitizeStyleContent(CUSTOM_TOOLTIP_CSS) }} />

            <div className="col-12">
                <div className="card">
                    <TableTooltip target=".js-tooltip-target" dependencies={[displayRows, first]} />
                    <AssigneeDialog
                        visible={dialogVisible}
                        onHide={closeDialog}
                        assignees={currentAssignees}
                    />
                    <TicketHeaderTechn
                        statusFilter={statusFilter}
                        setStatusFilter={setStatusFilter}
                        statusOptions={statusOptions}
                        globalFilter={globalFilter}
                        onGlobalFilterChange={onGlobalFilterChange}
                    />
                    <DataTable
                        value={displayRows}
                        loading={loading}
                        paginator
                        rows={rowsPerPage}
                        rowsPerPageOptions={[15, 25, 50]}
                        paginatorTemplate="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
                        currentPageReportTemplate="ສະແດງ {first} ເຖີງ {last} ຈາກທັງໝົດ {totalRecords} ລາຍການ"
                        dataKey="rowId"
                        size="small"
                        scrollable
                        scrollHeight="60vh"
                        tableStyle={{ minWidth: "60rem" }}
                        style={{ fontSize: "1rem" }}
                        emptyMessage={<div className="text-center p-4">ບໍ່ພົບຂໍ້ມູນ</div>}
                        first={first}
                        onPage={(e) => {
                            setFirst(e.first);
                            setRowsPerPage(e.rows);
                        }}
                    >
                        <Column
                            field="id"
                            header="ລະຫັດ"
                            style={{ minWidth: "80px", fontWeight: "bold" }}
                            {...centerProps}
                        />

                        <Column
                            field="title"
                            header="ຫົວຂໍ້"
                            body={TitleBody}
                            style={{ minWidth: "200px" }}
                        />

                        <Column
                            header="ມອບໝາຍໃຫ້"
                            style={{ minWidth: "140px" }}
                            {...centerProps}
                            body={(rowData: TicketRow) =>
                                rowData.rowAssignee
                                    ? AssigneeSingleBody(rowData.rowAssignee)
                                    : AssigneeBody(rowData, openAssigneeDialog)
                            }
                        />

                        <Column
                            field="assignDate"
                            header="ວັນທີມອບໝາຍ"
                            style={{ minWidth: "170px" }}
                            {...centerProps}
                            body={(rowData: TicketRow) =>
                                rowData.assignDate || (
                                    <span className="text-500 text-sm">-</span>
                                )
                            }
                        />

                        <Column
                            field="firstname_req"
                            header="ຜູ້ຮ້ອງຂໍ"
                            body={RequesterBody}
                            style={{ minWidth: "100px" }}
                            {...centerProps}
                        />

                        <Column
                            field="date"
                            header="ວັນທີຮ້ອງຂໍ"
                            style={{ minWidth: "170px" }}
                            {...centerProps}
                        />

                        <Column
                            field="status"
                            header="ສະຖານະ"
                            style={{ minWidth: "100px" }}
                            {...centerProps}
                            body={(rowData: TicketRow) => (
                                <Tag
                                    value={rowData.status}
                                    severity={STATUS_MAP[rowData.status] as any}
                                    style={{ fontSize: "0.85rem" }}
                                />
                            )}
                        />

                        <Column
                            header="ລຳດັບຄວາມສຳຄັນ"
                            style={{ minWidth: "130px" }}
                            {...centerProps}
                            body={(rowData: TicketRow) => {
                                const p = rowData.priority || "ບໍ່ລະບຸ";
                                const isNeutral = p === "ບໍ່ລະບຸ" || p === "ທຳມະດາ";
                                return (
                                    <Tag
                                        value={p}
                                        severity={(PRIORITY_MAP[p] ?? null) as any}
                                        style={{
                                            fontSize: "0.95rem",
                                            padding: "0.15rem 0.5rem",
                                            backgroundColor: isNeutral ? "#6c757d" : undefined,
                                            color: isNeutral ? "#fff" : undefined,
                                        }}
                                    />
                                );
                            }}
                        />

                        <Column
                            header="ດຳເນີນການ"
                            style={{ minWidth: "160px" }}
                            {...centerProps}
                            body={(rowData: TicketRow) =>
                                showAction(rowData) ? (
                                    <TicketActionMenu
                                        ticket={getTicketFromRow(rowData)}
                                        variant="techn"
                                        menuItems={buildDetailMenuItems(
                                            getTicketFromRow(rowData),
                                            statusList,
                                            updateTicketStatus
                                        )}
                                    />
                                ) : null
                            }
                        />
                    </DataTable>
                </div>
            </div>
        </div>
    );
}
