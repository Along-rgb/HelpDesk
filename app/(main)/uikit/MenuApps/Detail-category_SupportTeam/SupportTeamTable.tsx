// src/uikit/MenuApps/Detail-category_SupportTeam/SupportTeamTable.tsx
import React, { useRef, useEffect, useMemo } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tooltip } from 'primereact/tooltip';
import { SupportTeamData, IssueData, HeadCategoryData, SupportTeamTabs, SupportTeamTechnicalRow } from '../types';

const TOOLTIP_TARGET = '.js-support-team-cell-tooltip';
const TECHNICAL_TABLE_COL_COUNT = 4;

type RowData = IssueData | SupportTeamData | HeadCategoryData;
/** แถวประเภท user ใน tab ວິຊາການ (มี fullName) */
type TechnicalUserRow = Extract<SupportTeamTechnicalRow, { type: 'user' }>;
function isTechnicalUserRow(row: SupportTeamTechnicalRow): row is TechnicalUserRow {
    return row.type === 'user';
}

/** ข้อความเกินจำนวนนี้จะถูกตัดและแสดงเต็มใน Tooltip */
const MAX_TEXT_LENGTH = 40;

function CellWithTooltip({ text }: { text: string }) {
    const display = text || '-';
    const isLong = display.length > MAX_TEXT_LENGTH;
    const show = isLong ? `${display.slice(0, MAX_TEXT_LENGTH)}...` : display;
    // แสดง Tooltip เฉพาะเมื่อข้อความยาวเกิน MAX_TEXT_LENGTH — ใช้เฉพาะ data-pr-tooltip (ไม่ใช้ title เพื่อเลี่ยงการแสดงซ้ำ)
    return (
        <span
            className={isLong ? TOOLTIP_TARGET.slice(1) : undefined}
            data-pr-tooltip={isLong ? display : undefined}
            style={{
                display: 'inline-block',
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
            }}
        >
            {show}
        </span>
    );
}

interface Props {
    items: RowData[];
    header: React.ReactNode;
    globalFilter: string;
    label: string;
    activeTab: number;
    onEdit: (item: RowData | unknown) => void;
    onDelete: (item: RowData | unknown) => void;
    issueCategoryMap: Map<string | number, string>;
    /** แถวกลุ่มสำหรับ tab ວິຊາການ (headcategory + users ตาม divisionId) */
    technicalTabRows?: SupportTeamTechnicalRow[];
    /** เมื่อ true (เช่น role 2 ใน tab ວິຊາການ) ปุ่มແກ້ໄຂ/ລຶບ จะถูกซ่อน */
    disableActions?: boolean;
}

export default function SupportTeamTable({
    items,
    header,
    globalFilter,
    label,
    activeTab,
    onEdit,
    onDelete,
    issueCategoryMap,
    technicalTabRows = [],
    disableActions = false
}: Props) {
    const tooltipRef = useRef<React.ComponentRef<typeof Tooltip>>(null);
    const isIssueCategoryTab = activeTab === SupportTeamTabs.ISSUE_CATEGORY;
    const isTechnicalTab = activeTab === SupportTeamTabs.TECHNICAL;
    const useTechnicalGrouped = isTechnicalTab && Array.isArray(technicalTabRows);

    const filteredTechnicalRows = useMemo(() => {
        if (!useTechnicalGrouped || !globalFilter?.trim()) return technicalTabRows;
        const q = globalFilter.toLowerCase();
        const result: SupportTeamTechnicalRow[] = [];
        let i = 0;
        while (i < technicalTabRows.length) {
            const row = technicalTabRows[i];
            if (row.type === 'section') {
                const nameMatch = (row.name ?? '').toLowerCase().includes(q);
                const users: SupportTeamTechnicalRow[] = [];
                let j = i + 1;
                while (j < technicalTabRows.length && technicalTabRows[j].type === 'user') {
                    const u = technicalTabRows[j];
                    if (isTechnicalUserRow(u) && (u.fullName ?? '').toLowerCase().includes(q)) users.push(u);
                    j++;
                }
                if (nameMatch || users.length > 0) {
                    result.push(row);
                    result.push(...users);
                }
                i = j;
            } else {
                if ((row.fullName ?? '').toLowerCase().includes(q)) result.push(row);
                i++;
            }
        }
        return result;
    }, [technicalTabRows, globalFilter, useTechnicalGrouped]);

    const technicalRowIndexByPosition = useMemo(() => {
        let idx = 0;
        return filteredTechnicalRows.map((r) => (r.type === 'user' ? ++idx : 0));
    }, [filteredTechnicalRows]);

    // โหลด Tooltip ใหม่เมื่อตารางเรนเดอร์ (เซลล์ที่มี class นี้เกิดทีหลัง) เพื่อให้แสดงตามเงื่อนไขเฉพาะข้อความยาว > MAX_TEXT_LENGTH
    useEffect(() => {
        const t = setTimeout(() => {
            tooltipRef.current?.updateTargetEvents(TOOLTIP_TARGET);
        }, 0);
        return () => clearTimeout(t);
    }, [items, activeTab, globalFilter]);

    const categoryNameTemplate = (row: RowData) => {
        if ('issueCategoryName' in row && row.issueCategoryName) return row.issueCategoryName;
        if ('issueCategoryId' in row && row.issueCategoryId) return issueCategoryMap.get(row.issueCategoryId) || '-';
        return '-';
    };

    const actionTemplate = (row: RowData) => (
        <div className="flex gap-2 justify-content-center align-items-center">
            {!disableActions && (
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

    const technicalActionTemplate = (row: Extract<SupportTeamTechnicalRow, { type: 'user' }>) => (
        <div className="flex gap-2 justify-content-center align-items-center">
            {!disableActions && (
                <>
                    <Button
                        icon="pi pi-pencil"
                        rounded
                        text
                        className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-none"
                        tooltip="ແກ້ໄຂ"
                        onClick={() => onEdit(row.raw)}
                    />
                    <Button
                        icon="pi pi-trash"
                        rounded
                        text
                        className="bg-red-100 text-red-700 hover:bg-red-200 border-none"
                        tooltip="ລຶບ"
                        onClick={() => onDelete(row.raw)}
                    />
                </>
            )}
        </div>
    );

    const centerAlign = { textAlign: 'center' as const };

    if (useTechnicalGrouped) {
        const hasRows = filteredTechnicalRows.length > 0;
        return (
            <>
                <Tooltip ref={tooltipRef} target={TOOLTIP_TARGET} position="bottom" className="support-team-tooltip" showDelay={200} hideDelay={100} />
                {header}
                <div className="p-datatable p-datatable-sm p-datatable-striped mt-3 border-1 surface-border border-round overflow-hidden">
                    <div className="p-datatable-wrapper" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                        <table className="p-datatable-table w-full" style={{ borderCollapse: 'collapse', borderSpacing: 0 }}>
                            <thead className="p-datatable-thead">
                                <tr>
                                    <th className="p-datatable-header text-center w-4rem surface-0 border-bottom-1 surface-border">#</th>
                                    <th className="p-datatable-header surface-0 border-bottom-1 surface-border" style={{ minWidth: '200px' }}>ຊື່ທີມສະໜັບສະໜູນ</th>
                                    <th className="p-datatable-header text-center surface-0 border-bottom-1 surface-border" style={{ minWidth: '200px' }}>ວິຊາການ</th>
                                    <th className="p-datatable-header text-center w-8rem surface-0 border-bottom-1 surface-border">ດຳເນີນການ</th>
                                </tr>
                            </thead>
                            <tbody className="p-datatable-tbody">
                                {filteredTechnicalRows.map((row, idx) => {
                                    if (row.type === 'section') {
                                        return (
                                            <tr key={`section-${row.headCategoryId}`} className="p-datatable-row section-title-row">
                                                <td colSpan={TECHNICAL_TABLE_COL_COUNT} className="p-3 font-bold text-lg text-indigo-700 border-bottom-1 surface-border" style={{ backgroundColor: '#f0f9ff' }}>
                                                    <i className="pi pi-users mr-2" /> {row.name}
                                                </td>
                                            </tr>
                                        );
                                    }
                                    const rowIndex = technicalRowIndexByPosition[idx];
                                    return (
                                        <tr key={`user-${row.id}`} className="p-datatable-row">
                                            <td className="p-datatable-cell text-center">{rowIndex}</td>
                                            <td className="p-datatable-cell" />
                                            <td className="p-datatable-cell text-center">{row.fullName}</td>
                                            <td className="p-datatable-cell text-center">{technicalActionTemplate(row)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {!hasRows && (
                        <div className="text-center p-4 text-gray-500 surface-0">ບໍ່ພົບຂໍ້ມູນ</div>
                    )}
                </div>
            </>
        );
    }

    return (
        <>
            <Tooltip
                ref={tooltipRef}
                target={TOOLTIP_TARGET}
                position="bottom"
                className="support-team-tooltip"
                showDelay={200}
                hideDelay={100}
            />
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
                <Column header="#" body={(_, opts) => opts.rowIndex + 1} className="text-center w-4rem" alignHeader="center" bodyStyle={centerAlign} />

                {/* tab 0 ທິມສະໜັບສະໜູນ */}
                {isIssueCategoryTab && (
                    <Column
                        header="ທີມສະໜັບສະໜູນ"
                        style={{ minWidth: '180px' }}
                        alignHeader="center"
                        bodyStyle={centerAlign}
                        body={(row: RowData) => <CellWithTooltip text={(row as HeadCategoryData).division?.division_name ?? ''} />}
                    />
                )}
                {isIssueCategoryTab && (
                    <Column
                        header="ຊື່ທີມສະໜັບສະໜູນ"
                        style={{ minWidth: '200px' }}
                        alignHeader="center"
                        bodyStyle={centerAlign}
                        body={(row: RowData) => <CellWithTooltip text={'name' in row ? String(row.name ?? '') : ''} />}
                    />
                )}
                {isIssueCategoryTab && (
                    <Column
                        field="description"
                        header="ຄຳອະທິບາຍ"
                        style={{ minWidth: '250px' }}
                        alignHeader="center"
                        bodyStyle={centerAlign}
                        body={(row: RowData) => <CellWithTooltip text={'description' in row ? String(row.description ?? '') : ''} />}
                    />
                )}
                {isIssueCategoryTab && (
                    <Column
                        header="ວັນທີສ້າງ"
                        field="createdAt"
                        style={{ minWidth: '120px' }}
                        alignHeader="center"
                        bodyStyle={centerAlign}
                        body={(row: RowData) => {
                            const dateStr = 'createdAt' in row && row.createdAt ? new Date(row.createdAt).toLocaleDateString('lo-LA') : '-';
                            return <CellWithTooltip text={dateStr} />;
                        }}
                    />
                )}

                {/* tab 1 ວິຊາການ */}
                {isTechnicalTab && (
                    <Column
                        header="ຊື່ທີມສະໜັບສະໜູນ"
                        body={(row: RowData) => <CellWithTooltip text={categoryNameTemplate(row)} />}
                        style={{ minWidth: '180px' }}
                        alignHeader="center"
                        bodyStyle={centerAlign}
                    />
                )}
                {isTechnicalTab && (
                    <Column
                        field="name"
                        header="ວິຊາການ"
                        style={{ minWidth: '200px' }}
                        alignHeader="center"
                        bodyStyle={centerAlign}
                        body={(row: RowData) => <CellWithTooltip text={'name' in row ? String(row.name ?? '') : ''} />}
                    />
                )}

                <Column header="ດຳເນີນການ" body={actionTemplate} className="text-center w-8rem" alignHeader="center" bodyStyle={centerAlign} />
            </DataTable>
        </>
    );
}