// src/uikit/MenuApps/Detail-category_Service_Requests/ServiceRequestIconTable.tsx
import React from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { IconItemData } from '../types';

interface Props {
    items: IconItemData[];
    header: React.ReactNode;
    globalFilter: string;
    onEdit: (item: IconItemData) => void;
    onDelete: (item: IconItemData) => void;
}

export default function ServiceRequestIconTable({ items, header, globalFilter, onEdit, onDelete }: Props) {
    const iconTemplate = (row: IconItemData) =>
        row.iconUrl ? (
            <img src={row.iconUrl} alt="" className="w-3rem h-3rem object-contain border-round" />
        ) : (
            <span className="text-500">-</span>
        );

    const actionTemplate = (row: IconItemData) => (
        <div className="flex gap-2 justify-content-center">
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

    return (
        <DataTable
            value={items}
            header={header}
            globalFilter={globalFilter}
            paginator
            rows={10}
            className="p-datatable-sm"
            stripedRows
            emptyMessage={<div className="text-center p-4 text-gray-500">ບໍ່ພົບຂໍ້ມູນ</div>}
        >
            <Column header="#" body={(_, opts) => opts.rowIndex + 1} className="text-center w-4rem" />
            <Column field="sortOrder" header="ລຳດັບ" className="text-center" style={{ minWidth: '100px' }} />
            <Column header="ຮູປໄອຄອນ" body={iconTemplate} style={{ minWidth: '120px' }} />
            <Column header="ດຳເນີນການ" body={actionTemplate} className="text-center w-8rem" />
        </DataTable>
    );
}
