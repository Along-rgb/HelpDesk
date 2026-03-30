"use client";
import "./pageTechn.scss";
import React, { useState, useRef, useMemo, useCallback } from "react";
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
import { TitleBody, RequesterBody } from "./TicketColumnTemplates";
import { ReportWorkModal, type ReportWorkSaveData } from "@/app/(main)/uikit/pageTechn/ReportWorkModal";
import { submitAssignmentComment } from "./reportWorkService";
import { useUserRoleAndId, useUserProfileStore } from "@/app/store/user/userProfileStore";

/** ไอคอนສຳລັບ dropdown ລາຍລະອຽດ (ແບບຮູບສາມ): ແກ້ໄຂແລ້ວ=check-circle, ສົ່ງອອກ=external-link, ພັກໃວ້=pause, ຍົກເລີກ=circle */
const STAFF_STATUS_ICONS: Record<number, string> = {
    4: "pi pi-check-circle",   // ແກ້ໄຂແລ້ວ
    5: "pi pi-external-link",  // ສົ່ງອອກແປງນອກ
    6: "pi pi-pause",          // ພັກໃວ້
    8: "pi pi-circle",         // ຍົກເລີກ
};

/** สถานะที่อนุญาตให้ "ຍົກເລີກ" (ตามเงื่อนไข: ต้องเป็น ລໍຖ້າຮັບວຽກ เท่านั้น) */
const CANCEL_ALLOWED_STATUS_NAME = "ລໍຖ້າຮັບວຽກ";
const CANCEL_STATUS_ID = 8;
const STATUS_DONE_NAME = "ແກ້ໄຂແລ້ວ";
const STATUS_CLOSED_NAME = "ປິດວຽກແລ້ວ";
/** ລໍຖ້າຮັບວຽກ — ຍັງບໍ່ກົດ ຮັບວຽກເອງ → ເຊື່ອງ dropdown ລາຍລະອຽດ */
const STATUS_WAITING_ACCEPT_ID = 2;
const STATUS_DONE_ID = 4;
const STATUS_EXTERNAL_ID = 5;
const STATUS_PAUSE_ID = 6;
const STATUS_CLOSED_ID = 7;

/** Status IDs ທີ່ຕ້ອງເປີດ modal ກ່ອນບັນທຶກ */
const MODAL_STATUS_IDS: Record<number, 'full' | 'comment'> = {
    [STATUS_DONE_ID]: 'full',
    [STATUS_EXTERNAL_ID]: 'full',
    [STATUS_PAUSE_ID]: 'comment',
    [CANCEL_STATUS_ID]: 'comment',
};

const MODAL_HEADER_LABELS: Record<number, string> = {
    [STATUS_DONE_ID]: 'ລາຍງານວຽກ',
    [STATUS_EXTERNAL_ID]: 'ສົ່ງອອກແປງນອກ',
    [STATUS_PAUSE_ID]: 'ພັກໃວ້',
    [CANCEL_STATUS_ID]: 'ຍົກເລີກ',
};

function buildDetailMenuItems(
    ticket: Ticket,
    currentStatusName: string,
    staffStatusList: { id: number; name: string }[],
    updateTicketStatus: (ticketId: string | number, helpdeskStatusId: number) => Promise<void>,
    openReportWork: (ticket: Ticket, statusId: number, mode: 'full' | 'comment') => void
): TicketActionMenuItem[] {
    const current = (currentStatusName ?? "").trim();
    const isWaitingAccept = current === CANCEL_ALLOWED_STATUS_NAME;

    if (isWaitingAccept) {
        const cancelStatus = staffStatusList.find((s) => s.id === CANCEL_STATUS_ID);
        if (!cancelStatus) return [];
        return [{
            label: cancelStatus.name,
            icon: STAFF_STATUS_ICONS[cancelStatus.id] ?? "pi pi-circle",
            command: () => openReportWork(ticket, cancelStatus.id, 'comment'),
        }];
    }

    return staffStatusList
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

export default function PageTechnDemo() {
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
        getAssignmentIdForTicket,
        roleId,
    } = useTicketTableTechn(toastRef);

    const { currentUserId } = useUserRoleAndId();
    const employeeId = useUserProfileStore((s) => s.profileData?.employeeId ?? null);

    const [first, setFirst] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(15);
    const [reportWorkVisible, setReportWorkVisible] = useState(false);
    const [reportWorkTicket, setReportWorkTicket] = useState<Ticket | null>(null);
    const [reportWorkStatusId, setReportWorkStatusId] = useState<number>(STATUS_DONE_ID);
    const [reportWorkMode, setReportWorkMode] = useState<'full' | 'comment'>('full');

    const centerProps = { align: "center" as const, alignHeader: "center" as const };

    /** ໃຊ້ statusList (full list) ເພື່ອ resolve ທຸກ statusId ລວມທັງ id 2 (ລໍຖ້າຮັບວຽກ) */
    const statusById = useMemo(() => new Map(statusList.map((s) => [s.id, s])), [statusList]);

    /** ฝัง _sel flag ลงใน row data เพื่อ force DataTable re-render เมื่อ selection เปลี่ยน */
    const tableData = useMemo(() => {
        const selIds = new Set(selectedTickets.map((t) => String(t.id)));
        return displayRows.map((r) => ({ ...r, _sel: selIds.has(String(r.id)) }));
    }, [displayRows, selectedTickets]);

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
            // ใช้ Assignment ID จาก assignmentIdMapRef (source of truth จาก GET /api/assignments)
            const assignmentId = getAssignmentIdForTicket(reportWorkTicket.id);
            if (assignmentId == null) {
                toastRef.current?.show({
                    severity: "error",
                    summary: "ຜິດພາດ",
                    detail: "ບໍ່ພົບ assignmentId ຂອງຜູ້ໃຊ້",
                    life: 4000,
                });
                throw new Error("assignmentId not found");
            }
            // PUT /api/assignments/:id เพียงเส้นเดียว (สถานะ, comment, lat, lng, commentImg)
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
        [reportWorkTicket, getAssignmentIdForTicket, refetch, reportWorkStatusId]
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
                        value={tableData}
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
                            body={(rowData: TicketRow & { _sel?: boolean }) => {
                                const show = showCheckbox(rowData) && rowData.statusId !== CANCEL_STATUS_ID;
                                const checked = !!rowData._sel;
                                return (
                                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                                        {show ? (
                                            <div
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    e.preventDefault();
                                                    onCheckboxChange(null, rowData);
                                                }}
                                                onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); onCheckboxChange(null, rowData); } }}
                                                role="checkbox"
                                                aria-checked={checked}
                                                tabIndex={0}
                                                style={{
                                                    width: 20,
                                                    height: 20,
                                                    border: `2px solid ${checked ? "#3B82F6" : "#d1d5db"}`,
                                                    borderRadius: 4,
                                                    background: checked ? "#3B82F6" : "#fff",
                                                    cursor: "pointer",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    transition: "all 0.15s",
                                                    flexShrink: 0,
                                                }}
                                            >
                                                {checked && (
                                                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                                                        <path d="M1 7.5L5 11.5L13 2.5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                )}
                                            </div>
                                        ) : (
                                            <span style={{ color: "#9ca3af" }}>—</span>
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
                            field="numberSKT"
                            header="ເລກ ຊຄທ"
                            style={{ minWidth: "120px" }}
                            {...centerProps}
                            body={(rowData: TicketRow) =>
                                rowData.numberSKT ? (
                                    <span className="font-medium text-700">{rowData.numberSKT}</span>
                                ) : (
                                    <span className="text-500 text-sm">-</span>
                                )
                            }
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
                                                const tStatusId = rowData.ticketStatusId ?? rowData.statusId;
                                                const hideCancelled =
                                                    statusId === CANCEL_STATUS_ID || tStatusId === CANCEL_STATUS_ID;
                                                const hideById =
                                                    statusId === STATUS_CLOSED_ID;
                                                const hideByName =
                                                    statusName === STATUS_CLOSED_NAME;
                                                const hideByTicketStatus =
                                                    tStatusId === STATUS_CLOSED_ID;
                                                const hideDone =
                                                    roleId === 3 && (statusId === STATUS_DONE_ID || tStatusId === STATUS_DONE_ID || statusName === STATUS_DONE_NAME);
                                                return hideCancelled || hideById || hideByName || hideByTicketStatus || hideDone;
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
