// src/uikit/MenuApps/Detail-category_Buildings/ManagementTable.tsx
import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { BuildingData, BuildingTabs } from '../types';

const LEVEL_TABLE_COL_COUNT = 4;
const STICKY_HEADER_STYLE: React.CSSProperties = { position: 'sticky', top: 0, zIndex: 10 };

/** ສ້າງຂໍ້ຄວາມຢືນຢັນລຶບຕຶກແບບ Cascade ພ້ອມຊື່ຂໍ້ມູນ */
export function getCascadeDeleteMessage(item: BuildingData): string {
    const name = item?.name ?? 'ຂໍ້ມູນນີ້';
    return `${name} ມີຊຸດຂໍ້ມູນຢູ່ກະລຸນາຍືນຍັນຖ້າຕ້ອງການລົບ`;
}

interface Props {
    items: BuildingData[];
    header: React.ReactNode;
    globalFilter: string;
    nameColumnHeader: string;
    activeTab: number;
    onEdit: (item: BuildingData) => void;
    onDelete: (item: BuildingData) => void;
    buildingMap: Map<string | number, string>;
    buildingOptions?: BuildingData[];
    /** ຖ້າສ่งມາ ໃຊ້ຂໍ້ຄວາມນີ້ໃນ Confirm ລຶບ — ຮອງຮັບທີ່ຈະເປັນ string ຫຼື ຟັງຊັນ (item) => string ເພື່ອດຶງຊື່ຂໍ້ມູນຂຶ້ນມາ */
    deleteConfirmMessage?: string | ((item: BuildingData) => string);
}

export default function ManagementTable({ 
    items, 
    header, 
    globalFilter, 
    nameColumnHeader, 
    activeTab, 
    onEdit, 
    onDelete, 
    buildingMap,
    buildingOptions = [],
    deleteConfirmMessage
}: Props) {

    const isRoomTab = activeTab === BuildingTabs.ROOM;
    const isLevelTab = activeTab === BuildingTabs.LEVEL;
    const tableWrapperRef = useRef<HTMLDivElement>(null);
    const [stickyHeaderHeight, setStickyHeaderHeight] = useState(44);

    const parentNameTemplate = useCallback((row: BuildingData) => {
        if (row.parentName) return row.parentName;
        if (row.parentId != null && buildingMap) return buildingMap.get(row.parentId) || '-';
        return '-';
    }, [buildingMap]);

    const handleDeleteClick = useCallback(
        (row: BuildingData) => {
            const message =
                typeof deleteConfirmMessage === 'function'
                    ? deleteConfirmMessage(row)
                    : deleteConfirmMessage ?? `ທ່ານຕ້ອງການລົບ "${row.name}" ແທ້ບໍ່?`;
            confirmDialog({
                message,
                header: 'ຢືນຢັນການລົບ',
                icon: 'pi pi-exclamation-triangle',
                acceptLabel: 'ຕົກລົງ',
                rejectLabel: 'ຍົກເລີກ',
                acceptClassName: 'p-button-danger',
                accept: () => onDelete(row),
            });
        },
        [onDelete, deleteConfirmMessage]
    );

    const actionTemplate = useCallback((row: BuildingData) => (
        <div className="flex gap-2 justify-content-center align-items-center w-full">
            <Button icon="pi pi-pencil" rounded text className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-none" tooltip="ແກ້ໄຂ" onClick={() => onEdit(row)} />
            <Button icon="pi pi-trash" rounded text className="bg-red-100 text-red-700 hover:bg-red-200 border-none" tooltip="ລຶບ" onClick={() => handleDeleteClick(row)} />
        </div>
    ), [onEdit, handleDeleteClick]);

    const safeItems = Array.isArray(items) ? items.filter((row): row is BuildingData => row != null && typeof row === 'object') : [];
    const safeHeader = header ?? null;
    const safeGlobalFilter = (globalFilter ?? '').trim();

    // ຊ່ອຍຄົ້ນຫາຕາມ ຊື່ຕຶກ/ອາຄານ (name), ລະຫັດ, ຊື່ພໍ່ ແລະ ອື່ນໆ ຕາມ tab
    const matchesFilter = (row: BuildingData) => {
        if (!safeGlobalFilter) return true;
        const q = safeGlobalFilter.toLowerCase();
        const name = (row.name ?? '').toLowerCase();
        const code = (row.code ?? '').toLowerCase();
        const parentName = (row.parentName ?? buildingMap?.get(row.parentId!) ?? '').toString().toLowerCase();
        const levelName = (row.levelName ?? '').toLowerCase();
        if (isRoomTab) return name.includes(q) || code.includes(q) || levelName.includes(q) || parentName.includes(q);
        if (isLevelTab) return name.includes(q) || parentName.includes(q);
        // Tab ຕຶກ/ອາຄານ: ຄົ້ນຫາຕາມຊື່ (name) ຫຼື ຄຳອະທິບາຍ (code)
        return name.includes(q) || code.includes(q);
    };

    const useLevelGrouped = isLevelTab && Array.isArray(buildingOptions) && buildingOptions.length > 0;

    // ໃຊ້ຂໍ້ມູນທີ່ກັ່ນແລ້ວສຳລັບ DataTable ເພື່ອໃຫ້ຄົ້ນຫາຕາມຊື່ຕຶກ/ອາຄານ (name) ໄດ້
    const filteredItems = useMemo(() => {
        if (useLevelGrouped) return safeItems; // ລະດັບຊັ້ນໃຊ້ matchesFilter ໃນ levelTableRows ແລ້ວ
        return safeItems.filter(matchesFilter);
    }, [safeItems, safeGlobalFilter, useLevelGrouped, isLevelTab, isRoomTab, buildingMap]);

    type LevelTableRow = { type: 'section'; name: string; buildingId: number } | { type: 'data'; row: BuildingData };
    const levelTableRows: LevelTableRow[] = useLevelGrouped
        ? (() => {
              const out: LevelTableRow[] = [];
              buildingOptions.forEach((building) => {
                  const floors = safeItems.filter((row) => row.parentId === building.id && matchesFilter(row));
                  if (floors.length > 0 || !safeGlobalFilter.trim()) {
                      out.push({ type: 'section', name: building.name, buildingId: building.id });
                      floors.forEach((row) => out.push({ type: 'data', row }));
                  }
              });
              return out;
          })()
        : [];

    const { levelTableDataCount, dataRowIndexByPosition } = useMemo(() => {
        let count = 0;
        const indices: number[] = [];
        for (const r of levelTableRows) {
            if (r.type === 'data') {
                count += 1;
                indices.push(count);
            } else {
                indices.push(0);
            }
        }
        return { levelTableDataCount: count, dataRowIndexByPosition: indices };
    }, [levelTableRows]);

    useEffect(() => {
        if (!useLevelGrouped || !tableWrapperRef.current) return;
        const thead = tableWrapperRef.current.querySelector('.p-datatable-thead tr');
        if (!thead) return;
        const measure = () => setStickyHeaderHeight((thead as HTMLElement).offsetHeight);
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(thead as Element);
        return () => ro.disconnect();
    }, [useLevelGrouped]);

    if (useLevelGrouped) {
        return (
            <>
                <ConfirmDialog />
                {safeHeader}
                <div className="p-datatable p-datatable-sm p-datatable-striped mt-3 border-1 surface-border border-round overflow-hidden">
                    <div ref={tableWrapperRef} className="p-datatable-wrapper" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                        <table className="p-datatable-table w-full" style={{ borderCollapse: 'collapse', borderSpacing: 0 }}>
                            <thead className="p-datatable-thead">
                                <tr>
                                    <th className="p-datatable-header text-center w-4rem surface-0 border-bottom-1 surface-border" style={STICKY_HEADER_STYLE}>#</th>
                                    <th className="p-datatable-header surface-0 border-bottom-1 surface-border" style={{ ...STICKY_HEADER_STYLE, minWidth: '200px' }}>ລະດັບຊັ້ນ</th>
                                    <th className="p-datatable-header text-center surface-0 border-bottom-1 surface-border" style={{ ...STICKY_HEADER_STYLE, minWidth: '150px' }}>ຕຶກ/ອາຄານ</th>
                                    <th className="p-datatable-header text-center w-8rem surface-0 border-bottom-1 surface-border" style={STICKY_HEADER_STYLE}>ດຳເນີນການ</th>
                                </tr>
                            </thead>
                            <tbody className="p-datatable-tbody">
                                {levelTableRows.map((item, idx) => {
                                    if (item.type === 'section') {
                                        return (
                                            <tr key={`section-${item.buildingId}`} className="p-datatable-row section-title-row">
                                                <td
                                                    colSpan={LEVEL_TABLE_COL_COUNT}
                                                    className="p-3 font-bold text-lg text-indigo-700 border-bottom-1 surface-border sticky"
                                                    style={{ position: 'sticky', top: stickyHeaderHeight, zIndex: 8, backgroundColor: '#f8fafc' }}
                                                >
                                                    <i className="pi pi-building mr-2" /> {item.name}
                                                </td>
                                            </tr>
                                        );
                                    }
                                    const row = item.row;
                                    return (
                                        <tr key={row.id} className="p-datatable-row">
                                            <td className="p-datatable-cell text-center">{dataRowIndexByPosition[idx]}</td>
                                            <td className="p-datatable-cell">{row.name}</td>
                                            <td className="p-datatable-cell text-center">{parentNameTemplate(row)}</td>
                                            <td className="p-datatable-cell text-center">{actionTemplate(row)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {levelTableDataCount === 0 && (
                        <div className="text-center p-4 text-gray-500 surface-0">ບໍ່ພົບຂໍ້ມູນ</div>
                    )}
                </div>
            </>
        );
    }

    return (
        <>
            <ConfirmDialog />
            <DataTable 
                value={filteredItems} 
                header={safeHeader} 
                emptyMessage={<div className="text-center p-4 text-gray-500">ບໍ່ພົບຂໍ້ມູນ</div>} 
                className="p-datatable-sm" 
                stripedRows 
                paginator 
                rows={10}
                scrollable 
                scrollHeight="60vh"
            >
            <Column header="#" body={(d, opts) => opts.rowIndex + 1} className="text-center w-4rem" alignHeader="center" bodyStyle={{ textAlign: 'center' }} frozen alignFrozen="left" />

            {isRoomTab && <Column field="code" header="ລະຫັດຫ້ອງ" style={{ minWidth: '150px' }} />}
            {isRoomTab && <Column header="ຕຶກ/ອາຄານ" style={{ minWidth: '150px' }} body={parentNameTemplate} alignHeader="center" bodyStyle={{ textAlign: 'center' }} />}
            {isRoomTab && <Column field="levelName" header="ລະດັບຊັ້ນ" style={{ minWidth: '150px' }} body={(row) => row.levelName || '-'} />}
            {isRoomTab && <Column field="name" header="ຄຳອະທິບາຍ" style={{ minWidth: '200px' }} />}
            {isRoomTab && <Column header="ດຳເນີນການ" body={actionTemplate} alignHeader="center" bodyStyle={{ textAlign: 'center' }} className="text-center w-8rem" />}
            {isLevelTab && <Column field="name" header="ລະດັບຊັ້ນ" style={{ minWidth: '200px' }} />}
            {isLevelTab && <Column header="ຕຶກ/ອາຄານ" style={{ minWidth: '150px' }} body={parentNameTemplate} alignHeader="center" bodyStyle={{ textAlign: 'center' }} />}
            {isLevelTab && <Column header="ດຳເນີນການ" body={actionTemplate} alignHeader="center" bodyStyle={{ textAlign: 'center' }} className="text-center w-8rem" />}
            {!isRoomTab && !isLevelTab && <Column field="name" header={nameColumnHeader} style={{ minWidth: '200px' }} />}
            {!isRoomTab && !isLevelTab && <Column field="code" header="ຄຳອະທິບາຍ" style={{ minWidth: '200px' }} />}
            {!isRoomTab && !isLevelTab && <Column header="ດຳເນີນການ" body={actionTemplate} alignHeader="center" bodyStyle={{ textAlign: 'center' }} className="text-center w-8rem" />}
            </DataTable>
        </>
    );
}