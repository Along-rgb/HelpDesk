// src/uikit/MenuApps/Detail-category-SupportTeam/StaffTable.tsx
import React, { useRef, useEffect, useMemo } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tooltip } from 'primereact/tooltip';
import type { AdminAssignUser } from '../types';
import { getRoleDisplayNameLao } from './roleDisplayName';

const STAFF_TOOLTIP_TARGET = '.js-staff-table-tooltip';
/** ຂໍ້ມູນເກີນຈຳນວນນີ້ ສະແດງເຕັມໃນ Tooltip (ດ້ານລຸ່ມ, ພື້ນຫຼັງຂາວ, ຕົວອັກສອນດຳ, ຫົວລູກສອນແດງ) */
const MAX_TEXT_LENGTH = 40;

function CellWithTooltip({ text }: { text: string }) {
    const display = text || '-';
    const isLong = display.length > MAX_TEXT_LENGTH;
    const show = isLong ? `${display.slice(0, MAX_TEXT_LENGTH)}...` : display;
    return (
        <span
            className={isLong ? STAFF_TOOLTIP_TARGET.slice(1) : undefined}
            data-pr-tooltip={isLong ? display : undefined}
            style={{
                display: 'inline-block',
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
            }}
        >
            {show}
        </span>
    );
}

/** ຄົ້ນຫາຕາມ emp_code, first_name, last_name, tel ເທົ່ານັ້ນ */
function matchStaffSearch(row: AdminAssignUser, query: string): boolean {
    if (!query) return true;
    const q = query.trim().toLowerCase();
    const empCode = (row.employee?.emp_code ?? row.username ?? '').toLowerCase();
    const first = (row.employee?.first_name ?? '').toLowerCase();
    const last = (row.employee?.last_name ?? '').toLowerCase();
    const fullName = `${first} ${last}`.trim();
    const tel = (row.employee?.tel ?? '').toLowerCase();
    return (
        empCode.includes(q) ||
        first.includes(q) ||
        last.includes(q) ||
        fullName.includes(q) ||
        tel.includes(q)
    );
}

interface Props {
    items: AdminAssignUser[];
    header: React.ReactNode;
    globalFilter: string;
    /** ຕອນໂຫຼດຂໍ້ມູນ ບໍ່ໃຫ້ແສງ emptyMessage "ບໍ່ພົບຂໍ້ມູນ" */
    isLoading?: boolean;
    /** ກົດປຸ່ມ ແກ້ໄຂ */
    onEdit?: (row: AdminAssignUser) => void;
}

/** ບໍ່ມີຂໍ້ມູນ — ສະແດງຕະຫຼອດ (ບໍ່ປ່ອຍ undefined ເພື່ອຫຼີກເວັ້ນ "No results found" ຕອນ refresh/ເປີດໜ້າ) */
const EMPTY_MSG = (
    <div className="flex justify-content-center align-items-center p-4 text-gray-500 w-full min-h-4rem">
        ບໍ່ມີຂໍ້ມູນ
    </div>
);

function getEmpCode(row: AdminAssignUser): string {
    return row.employee?.emp_code ?? row.username ?? '-';
}

function getFullName(row: AdminAssignUser): string {
    const first = row.employee?.first_name ?? '';
    const last = row.employee?.last_name ?? '';
    return `${first} ${last}`.trim() || '-';
}

function getDepartmentName(row: AdminAssignUser): string {
    return row.employee?.department?.department_name ?? '-';
}

function getDivisionName(row: AdminAssignUser): string {
    return row.employee?.division?.division_name ?? '-';
}

function getPosName(row: AdminAssignUser): string {
    return row.employee?.position?.pos_name ?? '-';
}

function getUnitName(row: AdminAssignUser): string {
    return row.employee?.unit?.unit_name ?? '-';
}

function getTel(row: AdminAssignUser): string {
    return row.employee?.tel ?? '-';
}

function getRoleName(row: AdminAssignUser): string {
    return getRoleDisplayNameLao(row.roleId, row.role?.name);
}

export default function StaffTable({
    items,
    header,
    globalFilter,
    isLoading = false,
    onEdit,
}: Props) {
    const tooltipRef = useRef<React.ComponentRef<typeof Tooltip>>(null);
    const safeItems = Array.isArray(items) ? items : [];
    /** ສະແດງຂໍ້ມູນຕາມຜົນຄົ້ນຫາເທົ່ານັ້ນ — ບໍ່ມີຄຳຄົ້ນຫາ = ບໍ່ສະແດງແຖວ */
    const filteredItems = useMemo(() => {
        const q = (globalFilter ?? '').trim();
        if (!q) return [];
        return safeItems.filter((row) => matchStaffSearch(row, q));
    }, [safeItems, globalFilter]);

    const centerAlign = { textAlign: 'center' as const };

    useEffect(() => {
        const t = setTimeout(() => {
            tooltipRef.current?.updateTargetEvents(STAFF_TOOLTIP_TARGET);
        }, 0);
        return () => clearTimeout(t);
    }, [filteredItems, globalFilter]);

    return (
        <>
            <style>{`
                .staff-table-tooltip.p-tooltip .p-tooltip-text { background: #fff; color: #000; border: 1px solid #dee2e6; }
                .staff-table-tooltip.p-tooltip.p-tooltip-bottom .p-tooltip-arrow { border-bottom-color: #dc2626; }
            `}</style>
            <Tooltip
                ref={tooltipRef}
                target={STAFF_TOOLTIP_TARGET}
                position="bottom"
                className="staff-table-tooltip"
                showDelay={200}
                hideDelay={100}
            />
        <DataTable
            value={filteredItems ?? []}
            header={header}
            paginator
            rows={10}
            className="p-datatable-sm"
            stripedRows
            emptyMessage={EMPTY_MSG}
        >
            <Column header="#" body={(_, opts) => opts.rowIndex + 1} className="text-center w-4rem" alignHeader="center" bodyStyle={centerAlign} />
            <Column header="ລະຫັດ ພ/ງ" body={(row: AdminAssignUser) => <CellWithTooltip text={getEmpCode(row)} />} style={{ minWidth: '100px' }} alignHeader="center" bodyStyle={centerAlign} />
            <Column header="ຊື່ ແລະ ນາມສະກຸນ" body={(row: AdminAssignUser) => <CellWithTooltip text={getFullName(row)} />} style={{ minWidth: '180px' }} alignHeader="center" bodyStyle={centerAlign} />
            <Column header="ຝ່າຍ" body={(row: AdminAssignUser) => <CellWithTooltip text={getDepartmentName(row)} />} style={{ minWidth: '180px' }} alignHeader="center" bodyStyle={centerAlign} />
            <Column header="ພະແນກ/ສູນ/ສາຂາ" body={(row: AdminAssignUser) => <CellWithTooltip text={getDivisionName(row)} />} style={{ minWidth: '180px' }} alignHeader="center" bodyStyle={centerAlign} />
            <Column header="ຕຳແໜ່ງ" body={(row: AdminAssignUser) => <CellWithTooltip text={getPosName(row)} />} style={{ minWidth: '120px' }} alignHeader="center" bodyStyle={centerAlign} />
            <Column header="ໜ່ວຍງານ" body={(row: AdminAssignUser) => <CellWithTooltip text={getUnitName(row)} />} style={{ minWidth: '180px' }} alignHeader="center" bodyStyle={centerAlign} />
            <Column header="ເບີໂທຕິດຕໍ່" body={(row: AdminAssignUser) => <CellWithTooltip text={getTel(row)} />} style={{ minWidth: '120px' }} alignHeader="center" bodyStyle={centerAlign} />
            <Column header="ສະຖານະ" body={(row: AdminAssignUser) => <CellWithTooltip text={getRoleName(row)} />} style={{ minWidth: '120px' }} alignHeader="center" bodyStyle={centerAlign} />
            <Column
                header="ດຳເນີນການ"
                className="text-center w-8rem"
                alignHeader="center"
                bodyStyle={centerAlign}
                body={(row: AdminAssignUser) => (
                    <div className="flex gap-2 justify-content-center align-items-center">
                        <Button
                            label="ແກ້ໄຂ"
                            icon="pi pi-pencil"
                            rounded
                            text
                            size="small"
                            className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-none"
                            tooltip="ແກ້ໄຂ"
                            onClick={() => onEdit?.(row)}
                        />
                    </div>
                )}
            />
        </DataTable>
        </>
    );
}
