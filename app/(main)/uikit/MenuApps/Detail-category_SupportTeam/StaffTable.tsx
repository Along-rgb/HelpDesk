// src/uikit/MenuApps/Detail-category_SupportTeam/StaffTable.tsx
// ດຶງຂໍ້ມູນຈາກ /api/users. ເງື່ອນໄຂ: ແສງຂໍ້ມູນເມື່ອມີການຄົ້ນຫາເທົ່ານັ້ນ, ຊ່ອງຄົ້ນຫາໃຊ້ໄດ້ແຕ່ emp_code, first_name, last_name, tel.
import React, { useMemo } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
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
    isLoading?: boolean;
}

const EMPTY_MSG = <div className="text-center p-4 text-gray-500">ບໍ່ພົບຂໍ້ມູນ</div>;

export default function StaffTable({
    items,
    header,
    globalFilter,
    canEditRole = false,
    onEdit,
    isLoading = false,
}: Props) {
    const safeItems = Array.isArray(items) ? items : [];
    const rows: StaffRow[] = safeItems.map(toStaffRow);
    const searchQuery = (globalFilter?.trim() ?? '').toLowerCase();
    const hasSearch = searchQuery !== '';

    /** ກອງເອງໃນ component ຕາມ emp_code, first_name, last_name, tel — ເພື່ອບໍ່ໃຫ້ການກອງຫາຍເມື່ອປິດ dialog (DataTable ບໍ່ສູນເສຍ state) */
    const filteredRows = useMemo(() => {
        if (!searchQuery) return [];
        return rows.filter((r) => {
            return (
                r.emp_code.toLowerCase().includes(searchQuery) ||
                r.first_name.toLowerCase().includes(searchQuery) ||
                r.last_name.toLowerCase().includes(searchQuery) ||
                r.tel.toLowerCase().includes(searchQuery)
            );
        });
    }, [rows, searchQuery]);

    /** ເມື່ອບໍ່ມີຄຳຄົ້ນຫາ ບໍ່ແສງຂໍ້ມູນ — ໃຫ້ແສງເປັນ "ບໍ່ພົບຂໍ້ມູນ" */
    const displayRows = hasSearch ? filteredRows : [];
    const showEdit = canEditRole && onEdit;

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
            className="p-datatable-sm"
            stripedRows
            emptyMessage={!isLoading ? EMPTY_MSG : undefined}
        >
            <Column header="#" body={(_, opts) => opts.rowIndex + 1} className="text-center w-4rem" alignHeader="center" bodyStyle={centerAlign} />
            <Column field="emp_code" header="ລະຫັດພະນັກງານ" style={{ minWidth: '120px' }} alignHeader="center" bodyStyle={centerAlign} />
            <Column field="first_name" header="ຊື່" style={{ minWidth: '120px' }} alignHeader="center" bodyStyle={centerAlign} />
            <Column field="last_name" header="ນາມສະກຸນ" style={{ minWidth: '120px' }} alignHeader="center" bodyStyle={centerAlign} />
            <Column field="division_name" header="ຝ່າຍ" style={{ minWidth: '140px' }} alignHeader="center" bodyStyle={centerAlign} />
            <Column field="department_name" header="ພະແນກ/ສູນ/ສາຂາ" style={{ minWidth: '160px' }} alignHeader="center" bodyStyle={centerAlign} />
            <Column field="pos_name" header="ຕຳແໜ່ງ" style={{ minWidth: '120px' }} alignHeader="center" bodyStyle={centerAlign} />
            <Column field="tel" header="ເບີໂທຕິດຕໍ່" style={{ minWidth: '120px' }} alignHeader="center" bodyStyle={centerAlign} />
            <Column field="roleName" header="ສະຖານະ" style={{ minWidth: '120px' }} alignHeader="center" bodyStyle={centerAlign} />
            <Column header="ດຳເນີນການ" body={actionTemplate} className="text-center w-8rem" alignHeader="center" bodyStyle={centerAlign} />
        </DataTable>
    );
}
