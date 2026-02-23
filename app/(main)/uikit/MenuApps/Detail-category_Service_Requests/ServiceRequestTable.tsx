// src/uikit/MenuApps/Detail-category_Service_Requests/ServiceRequestTable.tsx
import React from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { ServiceRequestData, ServiceRequestTabs } from '../types';

interface Props {
    items: ServiceRequestData[];
    header: React.ReactNode;
    globalFilter: string;
    label: string;
    activeTab: number;
    onEdit: (item: ServiceRequestData) => void;
    onDelete: (item: ServiceRequestData) => void;
    categoryMap: Map<string | number, string>;
    supportTeamMap?: Map<string | number, string>;
    iconMap?: Map<string | number, string>;
}

export default function ServiceRequestTable({ items, header, globalFilter, label, activeTab, onEdit, onDelete, categoryMap, supportTeamMap = new Map(), iconMap = new Map() }: Props) {
    
    const isCategoryTab = activeTab === ServiceRequestTabs.CATEGORY;
    const isTopicTab = activeTab === ServiceRequestTabs.TOPIC;

    const supportTeamNameTemplate = (row: ServiceRequestData) => {
        if (row.supportTeamName) return row.supportTeamName;
        if (row.supportTeamId != null) return supportTeamMap.get(row.supportTeamId) || '-';
        return '-';
    };

    const iconTemplate = (row: ServiceRequestData) => {
        const url = row.iconUrl || (row.iconId != null ? iconMap.get(row.iconId) : null);
        if (url) return <img src={url} alt="" className="w-2rem h-2rem object-contain border-round" />;
        return <span className="text-500">-</span>;
    };

    // [Fast Join]
    const parentNameTemplate = (row: ServiceRequestData) => {
        if (row.parentName) return row.parentName;
        if (row.parentId) {
            return categoryMap.get(row.parentId) || '-';
        }
        return '-';
    };

    const actionTemplate = (row: ServiceRequestData) => (
        <div className="flex gap-2 justify-content-center">
            <Button icon="pi pi-pencil" rounded text className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-none" tooltip="ແກ້ໄຂ" onClick={() => onEdit(row)} />
            <Button icon="pi pi-trash" rounded text className="bg-red-100 text-red-700 hover:bg-red-200 border-none" tooltip="ລຶບ" onClick={() => onDelete(row)} />
        </div>
    );

    return (
        <DataTable value={items} header={header} globalFilter={globalFilter} paginator rows={10} className="p-datatable-sm" stripedRows emptyMessage={<div className="text-center p-4 text-gray-500">ບໍ່ພົບຂໍ້ມູນ</div>}>
            <Column header="#" body={(d, opts) => opts.rowIndex + 1} className="text-center w-4rem" />
            
            {isCategoryTab && <Column header="ທີມຊ່ວຍເຫຼືອ" body={supportTeamNameTemplate} style={{ minWidth: '150px' }} />}
            {isCategoryTab && <Column field="name" header="ຊື່ໝວດໝູ່" style={{ minWidth: '200px' }} />}
            {isCategoryTab && <Column header="ຮູບໄອຄອນ" body={iconTemplate} style={{ minWidth: '80px' }} className="text-center" />}
            {isCategoryTab && <Column field="description" header="ຄຳອະທິບາຍ" style={{ minWidth: '200px' }} />}

            {isTopicTab && <Column header="ໝວດໝູ່" style={{ minWidth: '150px' }} body={parentNameTemplate} />}

            {!isCategoryTab && <Column field="name" header={label} style={{ minWidth: '200px' }} />}
            {isTopicTab && <Column field="description" header="ຄຳອະທິບາຍ" style={{ minWidth: '200px' }} />}
            <Column header="ດຳເນີນການ" body={actionTemplate} className="text-center w-8rem" />
        </DataTable>
    );
}