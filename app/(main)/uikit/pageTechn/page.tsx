"use client";
import React, { useState, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { Checkbox } from "primereact/checkbox";
import { Toast } from "primereact/toast";
import { useRouter } from "next/navigation";
import { useTicketTableTechn } from "./useTicketTableTechn";
import { TicketRow } from "./types";
import { STATUS_MAP, CUSTOM_TOOLTIP_CSS, PRIORITY_MAP } from "./constants";
import { TicketActionMenu } from "@/app/components/TicketActionMenu";
import { TicketHeaderTechn } from "./TicketHeaderTechn";
import { AssigneeDialog } from "./AssigneeDialog";
import { TableTooltip } from "./TableTooltip";
import { TitleBody, RequesterBody, AssigneeBody, AssigneeSingleBody } from "./TicketColumnTemplates";

export default function PageTechnDemo() {
    const router = useRouter();
    const toastRef = useRef<Toast>(null);
    const {
        displayRows,
        loading,
        selectedTickets,
        globalFilter,
        onGlobalFilterChange,
        statusFilter,
        setStatusFilter,
        statusOptions,
        onCheckboxChange,
        dialogVisible,
        currentAssignees,
        openAssigneeDialog,
        closeDialog,
        showCheckbox,
        showAction,
        getTicketFromRow,
        onAcceptSelf,
    } = useTicketTableTechn(toastRef);

    const [first, setFirst] = useState(0);

    const centerProps = { align: "center" as const, alignHeader: "center" as const };

    return (
        <div className="grid">
            <Toast ref={toastRef} position="top-center" />
            <style dangerouslySetInnerHTML={{ __html: CUSTOM_TOOLTIP_CSS }} />

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
                        isSelectionEmpty={selectedTickets.length === 0}
                        onAcceptSelf={onAcceptSelf}
                        onNewTicket={() => router.push("/uikit/GroupProblem")}
                        onNewService={() => router.push("/uikit/GroupServices")}
                    />
                    <DataTable
                        value={displayRows}
                        loading={loading}
                        paginator
                        rows={15}
                        rowsPerPageOptions={[15, 25, 50]}
                        paginatorTemplate="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
                        currentPageReportTemplate="ສະແດງ {first} ເຖີງ {last} ຈາກທັງໝົດ {totalRecords} ລາຍການ"
                        dataKey="rowId"
                        size="small"
                        scrollable
                        scrollHeight="flex"
                        tableStyle={{ minWidth: "60rem" }}
                        style={{ fontSize: "1rem" }}
                        emptyMessage={<div className="text-center p-4">ບໍ່ພົບຂໍ້ມູນ</div>}
                        first={first}
                        onPage={(e) => setFirst(e.first)}
                    >
                        <Column
                            headerStyle={{ width: "3rem" }}
                            style={{ maxWidth: "3rem" }}
                            {...centerProps}
                            body={(rowData: TicketRow) =>
                                showCheckbox(rowData) ? (
                                    <div className="flex justify-content-center">
                                        <Checkbox
                                            checked={selectedTickets.some(
                                                (t) => t.id === getTicketFromRow(rowData).id
                                            )}
                                            onChange={(e) => onCheckboxChange(e, rowData)}
                                        />
                                    </div>
                                ) : null
                            }
                        />

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
                                    <TicketActionMenu ticket={getTicketFromRow(rowData)} />
                                ) : null
                            }
                        />
                    </DataTable>
                </div>
            </div>
        </div>
    );
}
