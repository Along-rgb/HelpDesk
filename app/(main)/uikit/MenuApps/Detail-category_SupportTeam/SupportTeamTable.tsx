// src/uikit/MenuApps/Detail-category_SupportTeam/SupportTeamTable.tsx
import React from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { SupportTeamData, IssueData, SupportTeamTabs } from '../types';

type RowData = IssueData | SupportTeamData;

interface Props {
    items: RowData[];
    header: React.ReactNode;
    globalFilter: string;
    label: string;
    activeTab: number;
    onEdit: (item: RowData) => void;
    onDelete: (item: RowData) => void;
    issueCategoryMap: Map<string | number, string>;
}

export default function SupportTeamTable({
    items,
    header,
    globalFilter,
    label,
    activeTab,
    onEdit,
    onDelete,
    issueCategoryMap
}: Props) {
    const isIssueCategoryTab = activeTab === SupportTeamTabs.ISSUE_CATEGORY;
    const isTechnicalTab = activeTab === SupportTeamTabs.TECHNICAL;
    const isSupportTeamTab = activeTab === SupportTeamTabs.SUPPORT_TEAM;

    const categoryNameTemplate = (row: RowData) => {
        if ('issueCategoryName' in row && row.issueCategoryName) return row.issueCategoryName;
        if ('issueCategoryId' in row && row.issueCategoryId) return issueCategoryMap.get(row.issueCategoryId) || '-';
        return '-';
    };

    const actionTemplate = (row: RowData) => (
        <div className="flex gap-2 justify-content-center">
            <Button icon="pi pi-pencil" rounded text severity="warning" tooltip="ແກ້ໄຂ" onClick={() => onEdit(row)} />
            <Button icon="pi pi-trash" rounded text severity="danger" tooltip="ລຶບ" onClick={() => onDelete(row)} />
        </div>
    );

    const adminListTemplate = (row: RowData) => {
        if (!('assignedAdmins' in row) || !row.assignedAdmins?.length) return <span className="text-gray-500">-</span>;
        return (
            <Dropdown
                value={null}
                options={row.assignedAdmins}
                optionLabel="name"
                placeholder={`${row.assignedAdmins.length} ທ່ານ`}
                className="w-full border-none bg-transparent shadow-none p-0"
                pt={{ input: { className: 'text-sm' }, trigger: { className: 'w-2rem' } }}
            />
        );
    };

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
            <Column header="#" body={(_, opts) => opts.rowIndex + 1} className="text-center w-4rem" alignHeader="center" bodyStyle={{ textAlign: 'center' }} />

            {/* tab 0 ໝວດບັນຫາ: ຊື່ໝວດບັນຫາ, ຄຳອະທິບາຍ */}
            {isIssueCategoryTab && <Column field="title" header="ຊື່ໝວດບັນຫາ" style={{ minWidth: '200px' }} />}
            {isIssueCategoryTab && <Column field="description" header="ຄຳອະທິບາຍ" style={{ minWidth: '250px' }} />}

            {/* tab 1 ວິຊາການ: ຊື່ວິຊາການ, ຄຳອະທິບາຍ */}
            {isTechnicalTab && <Column field="name" header="ຊື່ວິຊາການ" style={{ minWidth: '200px' }} />}
            {isTechnicalTab && <Column field="description" header="ຄຳອະທິບາຍ" style={{ minWidth: '250px' }} />}

            {/* tab 2 ທີມຄຸ້ມຄອງ: ໝວດບັນຫາ, ຊື່ທີມຄຸ້ມຄອງ, ຄຳອະທິບາຍ */}
            {isSupportTeamTab && <Column header="ໝວດບັນຫາ" body={categoryNameTemplate} style={{ minWidth: '180px' }} />}
            {isSupportTeamTab && <Column header="ຊື່ທີມຄຸ້ມຄອງ" body={adminListTemplate} style={{ minWidth: '200px' }} />}
            {isSupportTeamTab && <Column field="description" header="ຄຳອະທິບາຍ" style={{ minWidth: '250px' }} />}

            <Column header="ດຳເນີນການ" body={actionTemplate} className="text-center w-8rem" />
        </DataTable>
    );
}