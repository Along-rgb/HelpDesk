// src/uikit/MenuApps/Detail-category_Issues/IssuesIconTable.tsx
import React, { useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { IconItemData } from '../types';
import { getCategoryIconBaseUrl } from '../utils/iconUrl';

interface Props {
    items: IconItemData[];
    header: React.ReactNode;
    globalFilter: string;
    onEdit: (item: IconItemData) => void;
    onDelete: (item: IconItemData) => void;
    /** Role-based: false = ซ่อนปุ่มແກ້ໄຂ/ລຶບ */
    canManage?: boolean;
    /** ຕອນໂຫຼດຂໍ້ມູນ ບໍ່ໃຫ້ແສງ emptyMessage "ບໍ່ພົບຂໍ້ມູນ" */
    isLoading?: boolean;
}

/** แสดงรูป icon ພ້ອມ fallback ເມື່ອโหลดບໍ່ได้; onError log ข้อมูล debug (path/CORS/404) */
function IconCell({ src, alt = '' }: { src: string; alt?: string }) {
    const [error, setError] = useState(false);
    if (!src)
        return (
            <span className="text-500 inline-flex align-items-center justify-content-center w-3rem h-3rem">-</span>
        );
    if (error)
        return (
            <span className="text-500 text-sm inline-flex align-items-center justify-content-center w-3rem h-3rem surface-100 border-round" title={src}>
                ບໍ່ມີຮູບ
            </span>
        );
    return (
        <span className="inline-flex align-items-center justify-content-center">
            <img
                src={src}
                alt={alt}
                width={48}
                height={48}
                className="border-round"
                style={{ width: '48px', height: '48px', objectFit: 'contain' }}
                onError={() => {
                    if (process.env.NODE_ENV === 'development') {
                        const base = getCategoryIconBaseUrl();
                        const isFullUrl = src.startsWith('http://') || src.startsWith('https://');
                        console.warn(
                            '[IssuesIconTable] Image load failed:',
                            {
                                requestedUrl: src,
                                uploadBaseUrl: base || '(empty — set NEXT_PUBLIC_HELPDESK_UPLOAD_BASE_URL)',
                                isFullUrl,
                                hint: 'Possible causes: CORS, 404 (file missing on server), or base URL missing /uploads',
                            }
                        );
                    }
                    setError(true);
                }}
            />
        </span>
    );
}

const EMPTY_MSG = <div className="text-center p-4 text-gray-500">ບໍ່ພົບຂໍ້ມູນ</div>;

export default function IssuesIconTable({ items, header, globalFilter, onEdit, onDelete, canManage = true, isLoading = false }: Props) {
    const iconTemplate = (row: IconItemData) => <IconCell src={row.iconUrl} alt="" />;

    const actionTemplate = (row: IconItemData) => (
        <div className="flex gap-2 justify-content-center">
            {canManage && (
                <>
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
                </>
            )}
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
            emptyMessage={!isLoading ? EMPTY_MSG : undefined}
        >
            <Column
                header="#"
                body={(_, opts) => opts.rowIndex + 1}
                alignHeader="center"
                bodyStyle={{ textAlign: 'center' }}
                className="w-4rem"
            />
            <Column
                header="ຮູປໄອຄອນ"
                body={iconTemplate}
                alignHeader="center"
                bodyStyle={{ textAlign: 'center' }}
                style={{ minWidth: '120px' }}
            />
            <Column
                header="ດຳເນີນການ"
                body={actionTemplate}
                alignHeader="center"
                bodyStyle={{ textAlign: 'center' }}
                className="w-8rem"
            />
        </DataTable>
    );
}
