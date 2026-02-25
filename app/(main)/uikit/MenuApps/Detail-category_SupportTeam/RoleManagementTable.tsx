// src/uikit/MenuApps/Detail-category_SupportTeam/RoleManagementTable.tsx
import React from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import type { UserRoleData } from '../types';

interface Props {
    items: UserRoleData[];
    header: React.ReactNode;
    globalFilter: string;
    onEdit: (item: UserRoleData) => void;
    onDelete: (item: UserRoleData) => void;
    /** ຕອນໂຫຼດຂໍ້ມູນ ບໍ່ໃຫ້ແສງ emptyMessage "ບໍ່ພົບຂໍ້ມູນ" */
    isLoading?: boolean;
}

const EMPTY_MSG = <div className="text-center p-4 text-gray-500">ບໍ່ພົບຂໍ້ມູນ</div>;

export default function RoleManagementTable({
    items,
    header,
    globalFilter,
    onEdit,
    onDelete,
    isLoading = false,
}: Props) {
    const safeItems = Array.isArray(items) ? items : [];

    const actionTemplate = (row: UserRoleData) => (
        <div className="flex gap-2 justify-content-center align-items-center">
            <Button
                icon="pi pi-pencil"
                rounded
                text
                className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-none"
                tooltip="ແກ້ໄຂ"
                onClick={() => onEdit(row)}
            />
            <Button
                icon="pi pi-trash"
                rounded
                text
                className="bg-red-100 text-red-700 hover:bg-red-200 border-none"
                tooltip="ລຶບ"
                onClick={() => onDelete(row)}
            />
        </div>
    );

    const centerAlign = { textAlign: 'center' as const };

    return (
        <DataTable
            value={safeItems}
            header={header}
            globalFilter={globalFilter}
            paginator
            rows={10}
            className="p-datatable-sm"
            stripedRows
            emptyMessage={!isLoading ? EMPTY_MSG : undefined}
        >
            <Column header="#" body={(_, opts) => opts.rowIndex + 1} className="text-center w-4rem" alignHeader="center" bodyStyle={centerAlign} />
            <Column field="userName" header="ຊື່ຄົນ" style={{ minWidth: '180px' }} alignHeader="center" bodyStyle={centerAlign} />
            <Column field="roleName" header="ສະຖານະ" style={{ minWidth: '160px' }} alignHeader="center" bodyStyle={centerAlign} />
            <Column field="description" header="ຄຳອະທິບາຍ" style={{ minWidth: '200px' }} alignHeader="center" bodyStyle={centerAlign} />
            <Column header="ດຳເນີນການ" body={actionTemplate} className="text-center w-8rem" alignHeader="center" bodyStyle={centerAlign} />
        </DataTable>
    );
}
