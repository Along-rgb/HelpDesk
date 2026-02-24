// src/uikit/MenuApps/Detail-category_Issues/IssuesTable.tsx
import React from 'react';
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
    /** Tab 0: headCategoryId -> name (from /api/headcategorys/selectheadcategory) */
    headCategoryMap: Map<string | number, string>;
    /** Tab 0: catIconId -> catIcon path/URL (from /api/categoryicons/selectcategoryicon) */
    categoryIconMap: Map<number, string>;
    /** Role-based: false = ซ่อนปุ่มແກ້ໄຂ/ລຶບ */
    canManage: boolean;
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
    headCategoryMap,
    categoryIconMap,
    canManage,
}: Props) {
    const isCategoryTab = activeTab === 0;
    const isTopicTab = activeTab === 1;

    const headCategoryNameTemplate = (row: RowData) => {
        if (!isCategoryRow(row)) return '-';
        return headCategoryMap.get(row.headCategoryId) ?? '-';
    };

    const categoryIconTemplate = (row: RowData) => {
        if (!isCategoryRow(row)) return <span className="text-500">-</span>;
        const url = row.catIconId != null ? categoryIconMap.get(row.catIconId) : null;
        if (url) return <img src={url} alt="" className="w-2rem h-2rem object-contain border-round" />;
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

    const actionTemplate = (row: RowData) => (
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
            emptyMessage={<div className="text-center p-4 text-gray-500">ບໍ່ພົບຂໍ້ມູນ</div>}
            className="p-datatable-sm"
            stripedRows
            paginator
            rows={10}
        >
            <Column header="#" body={(_, opts) => opts.rowIndex + 1} className="text-center w-4rem" />

            {isCategoryTab && (
                <Column header="ທີມຊ່ວຍເຫຼືອ" body={headCategoryNameTemplate} style={{ minWidth: '150px' }} />
            )}
            {isCategoryTab && <Column field="title" header="ຊື່ໝວດໝູ່" style={{ minWidth: '200px' }} />}
            {isCategoryTab && (
                <Column header="ຮູບໄອຄອນ" body={categoryIconTemplate} style={{ minWidth: '80px' }} className="text-center" />
            )}
            {isCategoryTab && <Column field="description" header="ຄຳອະທິບາຍ" style={{ minWidth: '250px' }} />}
            {isCategoryTab && (
                <Column header="ວັນທີສ້າງ" body={createdAtTemplate} style={{ minWidth: '120px' }} />
            )}

            {isTopicTab && <Column header="ໝວດໝູ່" style={{ minWidth: '150px' }} body={parentNameTemplate} />}
            {isTopicTab && <Column field="title" header={nameColumnHeader} style={{ minWidth: '200px' }} />}
            {isTopicTab && <Column field="description" header="ຄຳອະທິບາຍ" style={{ minWidth: '250px' }} />}

            <Column header="ດຳເນີນການ" body={actionTemplate} className="text-center w-8rem" />
        </DataTable>
    );
}