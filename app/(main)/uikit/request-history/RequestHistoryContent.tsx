// ປະຫວັດການຮ້ອງຂໍ — component ສຳລັບໃຊ້ໃນ request-history page (Role 4)
'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Toast } from 'primereact/toast';
import { TicketActionMenu } from '@/app/components/TicketActionMenu';
import { TitleColumn } from './TitleColumn';
import { STATUS_MAP, ASSIGNEE_STATUS_MAP, CUSTOM_TOOLTIP_CSS, STATUS_ICON_MAP, STATUS_ICON_FALLBACK } from '../table/constants';
import { sanitizeStyleContent } from '@/utils/sanitizeHtml';
import { AssigneeAvatarGroup } from '../table/AssigneeAvatarGroup';
import { Dialog } from 'primereact/dialog';
import { Avatar } from 'primereact/avatar';
import { TableTooltip } from '../table/TableTooltip';
import type { Assignee } from '../table/types';
import { useUserProfileStore } from '@/app/store/user/userProfileStore';
import axiosClientsHelpDesk from '@/config/axiosClientsHelpDesk';
import { HELPDESK_ENDPOINTS } from '@/config/endpoints';
import { useHelpdeskStatusOptions } from '@/app/hooks/useHelpdeskStatusOptions';
import { extractStatusFilterVal } from '@/app/(main)/uikit/shared/ticketFilterUtils';
import { formatDateTime } from '@/utils/dateUtils';
import type { HelpdeskStatusItem } from '@/app/hooks/useHelpdeskStatusOptions';

export interface RequestHistoryContentProps {
    showTitle?: boolean;
}

function formatRequestDateTime(value: string | undefined | null): string {
    if (value == null || String(value).trim() === '') return '—';
    return formatDateTime(String(value).trim()) || '—';
}

export interface RequestHistoryRow {
    id: string | number;
    ticketId?: number;
    numberSKT?: string;
    title: string;
    date: string;
    assignTo?: string;
    assignees?: Assignee[];
    status: string;
    statusId?: number;
    createdById?: number | string;
    updatedAt?: string;
}

type AssignmentRaw = {
    assignedTo?: { id?: number; employee?: { id?: number; first_name?: string; last_name?: string; empimg?: string } };
    employee?: { id?: number; first_name?: string; last_name?: string; empimg?: string };
    helpdeskStatusId?: number;
    helpdeskStatus?: { id?: number; name?: string };
};

function normalizeHistoryResponse(data: unknown): RequestHistoryRow[] {
    if (Array.isArray(data)) {
        return (data as Record<string, unknown>[]).map((row) => {
            const id = row.id != null ? String(row.id) : (row.numberSKT as string) ?? '—';
            const ticket = row.ticket as { id?: number; title?: string } | undefined;
            const title = (ticket?.title as string) ?? (row.title as string) ?? '—';
            const createdAt = (row.createdAt as string | undefined) ?? '';
            const helpdeskStatus = row.helpdeskStatus as { id?: number; name?: string } | undefined;
            const statusId = row.helpdeskStatusId != null ? Number(row.helpdeskStatusId)
                : helpdeskStatus?.id != null ? Number(helpdeskStatus.id) : undefined;
            const status = helpdeskStatus?.name ?? '—';
            const assignmentsRaw = (row.assignments ?? []) as AssignmentRaw[];
            const assignees: Assignee[] = assignmentsRaw.map((a, idx) => {
                const emp = a.assignedTo?.employee ?? a.employee;
                const first = emp?.first_name ?? '';
                const last = emp?.last_name ?? '';
                const name = [first, last].filter(Boolean).join(' ').trim() || '—';
                const assigneeId = a.assignedTo?.id ?? emp?.id ?? idx;
                const aStatusId = a.helpdeskStatus?.id ?? a.helpdeskStatusId;
                const aStatus = a.helpdeskStatus?.name ?? status;
                const empImage = emp?.empimg != null && String(emp.empimg).trim() !== '' ? String(emp.empimg).trim() : undefined;
                return { id: assigneeId, name, image: empImage, status: aStatus as Assignee['status'], statusId: aStatusId != null ? aStatusId : (statusId != null ? statusId : undefined) };
            });
            const assignTo = assignees.length > 0 ? assignees[0].name : 'ຍັງບໍ່ໄດ້ມອບໝາຍ';
            const createdById = (row.createdById as number | undefined) ??
                ((row.createdBy as { id?: number } | null | undefined)?.id);
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
                createdById: createdById != null ? createdById : undefined,
                updatedAt: (row.updatedAt as string | undefined) ?? undefined
            };
        });
    }
    if (data && typeof data === 'object' && 'data' in data && Array.isArray((data as { data: unknown }).data)) {
        return normalizeHistoryResponse((data as { data: unknown }).data);
    }
    return [];
}

type StatusOption = { label: string; value: string };

const USER_DIALOG_SEVERITY_COLORS: Record<string, { bg: string; text: string }> = {
    success:   { bg: '#22c55e', text: '#ffffff' },
    info:      { bg: '#3b82f6', text: '#ffffff' },
    warning:   { bg: '#f59e0b', text: '#ffffff' },
    danger:    { bg: '#ef4444', text: '#ffffff' },
    secondary: { bg: '#9ca3af', text: '#ffffff' },
    default:   { bg: '#9ca3af', text: '#ffffff' },
};
const getUserDialogInitials = (name: string) => name ? name.substring(0, 2).toUpperCase() : '??';

/** Local Assignee Dialog ສຳລັບ Role 4 — ແສງຊື່ ນາມສະກຸນ ເທົ່ານັ້ນ (ບໍ່ມີ emp_code) */
const UserAssigneeDialog = ({ visible, onHide, assignees, statusList = [], ticketStatus, sectionTitle = 'ມອບໝາຍໃຫ້' }: {
    visible: boolean; onHide: () => void; assignees: Assignee[];
    statusList?: HelpdeskStatusItem[]; ticketStatus?: string | null; sectionTitle?: string;
}) => {
    const statusById = React.useMemo(() => new Map(statusList.map((s) => [s.id, s])), [statusList]);
    const getStatusColor = (user: Assignee) => {
        const statusName = user.statusId != null ? statusById.get(user.statusId)?.name ?? null : null;
        const severity = statusName
            ? (STATUS_MAP[statusName] ?? 'secondary')
            : (ASSIGNEE_STATUS_MAP[user.status]?.severity || 'secondary');
        return USER_DIALOG_SEVERITY_COLORS[severity] || USER_DIALOG_SEVERITY_COLORS.default;
    };
    return (
        <Dialog header={sectionTitle} visible={visible} style={{ width: '30vw', minWidth: '350px' }} onHide={onHide} draggable={false}>
            <div className="flex flex-column gap-3 mt-2">
                {assignees.map((user) => {
                    const statusFromApi = user.statusId != null ? statusById.get(user.statusId) : undefined;
                    const displayLabel = statusFromApi ? statusFromApi.name : (ticketStatus || (ASSIGNEE_STATUS_MAP[user.status] || ASSIGNEE_STATUS_MAP['default']).label);
                    let rawSeverity: 'success' | 'info' | 'warning' | 'danger' | 'secondary' | null;
                    if (statusFromApi && STATUS_MAP[statusFromApi.name]) {
                        rawSeverity = STATUS_MAP[statusFromApi.name] as 'success' | 'info' | 'warning' | 'danger' | null;
                    } else if (ticketStatus && STATUS_MAP[ticketStatus]) {
                        rawSeverity = STATUS_MAP[ticketStatus] as 'success' | 'info' | 'warning' | 'danger' | null;
                    } else if (user.status && ASSIGNEE_STATUS_MAP[user.status]) {
                        rawSeverity = ASSIGNEE_STATUS_MAP[user.status].severity as 'success' | 'info' | 'warning' | 'danger' | 'secondary';
                    } else {
                        rawSeverity = 'secondary';
                    }
                    const displaySeverity = rawSeverity === 'secondary' || rawSeverity === null ? undefined : (rawSeverity as 'success' | 'info' | 'warning' | 'danger');
                    return (
                        <div key={user.id} className="flex align-items-center justify-content-between p-2 border-bottom-1 surface-border">
                            <div className="flex align-items-center gap-2">
                                <Avatar
                                    label={!user.image ? getUserDialogInitials(user.name) : undefined}
                                    image={user.image}
                                    icon={!user.image && !user.name ? 'pi pi-user' : undefined}
                                    shape="circle"
                                    style={{
                                        backgroundColor: user.image ? 'transparent' : getStatusColor(user).bg,
                                        color: user.image ? undefined : getStatusColor(user).text,
                                        border: `3px solid ${getStatusColor(user).bg}`,
                                    }}
                                />
                                <div className="flex flex-column">
                                    <span className="font-bold text-sm">{user.name}</span>
                                    <span className="text-xs text-500">Staff / IT Support</span>
                                </div>
                            </div>
                            <Tag value={displayLabel} severity={displaySeverity} style={{ fontSize: '0.85rem' }} />
                        </div>
                    );
                })}
            </div>
        </Dialog>
    );
};
export function RequestHistoryContent({ showTitle = false }: RequestHistoryContentProps) {
    const currentUser = useUserProfileStore((s) => s.currentUser);
    const { list: statusList } = useHelpdeskStatusOptions();

    const [first, setFirst] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(15);
    const [statusFilter, setStatusFilter] = useState<StatusOption | null>(null);
    const [globalFilter, setGlobalFilter] = useState('');
    const [tickets, setTickets] = useState<RequestHistoryRow[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const toastRef = React.useRef<Toast>(null);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [dialogAssignees, setDialogAssignees] = useState<Assignee[]>([]);
    const [dialogTicketStatus, setDialogTicketStatus] = useState<string | null>(null);
    const [dialogStatusList, setDialogStatusList] = useState<HelpdeskStatusItem[]>([]);

    const statusOptions = useMemo<StatusOption[]>(() => {
        const opts = statusList.map((s) => ({ label: s.name, value: String(s.id) }));
        return [{ label: 'ທັງຫມົດ', value: 'Allin' }, ...opts];
    }, [statusList]);

    const openAssigneeDialog = (assignees: Assignee[], ticketStatus: string) => {
        setDialogAssignees(assignees);
        setDialogTicketStatus(ticketStatus);
        setDialogStatusList(statusList);
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

    const fetchHistory = useCallback(async () => {
        setLoading(true);
        try {
            const loginUserId = currentUser?.id != null ? String(currentUser.id) : '';
            /** Security M1: Pass createdById to API so backend can filter server-side */
            const response = await axiosClientsHelpDesk.get(HELPDESK_ENDPOINTS.REQUESTS_USER, {
                params: loginUserId ? { createdById: loginUserId } : undefined,
            });
            const list = normalizeHistoryResponse(response.data);
            setTickets(list);
        } catch {
            setTickets([]);
        } finally {
            setLoading(false);
        }
    }, [currentUser?.id]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    useEffect(() => {
        setFirst(0);
    }, [statusFilter, globalFilter]);

    const filteredRows = useMemo(() => {
        const statusNameToId = new Map(statusList.map((s) => [s.name, Number(s.id)]));
        const statusFilterVal = extractStatusFilterVal(statusFilter);
        return tickets.filter((row) => {
            const rowStatusId = row.statusId != null ? row.statusId : statusNameToId.get(row.status);
            if (statusFilterVal && statusFilterVal !== 'Allin') {
                const sid = Number(statusFilterVal);
                if (Number.isFinite(sid) && Number(rowStatusId) !== sid) return false;
            }
            if (globalFilter.trim()) {
                const q = globalFilter.trim().toLowerCase();
                const inTitle = row.title.toLowerCase().includes(q);
                const inSKT = (row.numberSKT ?? '').toLowerCase().includes(q);
                const inAssign = (row.assignTo ?? '').toLowerCase().includes(q);
                const inStatus = row.status.toLowerCase().includes(q);
                if (!inTitle && !inSKT && !inAssign && !inStatus) return false;
            }
            return true;
        });
    }, [tickets, statusFilter, globalFilter, statusList]);

    const centerProps = { align: 'center' as const, alignHeader: 'center' as const };

    const getStatusIcon = (option: StatusOption | null) =>
        option
            ? STATUS_ICON_MAP[option.label] ?? STATUS_ICON_MAP[option.value] ?? STATUS_ICON_FALLBACK
            : STATUS_ICON_FALLBACK;

    const renderStatusOption = (option: StatusOption | null) => {
        if (!option) return <span>ເລືອກສະຖານະ</span>;
        return (
            <div className="flex align-items-center gap-2">
                <i className={getStatusIcon(option)} />
                <span>{option.label}</span>
            </div>
        );
    };

    return (
        <div className="grid">
            <Toast ref={toastRef} position="top-center" />
            <ConfirmDialog />
            <style dangerouslySetInnerHTML={{ __html: sanitizeStyleContent(CUSTOM_TOOLTIP_CSS) }} />
            <div className="col-12">
                <div className="card">
                    <TableTooltip target=".js-tooltip-target" dependencies={[filteredRows, first]} />
                    <UserAssigneeDialog
                        visible={dialogVisible}
                        onHide={closeAssigneeDialog}
                        assignees={dialogAssignees}
                        statusList={dialogStatusList}
                        ticketStatus={dialogTicketStatus}
                        sectionTitle="ມອບໝາຍໃຫ້"
                    />
                    {showTitle && (
                        <h3 className="m-0 mb-3 text-center" style={{ fontSize: '1.75rem', fontWeight: 700 }}>ປະຫວັດການຮ້ອງຂໍ</h3>
                    )}
                    <div className="flex flex-column md:flex-row justify-content-between gap-3 mb-4">
                        <div className="flex flex-wrap gap-2 align-items-center">
                            <Dropdown
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.value as StatusOption | null)}
                                options={statusOptions}
                                optionLabel="label"
                                placeholder="ເລືອກສະຖານະ"
                                className="p-inputtext-sm w-full md:w-12rem"
                                showClear
                                itemTemplate={renderStatusOption}
                                valueTemplate={renderStatusOption}
                            />
                        </div>
                        <div className="flex flex-wrap gap-2 align-items-center justify-content-end">
                            <span className="p-input-icon-left w-full md:w-auto">
                                <i className="pi pi-search" />
                                <InputText
                                    value={globalFilter}
                                    onChange={(e) => setGlobalFilter(e.target.value)}
                                    placeholder="ຄົ້ນຫາລວມ.."
                                    className="p-inputtext-sm w-full md:w-15rem"
                                />
                            </span>
                        </div>
                    </div>
                    <DataTable
                        value={filteredRows}
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
                        tableStyle={{ minWidth: '60rem' }}
                        style={{ fontSize: '1rem' }}
                        emptyMessage={<div className="text-center p-4">ບໍ່ພົບຂໍ້ມູນ</div>}
                    >
                        <Column
                            field="id"
                            header="ລຳດັບ"
                            style={{ minWidth: '80px', fontWeight: 'bold' }}
                            {...centerProps}
                        />
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
                            style={{ minWidth: '120px' }}
                            {...centerProps}
                        />
                        <Column
                            header="ວັນທີຮ້ອງຂໍ"
                            body={(rowData: RequestHistoryRow) => formatRequestDateTime(rowData.date)}
                            style={{ minWidth: '170px' }}
                            {...centerProps}
                        />
                        <Column
                            header="ຜູ້ຮັບຜິດຊອບ"
                            body={(rowData: RequestHistoryRow) => {
                                const list = rowData.assignees ?? [];
                                if (list.length === 0) {
                                    return <span className="text-500 text-sm italic">ຍັງບໍ່ໄດ້ມອບໝາຍ</span>;
                                }
                                return (
                                    <AssigneeAvatarGroup
                                        assignees={list}
                                        ticketStatus={rowData.status}
                                        statusList={statusList}
                                        onClick={() => openAssigneeDialog(list, rowData.status)}
                                    />
                                );
                            }}
                            style={{ minWidth: '140px' }}
                            {...centerProps}
                        />
                        <Column
                            field="status"
                            header="ສະຖານະ"
                            body={(rowData: RequestHistoryRow) => (
                                <Tag
                                    value={rowData.status}
                                    severity={(STATUS_MAP[rowData.status] ?? null) as 'success' | 'info' | 'warning' | 'danger' | null}
                                    style={{ fontSize: '0.85rem' }}
                                />
                            )}
                            style={{ minWidth: '100px' }}
                            {...centerProps}
                        />
                        <Column
                            header="ດຳເນີນການ"
                            body={(rowData: RequestHistoryRow) =>
                                rowData.statusId === 1 ? (
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
                                    <TicketActionMenu ticket={rowData} variant="user" hideDropdown />
                                )
                            }
                            style={{ minWidth: '160px' }}
                            {...centerProps}
                        />
                    </DataTable>
                </div>
            </div>
        </div>
    );
}
