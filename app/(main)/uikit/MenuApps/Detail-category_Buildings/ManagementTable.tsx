// src/uikit/MenuApps/Detail-category_Buildings/ManagementTable.tsx
import React from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { BuildingData } from '../types';

interface Props {
    items: BuildingData[];
    loading: boolean;
    header: React.ReactNode;
    globalFilter: string;
    nameColumnHeader: string;
    activeTab: number;
    onEdit: (item: BuildingData) => void;
    onDelete: (item: BuildingData) => void;
}

export default function ManagementTable({ items, loading, header, globalFilter, nameColumnHeader, activeTab, onEdit, onDelete }: Props) {

    const statusTemplate = (row: BuildingData) => (
        <div className="flex justify-content-center">
            <Tag 
                value={row.status === 'ACTIVE' ? 'ໃຊ້ງານ' : 'ບໍ່ໃຊ້ງານ'} 
                severity={row.status === 'ACTIVE' ? 'success' : 'danger'} 
            />
        </div>
    );

    const actionTemplate = (row: BuildingData) => (
        <div className="flex gap-2 justify-content-center">
            <Button icon="pi pi-pencil" rounded text className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-none" tooltip="ແກ້ໄຂ" onClick={() => onEdit(row)} />
            <Button icon="pi pi-trash" rounded text className="bg-red-100 text-red-700 hover:bg-red-200 border-none" tooltip="ລຶບ" onClick={() => onDelete(row)} />
        </div>
    );

    // ກຳນົດຊື່ຫົວຖັນຕາມ Tab (ສຳລັບ Tab 0 ແລະ 1)
    let codeHeader = "ລາຍລະອຽດ";
    if (activeTab === 0) {
        codeHeader = "ຄຳອະທິບາຍ"; 
    } else if (activeTab === 1) {
        codeHeader = "ຄຳອະທິບາຍ";
    }

    // ຕົວປ່ຽນກວດສອບວ່າແມ່ນ Tab ຫ້ອງ (Room) ຫຼື ບໍ່
    const isRoomTab = activeTab === 2;

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
            
            {/* =============================================
                ສ່ວນທີ 1: ສະແດງຜົນສະເພາະ Tab ຫ້ອງ (activeTab === 2)
                ຮຽງລຳດັບ: #, ລະຫັດຫ້ອງ, ຕຶກ/ອາຄານ, ລະດັບຊັ້ນ, ຄຳອະທິບາຍ
                =============================================
            */}
            {isRoomTab && <Column field="code" header="ລະຫັດຫ້ອງ" style={{ minWidth: '150px' }} />}
            {isRoomTab && <Column field="parentName" header="ຕຶກ/ອາຄານ" style={{ minWidth: '150px' }} body={(row) => row.parentName || '-'} />}
            {/* ຢ່າລືມເພີ່ມ levelName ໃນ types.ts ຖ້າບໍ່ດັ່ງນັ້ນຂໍ້ມູນຈະບໍ່ຂຶ້ນ */}
            {isRoomTab && <Column field="levelName" header="ລະດັບຊັ້ນ" style={{ minWidth: '150px' }} body={(row) => row.levelName || '-'} />} 
            {isRoomTab && <Column field="name" header="ຄຳອະທິບາຍ" style={{ minWidth: '200px' }} />}


            {/* =============================================
                ສ່ວນທີ 2: ສະແດງຜົນ Tab ອື່ນໆ (activeTab !== 2)
                =============================================
            */}
            {!isRoomTab && <Column field="name" header={nameColumnHeader} style={{ minWidth: '200px' }} />}
            
            {/* Tab 1 (activeTab === 1) ຄື ລະດັບຊັ້ນ ໃຫ້ສະແດງສັງກັດຕຶກ */}
            {activeTab === 1 && (
                <Column 
                    field="parentName" 
                    header="ຕຶກ/ອາຄານ" 
                    style={{ minWidth: '150px' }} 
                    body={(row) => row.parentName || '-'} 
                />
            )}

            {!isRoomTab && <Column field="code" header={codeHeader} style={{ minWidth: '200px' }} />}
            
            {/* ============================================= */}

            <Column field="createdAt" header="ວັນທີສ້າງ" style={{ width: '150px' }} />
            <Column header="ສະຖານະ" body={statusTemplate} className="text-center w-8rem" alignHeader={'center'} />
            <Column header="ດຳເນີນການ" body={actionTemplate} className="text-center w-8rem" alignHeader={'center'} />
        </DataTable>
    );
}