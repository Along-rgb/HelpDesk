// src/uikit/MenuApps/Detail-category_Issues/IssuesTable.tsx
import React from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { IssueData } from '../types';

interface Props {
    items: IssueData[];
    header: React.ReactNode;
    globalFilter: string;
    nameColumnHeader: string;
    activeTab: number;
    onEdit: (item: IssueData) => void;
    onDelete: (item: IssueData) => void;
    // [Clean Code] เปลี่ยนจาก Array เป็น Map
    categoryMap: Map<string | number, string>;
    /** Tab 0: map supportTeamId -> name */
    supportTeamMap?: Map<string | number, string>;
    /** Tab 0: map iconId -> iconUrl */
    iconMap?: Map<string | number, string>;
}

export default function IssuesTable({ 
    items, 
    header, 
    globalFilter, 
    nameColumnHeader, 
    activeTab, 
    onEdit, 
    onDelete, 
    categoryMap,
    supportTeamMap = new Map(),
    iconMap = new Map()
}: Props) {

    const isCategoryTab = activeTab === 0;
    const isTopicTab = activeTab === 1;

    const supportTeamNameTemplate = (row: IssueData) => {
        if (row.supportTeamName) return row.supportTeamName;
        if (row.supportTeamId != null) return supportTeamMap.get(row.supportTeamId) || '-';
        return '-';
    };

    const iconTemplate = (row: IssueData) => {
        const url = row.iconUrl || (row.iconId != null ? iconMap.get(row.iconId) : null);
        if (url) return <img src={url} alt="" className="w-2rem h-2rem object-contain border-round" />;
        return <span className="text-500">-</span>;
    };

    // [Fast Join] ดึงข้อมูลจาก Map (O(1)) เร็วมาก ไม่ต้อง Loop
    const parentNameTemplate = (row: IssueData) => {
        if (row.parentName) return row.parentName; // ถ้า Backend Join มาให้แล้วก็ใช้เลย
        if (row.parentId) {
            return categoryMap.get(row.parentId) || '-'; // ถ้าไม่มีก็ดึงจาก Map
        }
        return '-';
    };

    const actionTemplate = (row: IssueData) => (
        <div className="flex gap-2 justify-content-center">
            <Button icon="pi pi-pencil" rounded text className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-none" tooltip="ແກ້ໄຂ" onClick={() => onEdit(row)} />
            <Button icon="pi pi-trash" rounded text className="bg-red-100 text-red-700 hover:bg-red-200 border-none" tooltip="ລຶບ" onClick={() => onDelete(row)} />
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
            
            {isCategoryTab && <Column header="ທີມຊ່ວຍເຫຼືອ" body={supportTeamNameTemplate} style={{ minWidth: '150px' }} />}
            {isCategoryTab && <Column field="title" header="ຊື່ໝວດໝູ່" style={{ minWidth: '200px' }} />}
            {isCategoryTab && <Column header="ຮູບໄອຄອນ" body={iconTemplate} style={{ minWidth: '80px' }} className="text-center" />}
            {isCategoryTab && <Column field="description" header="ຄຳອະທິບາຍ" style={{ minWidth: '250px' }} />}

            {isTopicTab && <Column header="ໝວດໝູ່" style={{ minWidth: '150px' }} body={parentNameTemplate} />}
            {isTopicTab && <Column field="title" header={nameColumnHeader} style={{ minWidth: '200px' }} />}
            {isTopicTab && <Column field="description" header="ຄຳອະທິບາຍ" style={{ minWidth: '250px' }} />}

            <Column header="ດຳເນີນການ" body={actionTemplate} className="text-center w-8rem" />
        </DataTable>
    );
}