'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { Panel } from 'primereact/panel';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Toast } from 'primereact/toast';
import { TicketActionMenu } from '@/app/components/TicketActionMenu';
import { TitleColumn } from './TitleColumn';
import { STATUS_MAP, ASSIGNEE_STATUS_MAP, CUSTOM_TOOLTIP_CSS } from '../table/constants';
import { sanitizeStyleContent } from '@/utils/sanitizeHtml';
import { AssigneeAvatarGroup } from '../table/AssigneeAvatarGroup';
import { AssigneeDialog } from '../table/AssigneeDialog';
import { TableTooltip } from '../table/TableTooltip';
import type { Assignee } from '../table/types';
import { useUserProfileStore } from '@/app/store/user/userProfileStore';
import axiosClientsHelpDesk from '@/config/axiosClientsHelpDesk';
import { HELPDESK_ENDPOINTS } from '@/config/endpoints';
import { useHelpdeskStatusOptions } from '@/app/hooks/useHelpdeskStatusOptions';
import { formatDateTime } from '@/utils/dateUtils';
import {
    normalizeHistoryResponse,
    type RequestHistoryRow,
} from '../request-history/page';
import InlineLoading from '@/app/components/InlineLoading';

/** statusId 1 = ລໍຖ້າຮັບວຽກ — แสดงปุ่มແກ້ໄຂ/ລົບ */
const STATUS_ID_NEW = 1;

function formatRequestDateTime(value: string | undefined | null): string {
    if (value == null || String(value).trim() === '') return '—';
    const formatted = formatDateTime(String(value).trim());
    return formatted || '—';
}

/** จัดกลุ่มแถวตาม ສະຖານະ — ลำดับตาม statusList จาก API แล้วตามด้วยສະຖານະที่เหลือในข้อมูล */
function groupByStatus(
    rows: RequestHistoryRow[],
    statusList: { id: number; name: string }[]
): { statusName: string; rows: RequestHistoryRow[] }[] {
    const byName = new Map<string, RequestHistoryRow[]>();
    for (const row of rows) {
        const name = (row.status ?? '').trim() || 'ບໍ່ລະບຸ';
        if (!byName.has(name)) byName.set(name, []);
        byName.get(name)!.push(row);
    }
    const ordered: { statusName: string; rows: RequestHistoryRow[] }[] = [];
    const seen = new Set<string>();
    for (const item of statusList) {
        const name = (item.name ?? '').trim();
        if (!name) continue;
        const group = byName.get(name);
        if (group && group.length > 0) {
            ordered.push({ statusName: name, rows: group });
            seen.add(name);
        }
    }
    for (const [name, group] of byName) {
        if (!seen.has(name) && group.length > 0) {
            ordered.push({ statusName: name, rows: group });
        }
    }
    return ordered;
}

export default function RequestHistoryByStatus() {
    const router = useRouter();
    const currentUser = useUserProfileStore((s) => s.currentUser);
    const { list: statusList } = useHelpdeskStatusOptions();
    const [tickets, setTickets] = useState<RequestHistoryRow[]>([]);
    const [loading, setLoading] = useState(true);
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
        } catch {
            setTickets([]);
        } finally {
            setLoading(false);
        }
    }, [currentUser?.id]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

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

    const grouped = useMemo(
        () => groupByStatus(tickets, statusList),
        [tickets, statusList]
    );

    const renderAssigneeCell = (rowData: RequestHistoryRow) => {
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
    };

    const renderActions = (rowData: RequestHistoryRow) => {
        const isNew = rowData.statusId === STATUS_ID_NEW;
        return isNew ? (
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
        );
    };

    return (
        <div className="flex flex-column gap-3">
            <Toast ref={toastRef} position="top-center" />
            <ConfirmDialog />
            <style dangerouslySetInnerHTML={{ __html: sanitizeStyleContent(CUSTOM_TOOLTIP_CSS) }} />
            <TableTooltip target=".js-tooltip-target" dependencies={[tickets]} />
            <AssigneeDialog
                visible={dialogVisible}
                onHide={closeAssigneeDialog}
                assignees={dialogAssignees}
                ticketStatus={dialogTicketStatus}
                sectionTitle="ມອບໝາຍໃຫ້"
            />
            {(loading && tickets.length === 0) ? (
                <InlineLoading />
            ) : grouped.length === 0 ? (
                <div className="text-500 text-center p-4">ບໍ່ພົບຂໍ້ມູນການຮ້ອງຂໍ</div>
            ) : (
                grouped.map(({ statusName, rows }) => (
                    <Panel
                        key={statusName}
                        header={
                            <span className="flex align-items-center gap-2">
                                <Tag
                                    value={statusName}
                                    severity={(STATUS_MAP[statusName] ?? null) as 'success' | 'info' | 'warning' | 'danger' | null}
                                    style={{ fontSize: '0.95rem', padding: '0.4rem 0.8rem', fontWeight: '600' }}
                                />
                                <span className="font-semibold">ສະຖານະ: {statusName}</span>
                                <span className="text-500 text-sm">({rows.length} ລາຍການ)</span>
                            </span>
                        }
                        toggleable
                        collapsed={false}
                        className="border-1 surface-border border-round mb-2"
                    >
                        <DataTable
                            value={rows ?? []}
                            size="small"
                            scrollable
                            scrollHeight="40vh"
                            emptyMessage="ບໍ່ມີລາຍການໃນສະຖານະນີ້"
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
                                body={renderAssigneeCell}
                                style={{ width: '150px', minWidth: '140px' }}
                                align="center"
                            />
                            <Column
                                header="ດຳເນີນການ"
                                body={renderActions}
                                style={{ width: '150px' }}
                                align="center"
                            />
                        </DataTable>
                    </Panel>
                ))
            )}
        </div>
    );
}
