"use client";
import React, { useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { Checkbox } from "primereact/checkbox";
import { useRouter } from "next/navigation";
import { useTicketTableTechn } from "./useTicketTableTechn";
import { Ticket } from "./types";
import { STATUS_MAP, CUSTOM_TOOLTIP_CSS } from "./constants";
import { TicketActionMenu } from "@/app/components/TicketActionMenu";
import { PrioritySelector } from "./PrioritySelector";
import { TicketHeaderTechn } from "./TicketHeaderTechn";
import { AssigneeDialog } from "./AssigneeDialog";
import { TableTooltip } from "./TableTooltip";
import { TitleBody, RequesterBody, AssigneeBody } from "./TicketColumnTemplates";

export default function PageTechnDemo() {
    const router = useRouter();
    const {
        tickets,
        loading,
        selectedTickets,
        globalFilter,
        onGlobalFilterChange,
        statusFilter,
        setStatusFilter,
        onCheckboxChange,
        onPriorityChange,
        dialogVisible,
        currentAssignees,
        openAssigneeDialog,
        closeDialog,
    } = useTicketTableTechn();

    const [first, setFirst] = useState(0);

    const centerProps = { align: "center" as const, alignHeader: "center" as const };

    return (
        <div className="grid">
            <style dangerouslySetInnerHTML={{ __html: CUSTOM_TOOLTIP_CSS }} />

            <div className="col-12">
                <div className="card">
                    <TableTooltip target=".js-tooltip-target" dependencies={[tickets, first]} />
                    <AssigneeDialog
                        visible={dialogVisible}
                        onHide={closeDialog}
                        assignees={currentAssignees}
                    />
                    <TicketHeaderTechn
                        statusFilter={statusFilter}
                        setStatusFilter={setStatusFilter}
                        globalFilter={globalFilter}
                        onGlobalFilterChange={onGlobalFilterChange}
                        isSelectionEmpty={selectedTickets.length === 0}
                        onAcceptSelf={() => {}}
                        onNewTicket={() => router.push("/uikit/GroupProblem")}
                        onNewService={() => router.push("/uikit/GroupServices")}
                    />
                    <DataTable
                        value={tickets}
                        loading={loading}
                        paginator
                        rows={10}
                        dataKey="id"
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
                            body={(rowData: Ticket) => (
                                <div className="flex justify-content-center">
                                    <Checkbox
                                        checked={selectedTickets.some((t) => t.id === rowData.id)}
                                        onChange={(e) => onCheckboxChange(e, rowData)}
                                    />
                                </div>
                            )}
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
                            body={(rowData: Ticket) =>
                                AssigneeBody(rowData, openAssigneeDialog)
                            }
                        />

                        <Column
                            field="assignDate"
                            header="ວັນທີມອບໝາຍ"
                            style={{ minWidth: "120px" }}
                            {...centerProps}
                            body={(rowData: Ticket) =>
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
                            body={(rowData) => (
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
                            body={(rowData) => (
                                <PrioritySelector
                                    priority={rowData.priority}
                                    onChange={(val) => onPriorityChange(rowData.id, val)}
                                />
                            )}
                        />

                        <Column
                            header="ດຳເນີນການ"
                            style={{ minWidth: "160px" }}
                            {...centerProps}
                            body={(rowData) => <TicketActionMenu ticket={rowData} />}
                        />
                    </DataTable>
                </div>
            </div>
        </div>
    );
}
