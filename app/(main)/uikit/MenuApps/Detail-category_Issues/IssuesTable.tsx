// src/uikit/MenuApps/Detail-category_Issues/IssuesTable.tsx
import React from 'react';
import Image from 'next/image';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { IssueData, CategoryData } from '../types';

type RowData = IssueData | CategoryData;

function isCategoryRow(row: RowData): row is CategoryData {
    return 'headCategoryId' in row;
}

interface Props {
    items: RowData[];
    header: React.ReactNode;
    globalFilter: string;
    nameColumnHeader: string;
    activeTab: number;
    onEdit: (item: RowData) => void;
    onDelete: (item: RowData) => void;
    categoryMap: Map<string | number, string>;
    /** Tab 0: catIconId -> catIcon path/URL (from /api/categoryicons/selectcategoryicon) */
    categoryIconMap: Map<number, string>;
    /** Role-based: false = ซ่อนปุ่มແກ້ໄຂ/ລຶບ */
    canManage: boolean;
    /** ຕອນໂຫຼດຂໍ້ມູນ ບໍ່ໃຫ້ແສງ emptyMessage "ບໍ່ພົບຂໍ້ມູນ" */
    isLoading?: boolean;
    /** Tab 0 only: ຊີດີໝວດໝູ່ທີ່ມີລາຍການຫົວຂໍ້ — ບໍ່ໃຫ້ລຶບ */
    categoryIdsInUse?: Set<number>;
}

const EMPTY_MSG = <div className="text-center p-4 text-gray-500">ບໍ່ພົບຂໍ້ມູນ</div>;

export default function IssuesTable({
    items,
    header,
    globalFilter,
    nameColumnHeader,
    activeTab,
    onEdit,
    onDelete,
    categoryMap,
    categoryIconMap,
    canManage,
    isLoading = false,
    categoryIdsInUse,
}: Props) {
    const isCategoryTab = activeTab === 0;
    const isTopicTab = activeTab === 1;

    const categoryIconTemplate = (row: RowData) => {
        if (!isCategoryRow(row)) return <span className="text-500">-</span>;
        const url = row.catIconId != null ? categoryIconMap.get(row.catIconId) : null;
        if (url) return <Image src={url} alt="" width={32} height={32} className="object-contain border-round" unoptimized />;
        return <span className="text-500">-</span>;
    };

    const createdAtTemplate = (row: RowData) => {
        if (!isCategoryRow(row) || !row.createdAt) return '-';
        try {
            return new Date(row.createdAt).toLocaleDateString('lo-LA', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
            });
        } catch {
            return '-';
        }
    };

    const parentNameTemplate = (row: RowData) => {
        if (!('parentId' in row)) return '-';
        const issueRow = row as IssueData;
        if (issueRow.parentName) return issueRow.parentName;
        if (issueRow.parentId) return categoryMap.get(issueRow.parentId) ?? '-';
        return '-';
    };

    const centerAlign = { textAlign: 'center' as const };

    const actionTemplate = (row: RowData) => {
        const isCategory = isCategoryRow(row);
        const cannotDeleteCategory = isCategoryTab && isCategory && categoryIdsInUse?.has(row.id);
        return (
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
                            tooltip={cannotDeleteCategory ? 'ບໍ່ສາມາດລຶບໄດ້ ເພາະມີລາຍການຫົວຂໍ້ໃນໝວດໝູ່ນີ້' : 'ລຶບ'}
                            onClick={() => !cannotDeleteCategory && onDelete(row)}
                            disabled={cannotDeleteCategory}
                        />
                    </>
                )}
            </div>
        );
    };

    return (
        <DataTable
            value={items}
            header={header}
            globalFilter={globalFilter}
            emptyMessage={!isLoading ? EMPTY_MSG : undefined}
            className="p-datatable-sm"
            stripedRows
            paginator
            rows={10}
        >
            <Column header="#" body={(_, opts) => opts.rowIndex + 1} className="text-center w-4rem" alignHeader="center" bodyStyle={centerAlign} />

            {isCategoryTab && <Column field="title" header="ຊື່ໝວດໝູ່" style={{ minWidth: '200px' }} className="text-center" alignHeader="center" bodyStyle={centerAlign} />}
            {isCategoryTab && (
                <Column header="ຮູບໄອຄອນ" body={categoryIconTemplate} style={{ minWidth: '80px' }} className="text-center" alignHeader="center" bodyStyle={centerAlign} />
            )}
            {isCategoryTab && <Column field="description" header="ຄຳອະທິບາຍ" style={{ minWidth: '250px' }} className="text-center" alignHeader="center" bodyStyle={centerAlign} />}
            {isCategoryTab && (
                <Column header="ວັນທີສ້າງ" body={createdAtTemplate} style={{ minWidth: '120px' }} className="text-center" alignHeader="center" bodyStyle={centerAlign} />
            )}

            {isTopicTab && <Column header="ໝວດໝູ່" style={{ minWidth: '150px' }} body={parentNameTemplate} className="text-center" alignHeader="center" bodyStyle={centerAlign} />}
            {isTopicTab && <Column field="title" header={nameColumnHeader} style={{ minWidth: '200px' }} className="text-center" alignHeader="center" bodyStyle={centerAlign} />}
            {isTopicTab && <Column field="description" header="ຄຳອະທິບາຍ" style={{ minWidth: '250px' }} className="text-center" alignHeader="center" bodyStyle={centerAlign} />}

            <Column header="ດຳເນີນການ" body={actionTemplate} className="text-center w-8rem" alignHeader="center" bodyStyle={centerAlign} />
        </DataTable>
    );
}