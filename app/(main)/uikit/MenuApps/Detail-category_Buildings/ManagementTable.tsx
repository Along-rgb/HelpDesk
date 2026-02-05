// src/uikit/MenuApps/Detail-category_Buildings/ManagementTable.tsx
import React from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { BuildingData, BuildingTabs } from '../types';

interface Props {
    items: BuildingData[];
    loading: boolean;
    header: React.ReactNode;
    globalFilter: string;
    nameColumnHeader: string;
    activeTab: number;
    onEdit: (item: BuildingData) => void;
    onDelete: (item: BuildingData) => void;
    buildingMap: Map<string | number, string>; // [Changed] ຮັບ Map ແທນ Array
}

export default function ManagementTable({ 
    items, 
    loading, 
    header, 
    globalFilter, 
    nameColumnHeader, 
    activeTab, 
    onEdit, 
    onDelete, 
    buildingMap 
}: Props) {

    const isRoomTab = activeTab === BuildingTabs.ROOM;
    const isLevelTab = activeTab === BuildingTabs.LEVEL;
    
    // [Fast Join]
    const parentNameTemplate = (row: BuildingData) => {
        if (row.parentName) return row.parentName;
        if (row.parentId) {
            return buildingMap.get(row.parentId) || '-';
        }
        return '-';
    };

    const statusTemplate = (row: BuildingData) => (
        <div className="flex justify-content-center">
            <Tag value={row.status === 'ACTIVE' ? 'ໃຊ້ງານ' : 'ບໍ່ໃຊ້ງານ'} severity={row.status === 'ACTIVE' ? 'success' : 'danger'} />
        </div>
    );

    const actionTemplate = (row: BuildingData) => (
        <div className="flex gap-2 justify-content-center">
            <Button icon="pi pi-pencil" rounded text className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-none" tooltip="ແກ້ໄຂ" onClick={() => onEdit(row)} />
            <Button icon="pi pi-trash" rounded text className="bg-red-100 text-red-700 hover:bg-red-200 border-none" tooltip="ລຶບ" onClick={() => onDelete(row)} />
        </div>
    );

    let codeHeader = !isRoomTab ? "ຄຳອະທິບາຍ" : "ລາຍລະອຽດ";

    return (
        <DataTable value={items} header={header} globalFilter={globalFilter} emptyMessage={<div className="text-center p-4 text-gray-500">ບໍ່ພົບຂໍ້ມູນ</div>} className="p-datatable-sm" stripedRows paginator rows={10}>
            <Column header="#" body={(d, opts) => opts.rowIndex + 1} className="text-center w-4rem" />
            
            {/* Room Tab Columns */}
            {isRoomTab && <Column field="code" header="ລະຫັດຫ້ອງ" style={{ minWidth: '150px' }} />}
            {isRoomTab && <Column header="ຕຶກ/ອາຄານ" style={{ minWidth: '150px' }} body={parentNameTemplate} />}
            {isRoomTab && <Column field="levelName" header="ລະດັບຊັ້ນ" style={{ minWidth: '150px' }} body={(row) => row.levelName || '-'} />} 
            {isRoomTab && <Column field="name" header="ຄຳອະທິບາຍ" style={{ minWidth: '200px' }} />}

            {/* Other Tabs Columns */}
            {!isRoomTab && <Column field="name" header={nameColumnHeader} style={{ minWidth: '200px' }} />}
            {isLevelTab && (
                <Column header="ຕຶກ/ອາຄານ" style={{ minWidth: '150px' }} body={parentNameTemplate} />
            )}
            {!isRoomTab && <Column field="code" header={codeHeader} style={{ minWidth: '200px' }} />}
            
            <Column field="createdAt" header="ວັນທີສ້າງ" style={{ width: '150px' }} />
            <Column header="ສະຖານະ" body={statusTemplate} className="text-center w-8rem" />
            <Column header="ດຳເນີນການ" body={actionTemplate} className="text-center w-8rem" />
        </DataTable>
    );
}