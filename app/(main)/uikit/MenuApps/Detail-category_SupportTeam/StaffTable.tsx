// src/uikit/MenuApps/Detail-category_SupportTeam/StaffTable.tsx
// ດຶງຂໍ້ມູນຈາກ /api/users. ເງື່ອນໄຂ: ແສງຂໍ້ມູນເມື່ອມີການຄົ້ນຫາເທົ່ານັ້ນ, ຊ່ອງຄົ້ນຫາໃຊ້ໄດ້ແຕ່ emp_code, first_name, last_name, tel.
import React, { useMemo, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import type { AdminAssignUser } from '../types';
import { getRoleDisplayName } from './roleDisplayNames';

interface StaffRow {
    id: number;
    emp_code: string;
    first_name: string;
    last_name: string;
    department_name: string;
    division_name: string;
    pos_name: string;
    tel: string;
    roleName: string;
    actived: string;
    raw: AdminAssignUser;
}

/** ດຶງຂໍ້ຄວາມຕຳແໜ່ງຈາກ pos_name — รองรับทั้ง string ແລະ object (ເຊັ່ນ { name }, { pos_name }) */
function getPosNameDisplay(emp: Record<string, unknown>): string {
    const p = emp.pos_name ?? emp.position ?? emp.title;
    if (typeof p === 'string') return p;
    if (p != null && typeof p === 'object') {
        const o = p as Record<string, unknown>;
        const name = o.name ?? o.pos_name ?? o.position_name ?? o.title;
        if (typeof name === 'string') return name;
    }
    return '';
}

function toStaffRow(u: AdminAssignUser): StaffRow {
    const emp = (u.employee ?? {}) as Record<string, unknown>;
    const dep = (emp.department as { department_name?: string } | undefined);
    const div = (emp.division as { division_name?: string } | undefined);
    return {
        id: u.id,
        emp_code: String(emp.emp_code ?? u.id),
        first_name: String(emp.first_name ?? ''),
        last_name: String(emp.last_name ?? ''),
        department_name: String(emp.department_name ?? dep?.department_name ?? ''),
        division_name: String(emp.division_name ?? div?.division_name ?? ''),
        pos_name: getPosNameDisplay(emp),
        tel: String(emp.tel ?? emp.phone ?? emp.mobile ?? emp.phone_number ?? ''),
        roleName: (getRoleDisplayName(u.roleId) || u.role?.name) ?? '',
        actived: String((u as unknown as Record<string, unknown>).actived ?? 'A'),
        raw: u,
    };
}

interface Props {
    items: AdminAssignUser[];
    header: React.ReactNode;
    globalFilter: string;
    /** ສິດແກ້ໄຂສະຖານະ — ເມື່ອ true ເທົ່ານັ້ນຈຶ່ງແສງປຸ່ມ ແກ້ໄຂ */
    canEditRole?: boolean;
    onEdit?: (item: AdminAssignUser) => void;
    onToggleStatus?: (userId: number, newStatus: 'A' | 'C') => Promise<void>;
    isLoading?: boolean;
}

const EMPTY_MSG = <div className="text-center p-4 text-gray-500">ບໍ່ພົບຂໍ້ມູນ</div>;

export default function StaffTable({
    items,
    header,
    globalFilter,
    canEditRole = false,
    onEdit,
    onToggleStatus,
    isLoading = false,
}: Props) {
    const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());
    const safeItems = Array.isArray(items) ? items : [];
    const rows: StaffRow[] = safeItems.map(toStaffRow);
    const searchQuery = (globalFilter?.trim() ?? '').toLowerCase();

    /** ກອງເອງໃນ component ຕາມ emp_code, first_name, last_name, division_name, department_name, tel */
    const filteredRows = useMemo(() => {
        if (!searchQuery) return rows;
        return rows.filter((r) => {
            return (
                r.emp_code.toLowerCase().includes(searchQuery) ||
                r.first_name.toLowerCase().includes(searchQuery) ||
                r.last_name.toLowerCase().includes(searchQuery) ||
                r.division_name.toLowerCase().includes(searchQuery) ||
                r.department_name.toLowerCase().includes(searchQuery) ||
                r.tel.toLowerCase().includes(searchQuery)
            );
        });
    }, [rows, searchQuery]);

    const displayRows = filteredRows;
    const showEdit = canEditRole && onEdit;

    const handleToggle = async (row: StaffRow) => {
        if (!onToggleStatus) return;
        const newStatus = row.actived === 'A' ? 'C' : 'A';
        setTogglingIds((prev) => new Set(prev).add(row.id));
        try {
            await onToggleStatus(row.id, newStatus as 'A' | 'C');
        } finally {
            setTogglingIds((prev) => { const next = new Set(prev); next.delete(row.id); return next; });
        }
    };

    const statusTemplate = (row: StaffRow) => {
        const isActive = row.actived === 'A';
        const isToggling = togglingIds.has(row.id);
        return (
            <Tag
                value={isActive ? 'Active' : 'Deactivated'}
                severity={isActive ? 'success' : 'danger'}
                style={{ fontSize: '0.85rem', cursor: onToggleStatus ? 'pointer' : 'default', opacity: isToggling ? 0.5 : 1 }}
                onClick={isToggling ? undefined : () => handleToggle(row)}
            />
        );
    };

    const actionTemplate = (row: StaffRow) => (
        <div className="flex gap-2 justify-content-center align-items-center">
            {showEdit && (
                <Button
                    icon="pi pi-pencil"
                    rounded
                    text
                    className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-none"
                    tooltip="ແກ້ໄຂ"
                    onClick={() => onEdit(row.raw)}
                />
            )}
        </div>
    );

    const centerAlign = { textAlign: 'center' as const };

    return (
        <DataTable
            value={displayRows}
            header={header}
            filters={{}}
            paginator
            rows={10}
            rowsPerPageOptions={[10, 15, 25, 50]}
            paginatorTemplate="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
            currentPageReportTemplate="ສະແດງ {first} ເຖິງ {last} ຈາກທັງໝົດ {totalRecords} ລາຍການ"
            className="p-datatable-sm"
            stripedRows
            emptyMessage={!isLoading ? EMPTY_MSG : undefined}
        >
            <Column header="#" body={(_, opts) => opts.rowIndex + 1} className="text-center w-4rem" alignHeader="center" bodyStyle={centerAlign} />
            <Column field="emp_code" header="ລະຫັດພະນັກງານ" style={{ minWidth: '120px' }} alignHeader="center" bodyStyle={centerAlign} />
            <Column field="first_name" header="ຊື່" style={{ minWidth: '120px' }} alignHeader="center" bodyStyle={centerAlign} />
            <Column field="last_name" header="ນາມສະກຸນ" style={{ minWidth: '120px' }} alignHeader="center" bodyStyle={centerAlign} />
            <Column field="department_name" header="ຝ່າຍ" style={{ minWidth: '140px' }} alignHeader="center" bodyStyle={centerAlign} />
            <Column field="division_name" header="ພະແນກ/ສູນ/ສາຂາ" style={{ minWidth: '160px' }} alignHeader="center" bodyStyle={centerAlign} />
            <Column field="pos_name" header="ຕຳແໜ່ງ" style={{ minWidth: '120px' }} alignHeader="center" bodyStyle={centerAlign} />
            <Column field="tel" header="ເບີໂທຕິດຕໍ່" style={{ minWidth: '120px' }} alignHeader="center" bodyStyle={centerAlign} />
            <Column field="roleName" header="ສະຖານະ" style={{ minWidth: '120px' }} alignHeader="center" bodyStyle={centerAlign} />
            <Column header="ດຳເນີນການ" body={statusTemplate} style={{ minWidth: '120px' }} alignHeader="center" bodyStyle={centerAlign} />
            <Column header="" body={actionTemplate} className="text-center w-6rem" alignHeader="center" bodyStyle={centerAlign} />
        </DataTable>
    );
}
