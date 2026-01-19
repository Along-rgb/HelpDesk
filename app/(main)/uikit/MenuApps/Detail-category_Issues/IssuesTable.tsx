// src/uikit/MenuApps/Detail-category_Issues/IssuesTable.tsx
import React from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
// Import Type จากไฟล์กลาง
import { IssueData } from '../types';

interface Props {
    items: IssueData[];
    loading: boolean;
    header: React.ReactNode;
    globalFilter: string;
    nameColumnHeader: string;
    onEdit: (item: IssueData) => void;
    onDelete: (item: IssueData) => void;
}

export default function IssuesTable({ items, loading, header, globalFilter, nameColumnHeader, onEdit, onDelete }: Props) {

    const statusTemplate = (row: IssueData) => (
        <div className="flex justify-content-center">
            <Tag 
                value={row.status === 'ACTIVE' ? 'ໃຊ້ງານ' : 'ບໍ່ໃຊ້ງານ'} 
                severity={row.status === 'ACTIVE' ? 'success' : 'danger'} 
            />
        </div>
    );

    const actionTemplate = (row: IssueData) => (
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
            emptyMessage={<div className="text-center p-4 text-gray-500">ບໍ່ພົບຂໍ້ມູນ</div>} 
            className="p-datatable-sm" 
            stripedRows 
            paginator 
            rows={10}
        >
            <Column header="#" body={(d, opts) => opts.rowIndex + 1} className="text-center w-4rem" />
            
            <Column field="title" header={nameColumnHeader} style={{ minWidth: '200px' }} />
            <Column field="description" header="ຄຳອະທິບາຍ" style={{ minWidth: '250px' }} />
            <Column field="createdAt" header="ວັນທີສ້າງ" style={{ width: '150px' }} />
            
            <Column 
                header="ສະຖານະ" 
                body={statusTemplate} 
                className="text-center w-8rem" 
                alignHeader={'center'}
            />
            <Column 
                header="ດຳເນີນການ" 
                body={actionTemplate} 
                className="text-center w-8rem" 
                alignHeader={'center'}
            />
        </DataTable>
    );
}