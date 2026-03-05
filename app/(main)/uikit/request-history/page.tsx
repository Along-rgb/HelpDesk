// ປະຫວັດການຮ້ອງຂໍ — แสดงใน TopMenu เฉพาะ Role 4 (User)
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { Toast } from 'primereact/toast';
import { TicketActionMenu } from '@/app/components/TicketActionMenu';
import { TitleColumn } from '../pageUser/TitleColumn';
import { STATUS_MAP, ASSIGNEE_STATUS_MAP, CUSTOM_TOOLTIP_CSS } from '../table/constants';
import { sanitizeStyleContent } from '@/utils/sanitizeHtml';
import { AssigneeAvatarGroup } from '../table/AssigneeAvatarGroup';
import { AssigneeDialog } from '../table/AssigneeDialog';
import { TableTooltip } from '../table/TableTooltip';
import type { Assignee } from '../table/types';
import { useProfileData, useUserProfileStore } from '@/app/store/user/userProfileStore';
import axiosClientsHelpDesk from '@/config/axiosClientsHelpDesk';
import { HELPDESK_ENDPOINTS } from '@/config/endpoints';
import { useHelpdeskStatusOptions } from '@/app/hooks/useHelpdeskStatusOptions';
import { formatDateTime } from '@/utils/dateUtils';
import './request-history-table.css';

/** tabIndex ຕາມຄວາມຕ້ອງການ: 0=ໃໝ່, 1=ກຳລັງດຳເນີນການ, 2=ສຳເລັດແລ້ວ, 3=ຖືກປະຕິເສດ (ຍັງບໍ່ເຮັດ) */
const TAB_INDEX = {
    NEW: 0,           // ຄຳຮ້ອງຂໍໃໝ່ — statusId 1 ລໍຖ້າຮັບວຽກ
    PROCESSING: 1,    // ຄຳຮ້ອງຂໍທີ່ກຳລັງດຳເນີນການ — statusId 2
    COMPLETED: 2,     // ຄຳຮ້ອງຂໍທີ່ສຳເລັດແລ້ວ — statusId 3 ແກ້ໄຂແລ້ວ ຫຼື 6 ປິດວຽກແລ້ວ
    CANCELLED: 3,     // ຄຳຮ້ອງທີ່ຖືກປະຕິເສດ — เก็บไว้ก่อน
} as const;

/** แปลงวันเวลาจาก API (ISO) เป็นรูปแบบแสดงผล — ใช้ formatDateTime ร่วมกับ dateUtils */
function formatRequestDateTime(value: string | undefined | null): string {
    if (value == null || String(value).trim() === '') return '—';
    const formatted = formatDateTime(String(value).trim());
    return formatted || '—';
}

export interface RequestHistoryRow {
    id: string | number;
    /** ticket.id จาก API — ใช้ไปหน้า invalidstate แก้ไข (ticketId) */
    ticketId?: number;
    /** ເລກຊຄທ จาก API */
    numberSKT?: string;
    title: string;
    date: string;
    assignTo?: string;
    /** รายชื่อผู้รับผิดชอบ จาก assignments[].assignedTo.employee — ใช้แสดง AvatarGroup + tooltip ชื่อนามสกุลเต็ม */
    assignees?: Assignee[];
    status: string;
    /** helpdeskStatus.id จาก API — ใช้กรองตาม tabIndex (เทียบกับ helpdeskstatus/selecthelpdeskstatus) */
    statusId?: number;
    /** createdById จาก API — ใช้กรองให้แสดงเฉพาะของ user login */
    createdById?: number | string;
}

/** รูปแบบ assignment จาก API: { assignedTo?: { id, employee: { first_name, last_name } }, employee?: { first_name, last_name } } */
type AssignmentRaw = {
    assignedTo?: { id?: number; employee?: { id?: number; first_name?: string; last_name?: string } };
    employee?: { id?: number; first_name?: string; last_name?: string };
};

/**
 * API helpdeskrequests/user — โครงสร้าง JSON:
 * id, ticketId, helpdeskStatusId, numberSKT, createdById, createdAt, updatedAt,
 * ticket: { id, title }, helpdeskStatus: { id, name }, assignments: [{ assignedTo: { id, employee: { first_name, last_name } } }]
 * แยกแสดงตาม createdById (กรองให้ user login เห็นเฉพาะของตัวเอง)
 */
function normalizeHistoryResponse(data: unknown): RequestHistoryRow[] {
    if (Array.isArray(data)) {
        return (data as Record<string, unknown>[]).map((row) => {
            const id = row.id != null ? String(row.id) : (row.numberSKT as string) ?? '—';
            const ticket = row.ticket as { id?: number; title?: string } | undefined;
            const title = (ticket?.title as string) ?? (row.title as string) ?? '—';
            const createdAt = (row.createdAt as string | undefined) ?? '';
            const helpdeskStatus = row.helpdeskStatus as { id?: number; name?: string } | undefined;
            const statusId = (row.helpdeskStatusId as number | undefined) ?? helpdeskStatus?.id;
            const status = helpdeskStatus?.name ?? (row.name as string) ?? '—';
            const assignmentsRaw = (row.assignments ?? []) as AssignmentRaw[];
            const assignees: Assignee[] = assignmentsRaw.map((a, idx) => {
                const emp = a.assignedTo?.employee ?? a.employee;
                const first = emp?.first_name ?? '';
                const last = emp?.last_name ?? '';
                const name = [first, last].filter(Boolean).join(' ').trim() || '—';
                const assigneeId = a.assignedTo?.id ?? emp?.id ?? idx;
                return { id: assigneeId, name, status: 'doing' as const };
            });
            const assignTo = assignees.length > 0 ? assignees[0].name : 'ຍັງບໍ່ໄດ້ມອບໝາຍ';
            const createdById = row.createdById as number | undefined;
            const numberSKT = (row.numberSKT as string | undefined) ?? '';
            const ticketId = (row.ticketId as number | undefined) ?? ticket?.id;
            return {
                id,
                ticketId: ticketId != null ? ticketId : undefined,
                numberSKT: numberSKT.trim() || undefined,
                title,
                date: createdAt,
                assignTo,
                assignees: assignees.length > 0 ? assignees : undefined,
                status,
                statusId: statusId != null ? statusId : undefined,
                createdById: createdById != null ? createdById : undefined
            };
        });
    }
    if (data && typeof data === 'object' && 'data' in data && Array.isArray((data as { data: unknown }).data)) {
        return normalizeHistoryResponse((data as { data: unknown }).data);
    }
    return [];
}

const TAB_LABELS: Record<number, string> = {
    [TAB_INDEX.NEW]: 'ຄຳຮ້ອງຂໍໃໝ່',
    [TAB_INDEX.PROCESSING]: 'ຄຳຮ້ອງຂໍທີ່ກຳລັງດຳເນີນການ',
    [TAB_INDEX.COMPLETED]: 'ຄຳຮ້ອງທີ່ສຳເລັດແລ້ວ',
    [TAB_INDEX.CANCELLED]: 'ຄຳຮ້ອງທີ່ຖືກປະຕິເສດ',
};

export default function RequestHistoryPage() {
    const { profileData } = useProfileData();
    const currentUser = useUserProfileStore((s) => s.currentUser);
    const displayName = profileData
        ? [profileData.first_name, profileData.last_name].filter(Boolean).join(' ').trim() || '—'
        : '—';
    const [activeTab, setActiveTab] = useState<number>(TAB_INDEX.NEW);
    const [first, setFirst] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(15);
    const [numberSKT, setNumberSKT] = useState('');
    const [createdAtRange, setCreatedAtRange] = useState<Date[] | null>(null);
    const [tickets, setTickets] = useState<RequestHistoryRow[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const toastRef = React.useRef<Toast>(null);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [dialogAssignees, setDialogAssignees] = useState<Assignee[]>([]);
    const [dialogTicketStatus, setDialogTicketStatus] = useState<string | null>(null);

    const openAssigneeDialog = (assignees: Assignee[], ticketStatus: string) => {
        setDialogAssignees(assignees);
        setDialogTicketStatus(ticketStatus);
        setDialogVisible(true);
    };
    const closeAssigneeDialog = () => setDialogVisible(false);

    const handleEditRequest = (row: RequestHistoryRow) => {
        const params = new URLSearchParams();
        params.set('id', String(row.id));
        if (row.ticketId != null) params.set('ticketId', String(row.ticketId));
        if (row.title) params.set('title', row.title);
        router.push(`/uikit/invalidstate?${params.toString()}`);
    };

    const handleDeleteRequest = (row: RequestHistoryRow) => {
        confirmDialog({
            message: `ທ່ານຕ້ອງການລົບຄຳຮ້ອງຂໍ "${row.title || row.numberSKT || row.id}" ແທ້ບໍ່?`,
            header: 'ຢືນຢັນການລົບ',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            acceptLabel: 'ລົບ',
            rejectLabel: 'ຍົກເລີກ',
            accept: async () => {
                try {
                    await axiosClientsHelpDesk.delete(HELPDESK_ENDPOINTS.requestById(row.id));
                    setTickets((prev) => prev.filter((t) => String(t.id) !== String(row.id)));
                    toastRef.current?.show({
                        severity: 'success',
                        summary: 'ສຳເລັດ',
                        detail: 'ລົບຄຳຮ້ອງຂໍສຳເລັດ',
                        life: 3000,
                    });
                } catch (err) {
                    const res = err && typeof err === 'object' && 'response' in err ? (err as { response?: { data?: { message?: string } } }).response : undefined;
                    const msg = res?.data?.message ?? 'ເກີດຂໍ້ຜິດພາດໃນການລົບ';
                    toastRef.current?.show({
                        severity: 'error',
                        summary: 'ເກີດຂໍ້ຜິດພາດ',
                        detail: msg,
                        life: 4000,
                    });
                }
            },
        });
    };

    /** ดึงข้อมูลครั้งเดียวตอนโหลด — การค้นหา ເລກ ຊຄທ / ວັນທີ กรองฝั่ง client ไม่ refetch เพื่อไม่ให้ loading ทุกครั้ง */
    const fetchHistory = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axiosClientsHelpDesk.get(HELPDESK_ENDPOINTS.REQUESTS_USER);
            const list = normalizeHistoryResponse(response.data);
            const loginUserId = currentUser?.id != null ? String(currentUser.id) : '';
            const isMyRow = (row: RequestHistoryRow) => {
                const createdBy = row.createdById == null ? '' : String(row.createdById);
                return createdBy !== '' && createdBy === loginUserId;
            };
            const filtered = loginUserId ? list.filter(isMyRow) : [];
            setTickets(filtered);
        } catch (err) {
            setTickets([]);
        } finally {
            setLoading(false);
        }
    }, [currentUser?.id]);

    const { list: statusList } = useHelpdeskStatusOptions();

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    useEffect(() => {
        setFirst(0);
    }, [numberSKT, createdAtRange]);

    /** กรองตามช่องค้นหา: ເລກ ຊຄທ (numberSKT) และ ວັນທີ (dd/mm/yy) */
    const filteredBySearch = tickets.filter((row) => {
        if (numberSKT.trim()) {
            const search = numberSKT.trim().toLowerCase();
            const skt = (row.numberSKT ?? '').toLowerCase();
            if (!skt.includes(search)) return false;
        }
        if (createdAtRange && createdAtRange.length >= 1) {
            const rowDate = row.date ? new Date(row.date) : null;
            if (!rowDate || Number.isNaN(rowDate.getTime())) return false;
            const start = createdAtRange[0];
            if (start) {
                const startOfDay = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, 0, 0);
                if (rowDate < startOfDay) return false;
            }
            if (createdAtRange.length >= 2 && createdAtRange[1]) {
                const end = createdAtRange[1];
                const endOfDay = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999);
                if (rowDate > endOfDay) return false;
            }
        }
        return true;
    });

    /** กรองตาม tabIndex โดยเทียบ statusId กับ helpdeskstatus/selecthelpdeskstatus: tab0=id1, tab1=id2, tab2=id3|id6, tab3=เก็บไว้ */
    const filteredByTab = filteredBySearch.filter((row) => {
        const id = row.statusId;
        if (activeTab === TAB_INDEX.NEW) return id === 1; // ລໍຖ້າຮັບວຽກ
        if (activeTab === TAB_INDEX.PROCESSING) return id === 2; // ກຳລັງດຳເນີນການ
        if (activeTab === TAB_INDEX.COMPLETED) return id === 3 || id === 6; // ແກ້ໄຂແລ້ວ ຫຼື ປິດວຽກແລ້ວ
        if (activeTab === TAB_INDEX.CANCELLED) return false; // ຄຳຮ້ອງທີ່ຖືກປະຕິເສດ — เก็บไว้ก่อน
        return true;
    });

    return (
        <div className="p-4">
            <Toast ref={toastRef} position="top-center" />
            <ConfirmDialog />
            <style dangerouslySetInnerHTML={{ __html: sanitizeStyleContent(CUSTOM_TOOLTIP_CSS) }} />
            <TableTooltip target=".js-tooltip-target" dependencies={[filteredByTab, first]} />
            <AssigneeDialog
                visible={dialogVisible}
                onHide={closeAssigneeDialog}
                assignees={dialogAssignees}
                ticketStatus={dialogTicketStatus}
                sectionTitle="ມອບໝາຍໃຫ້"
            />
            <h3 className="request-history-page-title m-0 mb-3 text-center">ປະຫວັດການຮ້ອງຂໍ</h3>

            <div className="request-history-search-row">
                <div className="search-field">
                    <label htmlFor="search-numberSKT" className="search-label">ເລກ ຊທຄ</label>
                    <InputText
                        id="search-numberSKT"
                        value={numberSKT}
                        onChange={(e) => setNumberSKT(e.target.value)}
                        placeholder="ຄົ້ນຫາ ເລກ ຊທຄ"
                        className="request-history-input w-full"
                    />
                </div>
                <div className="search-field">
                    <label htmlFor="search-createdAt" className="search-label">ວັນທີ</label>
                    <div className="request-history-date-range-wrap">
                        <Calendar
                            id="search-createdAt"
                            value={createdAtRange}
                            onChange={(e) => {
                                const v = e.value;
                                if (v == null) setCreatedAtRange(null);
                                else if (Array.isArray(v)) setCreatedAtRange(v.filter((d): d is Date => d instanceof Date));
                                else setCreatedAtRange(null);
                            }}
                            selectionMode="range"
                            dateFormat="dd/mm/yy"
                            showIcon
                            readOnlyInput
                            placeholder="ເລືອກ ວັນທີ / ເດືອນ / ປີ"
                            className="w-full"
                            inputClassName="request-history-input"
                        />
                        {createdAtRange && createdAtRange.length > 0 && (
                            <i
                                className="pi pi-times request-history-date-clear"
                                onClick={(e) => { e.stopPropagation(); setCreatedAtRange(null); }}
                                role="button"
                                aria-label="ລົບວັນທີ"
                            />
                        )}
                    </div>
                </div>
            </div>

            <div className="divider-container">
                <span className="divider-text">ການຮ້ອງຂໍຂອງທ່ານ: {displayName}</span>
            </div>

            <div className="selection-button-group">
                {[TAB_INDEX.NEW, TAB_INDEX.PROCESSING, TAB_INDEX.COMPLETED, TAB_INDEX.CANCELLED].map((tabIndex) => (
                    <button
                        key={tabIndex}
                        className={`selection-btn ${activeTab === tabIndex ? 'active' : ''}`}
                        onClick={() => { setActiveTab(tabIndex); setFirst(0); }}
                    >
                        {TAB_LABELS[tabIndex]}
                    </button>
                ))}
            </div>

            <div
                className="table-content-wrapper"
                style={{
                    backgroundColor: 'var(--surface-card)',
                    borderRadius: '0 0 20px 20px',
                    padding: '1rem'
                }}
            >
                <DataTable
                    value={filteredByTab}
                    paginator
                    rows={rowsPerPage}
                    first={first}
                    onPage={(e) => {
                        const { first: f, rows: r } = e as { first: number; rows: number };
                        setFirst(f);
                        setRowsPerPage(r);
                    }}
                    rowsPerPageOptions={[15, 25, 50]}
                    paginatorTemplate="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
                    currentPageReportTemplate="ສະແດງ {first} ເຖີງ {last} ຈາກທັງໝົດ {totalRecords} ລາຍການ"
                    size="small"
                    scrollable
                    scrollHeight="60vh"
                    loading={loading}
                    emptyMessage={loading ? undefined : <div className="request-history-empty-msg">ບໍ່ພົບຂໍ້ມູນ</div>}
                >
                    <Column field="id" header="ລຳດັບ" style={{ width: '10%', fontWeight: 'bold' }} align="center" />
                    <Column
                        header="ຫົວຂໍ້ເລື່ອງ"
                        body={(rowData: RequestHistoryRow) => (
                            <TitleColumn title={rowData.title} id={String(rowData.id)} />
                        )}
                        style={{ minWidth: '200px' }}
                    />
                    <Column
                        field="numberSKT"
                        header="ເລກ ຊຄທ"
                        body={(rowData: RequestHistoryRow) => rowData.numberSKT ?? '—'}
                        style={{ width: '120px', minWidth: '120px' }}
                        align="center"
                    />
                    <Column
                        header="ວັນທີຮ້ອງຂໍ"
                        body={(rowData: RequestHistoryRow) => formatRequestDateTime(rowData.date)}
                        style={{ width: '200px', minWidth: '200px' }}
                        align="center"
                    />
                    <Column
                        header="ຜູ້ຮັບຜິດຊອບ"
                        body={(rowData: RequestHistoryRow) => {
                            const list = rowData.assignees ?? [];
                            if (list.length === 0) {
                                return <span className="text-500 text-sm italic">ຍັງບໍ່ໄດ້ມອບໝາຍ</span>;
                            }
                            if (list.length === 1) {
                                const user = list[0];
                                const statusInfo = ASSIGNEE_STATUS_MAP[user.status] || ASSIGNEE_STATUS_MAP['default'];
                                const helpdeskSeverity = rowData.status ? (STATUS_MAP[rowData.status] ?? null) : null;
                                let textColor = 'text-700';
                                if (helpdeskSeverity === 'info') textColor = 'text-blue-500';
                                else if (helpdeskSeverity === 'success') textColor = 'text-green-500';
                                else if (helpdeskSeverity === 'warning') textColor = 'text-orange-500';
                                else if (helpdeskSeverity === 'danger') textColor = 'text-red-500';
                                else {
                                    if (statusInfo.severity === 'info') textColor = 'text-blue-500';
                                    else if (statusInfo.severity === 'success') textColor = 'text-green-500';
                                    else if (statusInfo.severity === 'warning') textColor = 'text-orange-500';
                                }
                                const statusLabel = rowData.status || statusInfo.label;
                                let displayName = user.name;
                                if (displayName) {
                                    const cleanName = displayName.trim();
                                    const parts = cleanName.split(' ');
                                    const isTitle = parts[0] === 'ທ.' || parts[0] === 'ນ.' || (parts[0]?.includes('.') ?? false);
                                    displayName = parts.length > 1 && isTitle ? `${parts[0]} ${parts[1]}` : (parts[0] ?? '');
                                }
                                return (
                                    <div
                                        role="button"
                                        tabIndex={0}
                                        className={`js-tooltip-target cursor-pointer ${textColor} font-bold text-sm`}
                                        style={{ whiteSpace: 'nowrap' }}
                                        data-pr-tooltip={`${user.name} | ${statusLabel}`}
                                        data-pr-position="bottom"
                                        onClick={(e) => { e.stopPropagation(); openAssigneeDialog(list, rowData.status); }}
                                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openAssigneeDialog(list, rowData.status); } }}
                                    >
                                        {displayName}
                                    </div>
                                );
                            }
                            return (
                                <AssigneeAvatarGroup
                                    assignees={list}
                                    ticketStatus={rowData.status}
                                    onClick={() => openAssigneeDialog(list, rowData.status)}
                                />
                            );
                        }}
                        style={{ width: '150px', minWidth: '140px' }}
                        align="center"
                    />
                    <Column
                        field="status"
                        header="ສະຖານະ"
                        body={(rowData: RequestHistoryRow) => (
                            <Tag
                                value={rowData.status}
                                severity={(STATUS_MAP[rowData.status] ?? null) as 'success' | 'info' | 'warning' | 'danger' | null}
                                style={{ fontSize: '0.95rem', padding: '0.4rem 0.8rem', fontWeight: '600' }}
                            />
                        )}
                        style={{ width: '150px' }}
                        align="center"
                    />
                    <Column
                        header="ດຳເນີນການ"
                        body={(rowData: RequestHistoryRow) =>
                            activeTab === TAB_INDEX.NEW ? (
                                <div className="flex gap-2 justify-content-center align-items-center">
                                    <Button
                                        icon="pi pi-pencil"
                                        rounded
                                        text
                                        className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-none"
                                        tooltip="ແກ້ໄຂ"
                                        onClick={(e) => { e.stopPropagation(); handleEditRequest(rowData); }}
                                    />
                                    <Button
                                        icon="pi pi-trash"
                                        rounded
                                        text
                                        className="bg-red-100 text-red-700 hover:bg-red-200 border-none"
                                        tooltip="ລົບ"
                                        onClick={(e) => { e.stopPropagation(); handleDeleteRequest(rowData); }}
                                    />
                                </div>
                            ) : (
                                <TicketActionMenu ticket={rowData} variant="user" />
                            )
                        }
                        style={{ width: '150px' }}
                        align="center"
                    />
                </DataTable>
            </div>
        </div>
    );
}
