// src/uikit/MenuApps/Detail-category_SupportTeam/SupportTeamTable.tsx
import React from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Dropdown } from 'primereact/dropdown';
import { SupportTeamData } from '../types';

interface Props {
    items: SupportTeamData[];
    loading: boolean;
    header: React.ReactNode;
    globalFilter: string;
    label: string;
    activeTab: number;
    onEdit: (item: SupportTeamData) => void;
    onDelete: (item: SupportTeamData) => void;
}

export default function SupportTeamTable({ items, loading, header, globalFilter, label, activeTab, onEdit, onDelete }: Props) {
    
    const isSystemAdminTab = activeTab === 1;

    const statusTemplate = (row: SupportTeamData) => (
        <div className="flex justify-content-center">
            <Tag value={row.status === 'ACTIVE' ? 'ໃຊ້ງານ' : 'ບໍ່ໃຊ້ງານ'} severity={row.status === 'ACTIVE' ? 'success' : 'danger'} />
        </div>
    );

    const actionTemplate = (row: SupportTeamData) => (
        <div className="flex gap-2 justify-content-center">
            <Button icon="pi pi-pencil" rounded text severity="warning" tooltip="ແກ້ໄຂ" onClick={() => onEdit(row)} />
            <Button icon="pi pi-trash" rounded text severity="danger" tooltip="ລຶບ" onClick={() => onDelete(row)} />
        </div>
    );

    const adminListTemplate = (row: SupportTeamData) => {
        if (!row.assignedAdmins?.length) return <span className="text-gray-500">-</span>;
        return (
            <Dropdown 
                value={null} options={row.assignedAdmins} optionLabel="name" 
                placeholder={`${row.assignedAdmins.length} ທ່ານ`} 
                className="w-full border-none bg-transparent shadow-none p-0"
                pt={{ input: { className: 'text-sm' }, trigger: { className: 'w-2rem' } }}
            />
        );
    };

    return (
        <DataTable 
            value={items}  header={header} globalFilter={globalFilter} 
            paginator rows={10} className="p-datatable-sm" stripedRows
            emptyMessage={<div className="text-center p-4 text-gray-500">ບໍ່ພົບຂໍ້ມູນ</div>}
        >
            <Column header="#" body={(d, opts) => opts.rowIndex + 1} className="text-center w-4rem" />
            
            {/* ✅ แก้ไข: ไม่ใช้ Fragment แต่ใช้เงื่อนไขแยกบรรทัด เพื่อให้ DataTable เห็น Column */}
            {isSystemAdminTab && <Column field="issueCategoryName" header="ໝວດບັນຫາ" style={{ minWidth: '180px' }} />}
            {isSystemAdminTab && <Column header="ຊື່ຜູ້ຄຸ້ມຄອງ" body={adminListTemplate} style={{ minWidth: '200px' }} />}
            {!isSystemAdminTab && <Column field="name" header={label} style={{ minWidth: '200px' }} />}
            <Column field="description" header="ຄຳອະທິບາຍ" style={{ minWidth: '250px' }} />
            <Column field="createdAt" header="ວັນທີສ້າງ" style={{ width: '150px' }} />
            <Column header="ສະຖານະ" body={statusTemplate} className="text-center w-8rem" />
            <Column header="ດຳເນີນການ" body={actionTemplate} className="text-center w-8rem" />
        </DataTable>
    );
}