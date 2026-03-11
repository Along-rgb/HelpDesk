"use client";
import React, { useState, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import { Checkbox } from "primereact/checkbox";
import { useTicketTableTechn } from "./useTicketTableTechn";
import { Ticket, TicketRow } from "./types";
import { STATUS_MAP, CUSTOM_TOOLTIP_CSS, PRIORITY_MAP } from "./constants";
import { sanitizeStyleContent } from "@/utils/sanitizeHtml";
import { TicketActionMenu } from "@/app/components/TicketActionMenu";
import type { TicketActionMenuItem } from "@/app/components/TicketActionMenu";
import { TicketHeaderTechn } from "./TicketHeaderTechn";
import { TableTooltip } from "./TableTooltip";
import { TitleBody, RequesterBody } from "./TicketColumnTemplates";
import { ReportWorkModal } from "./ReportWorkModal";
import type { ReportWorkFormData } from "./types";
import { submitReportWork } from "./reportWorkService";

/** ไอคอนต่อ helpdesk status id จาก API helpdeskstatus/staff (id ตรงกับ response) */
const DETAIL_STATUS_ICONS: Record<number, string> = {
    4: "pi pi-check-circle",   /* ແກ້ໄຂແລ້ວ */
    5: "pi pi-external-link", /* ສົ່ງອອກແປງນອກ */
    6: "pi pi-pause",          /* ພັກໃວ້ */
    8: "pi pi-circle",         /* ຍົກເລີກ */
};
/** id สถานะ ແກ້ໄຂແລ້ວ — ເປີດ modal ລາຍງານວຽກ */
const DETAIL_STATUS_REPORT_WORK_ID = 4;
/** id สถานะ ຍົກເລີກ — ປຸ່ມ disabled */
const DETAIL_STATUS_DISABLED_ID = 8;

/**
 * สร้างรายการเมนู dropdown ລາຍລະອຽດ จาก GET helpdeskstatus/staff.
 */
function buildDetailMenuItems(
    ticket: Ticket,
    staffStatusList: { id: number; name: string }[],
    updateTicketStatus: (ticketId: string | number, helpdeskStatusId: number) => Promise<void>,
    onOpenReportWork: (ticket: Ticket) => void
): TicketActionMenuItem[] {
    return staffStatusList.map((s) => {
        const id = s.id;
        const isDisabled = id === DETAIL_STATUS_DISABLED_ID;
        const isReportWork = id === DETAIL_STATUS_REPORT_WORK_ID;
        const command = isDisabled
            ? () => {}
            : isReportWork
              ? () => onOpenReportWork(ticket)
              : () => updateTicketStatus(ticket.id, id);
        return {
            label: s.name,
            icon: DETAIL_STATUS_ICONS[id] ?? "pi pi-circle",
            command,
            disabled: isDisabled,
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
        showAction,
        showCheckbox,
        getTicketFromRow,
        staffStatusList,
        updateTicketStatus,
        selectedTickets,
        onCheckboxChange,
        onAcceptSelf,
    } = useTicketTableTechn(toastRef);

    const [first, setFirst] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(15);
    const [reportWorkModalVisible, setReportWorkModalVisible] = useState(false);
    const [reportWorkTicket, setReportWorkTicket] = useState<Ticket | null>(null);

    const openReportWorkModal = (ticket: Ticket) => {
        setReportWorkTicket(ticket);
        setReportWorkModalVisible(true);
    };

    const handleReportWorkSave = async (
        ticketId: string | number,
        data: ReportWorkFormData
    ) => {
        try {
            await submitReportWork(ticketId, data);
            await updateTicketStatus(ticketId, DETAIL_STATUS_REPORT_WORK_ID);
            // Modal ປິດຜ່ານ onHide ຫຼັງ await onSave; updateTicketStatus ເຮັດ refresh ຕາຕະລາງໃນ hook ແລ້ວ
        } catch (err) {
            console.error("handleReportWorkSave failed:", err);
            toastRef.current?.show({ severity: "error", summary: "ຜິດພາດ", detail: "ບໍ່ສາມາດບັນທຶກລາຍງານວຽກໄດ້", life: 4000 });
        }
    };

    const centerProps = { align: "center" as const, alignHeader: "center" as const };

    return (
        <div className="grid">
            <Toast ref={toastRef} position="top-center" />
            <style dangerouslySetInnerHTML={{ __html: sanitizeStyleContent(CUSTOM_TOOLTIP_CSS) }} />

            <div className="col-12">
                <div className="card">
                    <TableTooltip target=".js-tooltip-target" dependencies={[displayRows, first]} />
                    <TicketHeaderTechn
                        statusFilter={statusFilter}
                        setStatusFilter={setStatusFilter}
                        statusOptions={statusOptions}
                        globalFilter={globalFilter}
                        onGlobalFilterChange={onGlobalFilterChange}
                        acceptSelfDisabled={selectedTickets.length === 0}
                        onAcceptSelf={onAcceptSelf}
                    />
                    <DataTable
                        value={displayRows ?? []}
                        loading={loading && (displayRows?.length ?? 0) === 0}
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
                        emptyMessage={loading && (displayRows?.length ?? 0) === 0 ? undefined : <div className="text-center p-4">ບໍ່ພົບຂໍ້ມູນ</div>}
                        first={first}
                        onPage={(e) => {
                            setFirst(e.first);
                            setRowsPerPage(e.rows);
                        }}
                    >
                        <Column
                            headerStyle={{ width: "3rem" }}
                            bodyStyle={{ width: "3rem", textAlign: "center" }}
                            body={(rowData: TicketRow) =>
                                showCheckbox(rowData) ? (
                                    <Checkbox
                                        checked={selectedTickets.some(
                                            (t) =>
                                                rowData.assignmentId != null
                                                    ? t.assignmentId === rowData.assignmentId
                                                    : String(t.id) === String(getTicketFromRow(rowData).id)
                                        )}
                                        onChange={(e) => onCheckboxChange(e, rowData)}
                                    />
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
                            field="assignDate"
                            header="ວັນທີມອບໝາຍ"
                            style={{ minWidth: "170px" }}
                            {...centerProps}
                            body={(rowData: any) =>
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
                            body={(rowData: any) =>
                                showAction(rowData) ? (
                                    <TicketActionMenu
                                        ticket={getTicketFromRow(rowData)}
                                        variant="techn"
                                        menuItems={buildDetailMenuItems(
                                            getTicketFromRow(rowData),
                                            staffStatusList,
                                            updateTicketStatus,
                                            openReportWorkModal
                                        )}
                                    />
                                ) : null
                            }
                        />
                    </DataTable>
                </div>
            </div>
            <ReportWorkModal
                visible={reportWorkModalVisible}
                onHide={() => {
                    setReportWorkModalVisible(false);
                    setReportWorkTicket(null);
                }}
                ticket={reportWorkTicket}
                onSave={handleReportWorkSave}
            />
        </div>
    );
}
