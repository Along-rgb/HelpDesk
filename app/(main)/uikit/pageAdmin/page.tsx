"use client";
import React, { useState, useRef, useMemo, useCallback } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Checkbox } from "primereact/checkbox";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import { useTicketTableAdmin } from "./useTicketTableAdmin";
import { TicketRow } from "../pageTechn/types";
import { Ticket } from "../pageTechn/types";
import { STATUS_MAP, CUSTOM_TOOLTIP_CSS, PRIORITY_MAP } from "../pageTechn/constants";
import { sanitizeStyleContent } from "@/utils/sanitizeHtml";
import { TicketActionMenu } from "@/app/components/TicketActionMenu";
import type { TicketActionMenuItem } from "@/app/components/TicketActionMenu";
import { TicketHeaderTechn } from "../pageTechn/TicketHeaderTechn";
import { AssigneeDialog } from "../pageTechn/AssigneeDialog";
import { TableTooltip } from "../pageTechn/TableTooltip";
import { TitleBody, RequesterBody } from "../pageTechn/TicketColumnTemplates";
import { ReportWorkModal, type ReportWorkSaveData } from "../pageTechn/ReportWorkModal";
import { submitAssignmentComment } from "../pageTechn/reportWorkService";
import { useUserRoleAndId, useUserProfileStore } from "@/app/store/user/userProfileStore";

const STAFF_STATUS_ICONS: Record<number, string> = {
    4: "pi pi-check-circle",   // ແກ້ໄຂແລ້ວ
    5: "pi pi-external-link",  // ສົ່ງອອກແປງນອກ
    6: "pi pi-pause",          // ພັກໃວ້
    8: "pi pi-circle",         // ຍົກເລີກ
};

const CANCEL_ALLOWED_STATUS_NAME = "ລໍຖ້າຮັບວຽກ";
const CANCEL_STATUS_ID = 8;
const STATUS_DONE_NAME = "ແກ້ໄຂແລ້ວ";
const STATUS_CLOSED_NAME = "ປິດວຽກແລ້ວ";
const STATUS_DONE_ID = 4;
const STATUS_EXTERNAL_ID = 5;
const STATUS_PAUSE_ID = 6;
const STATUS_CLOSED_ID = 7;

/** Status IDs ທີ່ຕ້ອງເປີດ modal ກ່ອນບັນທຶກ */
const MODAL_STATUS_IDS: Record<number, 'full' | 'comment'> = {
    [STATUS_DONE_ID]: 'full',
    [STATUS_EXTERNAL_ID]: 'full',
    [STATUS_PAUSE_ID]: 'comment',
};

const MODAL_HEADER_LABELS: Record<number, string> = {
    [STATUS_DONE_ID]: 'ລາຍງານວຽກ',
    [STATUS_EXTERNAL_ID]: 'ສົ່ງອອກແປງນອກ',
    [STATUS_PAUSE_ID]: 'ພັກໃວ້',
};

function buildDetailMenuItems(
    ticket: Ticket,
    currentStatusName: string,
    staffStatusList: { id: number; name: string }[],
    updateTicketStatus: (ticketId: string | number, helpdeskStatusId: number) => Promise<void>,
    openReportWork: (ticket: Ticket, statusId: number, mode: 'full' | 'comment') => void
): TicketActionMenuItem[] {
    const current = (currentStatusName ?? "").trim();
    const canCancel = current === CANCEL_ALLOWED_STATUS_NAME;
    return staffStatusList
        .filter((s) => s.id !== STATUS_CLOSED_ID)
        .filter((s) => (s.id === CANCEL_STATUS_ID ? canCancel : true))
        .filter((s) => (s.name ?? "").trim() !== current)
        .map((s) => ({
            label: s.name,
            icon: STAFF_STATUS_ICONS[s.id] ?? "pi pi-circle",
            command: () => {
                const modalMode = MODAL_STATUS_IDS[s.id];
                if (modalMode) {
                    openReportWork(ticket, s.id, modalMode);
                    return;
                }
                void updateTicketStatus(ticket.id, s.id);
            },
        }));
}

export default function PageAdminDemo() {
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
        dialogVisible,
        currentAssignees,
        openAssigneeDialog,
        closeDialog,
        showCheckbox,
        onCheckboxChange,
        showAction,
        getTicketFromRow,
        statusList,
        staffStatusList,
        updateTicketStatus,
        onAcceptSelf,
        showReceiveSelfButton,
        receiveSelfDisabled,
        refetch,
    } = useTicketTableAdmin(toastRef);

    const { currentUserId } = useUserRoleAndId();
    const employeeId = useUserProfileStore((s) => s.profileData?.employeeId ?? null);

    const [first, setFirst] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(15);
    const [reportWorkVisible, setReportWorkVisible] = useState(false);
    const [reportWorkTicket, setReportWorkTicket] = useState<Ticket | null>(null);
    const [reportWorkStatusId, setReportWorkStatusId] = useState<number>(STATUS_DONE_ID);
    const [reportWorkMode, setReportWorkMode] = useState<'full' | 'comment'>('full');

    const centerProps = { align: "center" as const, alignHeader: "center" as const };

    const statusById = useMemo(() => new Map(statusList.map((s) => [s.id, s])), [statusList]);

    const openReportWork = useCallback((ticket: Ticket, statusId: number = STATUS_DONE_ID, mode: 'full' | 'comment' = 'full') => {
        setReportWorkTicket(ticket);
        setReportWorkStatusId(statusId);
        setReportWorkMode(mode);
        setReportWorkVisible(true);
    }, []);

    const closeReportWork = useCallback(() => {
        setReportWorkVisible(false);
        setReportWorkTicket(null);
    }, []);

    const onSaveReportWork = useCallback(
        async (data: ReportWorkSaveData) => {
            if (!reportWorkTicket) return;
            const myAssign = reportWorkTicket.myAssignments?.find(
                (m) =>
                    Number(m.assignee.id) === Number(currentUserId) ||
                    (employeeId != null && Number(m.assignee.id) === Number(employeeId))
            );
            const assignmentId = myAssign?.assignmentId;
            if (assignmentId == null) {
                toastRef.current?.show({
                    severity: "error",
                    summary: "ຜິດພາດ",
                    detail: "ບໍ່ພົບ assignmentId ຂອງຜູ້ໃຊ້",
                    life: 4000,
                });
                throw new Error("assignmentId not found");
            }
            await submitAssignmentComment(
                assignmentId,
                {
                    comment: data.workDetail,
                    lat: data.latitude,
                    lng: data.longitude,
                    commentImg: data.imageFile ?? null,
                },
                reportWorkStatusId
            );
            await refetch();
            toastRef.current?.show({
                severity: "success",
                summary: "ສຳເລັດ",
                detail: "ບັນທຶກລາຍງານວຽກສຳເລັດ",
                life: 3000,
            });
        },
        [reportWorkTicket, currentUserId, employeeId, refetch, reportWorkStatusId]
    );

    return (
        <div className="grid">
            <Toast ref={toastRef} position="top-center" />
            <style dangerouslySetInnerHTML={{ __html: sanitizeStyleContent(CUSTOM_TOOLTIP_CSS) }} />

            <div className="col-12">
                <div className="card">
                    <TableTooltip target=".js-tooltip-target" dependencies={[displayRows, first]} />
                    <ReportWorkModal
                        visible={reportWorkVisible}
                        onHide={closeReportWork}
                        onSave={onSaveReportWork}
                        ticketId={reportWorkTicket?.id ?? null}
                        ticketTitle={reportWorkTicket?.title ?? null}
                        mode={reportWorkMode}
                        headerLabel={MODAL_HEADER_LABELS[reportWorkStatusId]}
                    />
                    <AssigneeDialog
                        visible={dialogVisible}
                        onHide={closeDialog}
                        assignees={currentAssignees}
                        statusList={staffStatusList}
                    />
                    <TicketHeaderTechn
                        statusFilter={statusFilter}
                        setStatusFilter={setStatusFilter}
                        statusOptions={statusOptions}
                        globalFilter={globalFilter}
                        onGlobalFilterChange={onGlobalFilterChange}
                        showReceiveSelfButton={showReceiveSelfButton}
                        receiveSelfDisabled={receiveSelfDisabled}
                        onReceiveTaskSelf={onAcceptSelf}
                    />
                    <DataTable
                        value={displayRows}
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
                            headerStyle={{ width: "3rem" }}
                            style={{ maxWidth: "3rem" }}
                            {...centerProps}
                            body={(rowData: TicketRow) => {
                                const show = showCheckbox(rowData);
                                return (
                                    <div className="flex justify-content-center">
                                        {show ? (
                                            <Checkbox
                                                checked={selectedTickets.some((t) => t.id === rowData.id)}
                                                onChange={(e) => onCheckboxChange(e, rowData)}
                                            />
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
                            body={(rowData: TicketRow) => {
                                const displayStatus =
                                    rowData.statusId != null
                                        ? (statusById.get(rowData.statusId)?.name ?? rowData.status)
                                        : rowData.status;
                                return (
                                    <Tag
                                        value={displayStatus}
                                        severity={STATUS_MAP[displayStatus] as any}
                                        style={{ fontSize: "0.85rem" }}
                                    />
                                );
                            }}
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
                                        hideDropdown={
                                            (() => {
                                                const statusName = (
                                                    rowData.statusId != null
                                                        ? (statusById.get(rowData.statusId)?.name ?? getTicketFromRow(rowData).status)
                                                        : getTicketFromRow(rowData).status
                                                ).trim();
                                                const statusId = rowData.statusId;
                                                const hideById =
                                                    statusId === STATUS_DONE_ID || statusId === STATUS_CLOSED_ID;
                                                const hideByName =
                                                    statusName === STATUS_DONE_NAME || statusName === STATUS_CLOSED_NAME;
                                                return hideById || hideByName;
                                            })()
                                        }
                                        menuItems={buildDetailMenuItems(
                                            getTicketFromRow(rowData),
                                            rowData.statusId != null
                                                ? (statusById.get(rowData.statusId)?.name ?? getTicketFromRow(rowData).status)
                                                : getTicketFromRow(rowData).status,
                                            staffStatusList,
                                            updateTicketStatus,
                                            openReportWork
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
