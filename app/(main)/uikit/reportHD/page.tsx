'use client';

import React, { useState, useRef, useCallback } from 'react';
import { TabMenu } from 'primereact/tabmenu';
import { Toast } from 'primereact/toast';
import { useReportData } from './hooks/useReportData';
import { ReportHeaderControls } from './ReportHeaderControls';
import { ReportTable } from './hooks/ReportTable';
import { MENU_ITEMS, getViewConfig, getGroupConfig } from './utils/reportConfig';
import { ReportItem } from './types';
import { formatDateLao } from '@/app/(main)/uikit/shared/formatUtils';
import { styleHeaderRows, styleDataRow, insertGroupRow } from '@/app/(main)/uikit/shared/excelStyles';
import { saveAs } from 'file-saver';
import ExcelJS from 'exceljs';

export default function ReportHD() {
    const [dateRange, setDateRange] = useState<Date[] | any>(null);
    const [activeIndex, setActiveIndex] = useState(0);

    const toast = useRef<Toast>(null);
    const { data, error } = useReportData(activeIndex, dateRange);

    const exportToExcel = useCallback(async () => {
        if (!data || data.length === 0) return;

        const viewConfig = getViewConfig(activeIndex);
        const groupConfig = getGroupConfig(activeIndex);
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('ລາຍງານ', { views: [{ showGridLines: true }] });

        /* ── Pre-compute group counts ── */
        const groupField = groupConfig.field as keyof ReportItem;
        const groupCounts: Record<string, number> = {};
        data.forEach(item => {
            const key = (item[groupField] as string) || 'Unknown';
            groupCounts[key] = (groupCounts[key] || 0) + 1;
        });

        if (viewConfig.isDepartmentTab) {
            /* ═══════ Department Tab ═══════ */
            const r1 = ['#', 'ພະແນກ', 'ລະຫັດ', 'ເລກ ຊຄທ', 'ເບີໂທ', 'ຫົວຂໍ້ເລື່ອງ', 'ລາຍລະອຽດການຮ້ອງຂໍ', 'ຜູ້ຮ້ອງຂໍ', 'ສະຖານທີ່', '', '', 'ວັນທີຮ້ອງຂໍ'];
            const r2 = ['', '', '', '', '', '', '', '', 'ຕຶກ', 'ຊັ້ນ', 'ຫ້ອງ', ''];
            if (viewConfig.showStatus) { r1.push('ສະຖານະ'); r2.push(''); }
            const colCount = r1.length;

            sheet.addRow(r1);
            sheet.addRow(r2);

            [1, 2, 3, 4, 5, 6, 7, 8, 12].forEach(c => sheet.mergeCells(1, c, 2, c));
            sheet.mergeCells(1, 9, 1, 11);
            if (viewConfig.showStatus) sheet.mergeCells(1, 13, 2, 13);

            styleHeaderRows(sheet, colCount);

            const centerCols = new Set([1, 3, 4, 5, 9, 10, 11, 12]);
            let prevGroup = '';
            let globalSeq = 0;
            data.forEach((item: ReportItem) => {
                const grpVal = (item[groupField] as string) || 'Unknown';
                if (grpVal !== prevGroup) {
                    const count = item._groupTotal ?? groupCounts[grpVal] ?? 0;
                    insertGroupRow(sheet, groupConfig.label, grpVal, count, colCount);
                    prevGroup = grpVal;
                }
                globalSeq++;
                const d: (string | number)[] = [
                    globalSeq, item.department_sub ?? '-', item.id ?? '-', item.code ?? '-',
                    String(item.telephone ?? '-'), item.topic ?? '-', item.detail ?? '-',
                    item.requester ?? '-', item.building ?? '-', item.floor ?? '-',
                    item.room ?? '-', item.date ?? '-'
                ];
                if (viewConfig.showStatus) d.push(item.helpdeskStatusName ?? '-');
                const row = sheet.addRow(d);
                styleDataRow(row, colCount, centerCols);
            });

            [8, 20, 12, 14, 14, 22, 30, 18, 14, 10, 12, 16, ...(viewConfig.showStatus ? [18] : [])]
                .forEach((w, i) => { sheet.getColumn(i + 1).width = w; });

        } else {
            /* ═══════ General Tab (Topic / Category / Technician) ═══════ */
            const r1: string[] = ['#', 'ລະຫັດ', 'ເລກ ຊຄທ', 'ເບີໂທ'];
            const r2: string[] = ['', '', '', ''];
            const widths: number[] = [8, 12, 14, 14];

            if (viewConfig.showTopic) { r1.push('ຫົວຂໍ້ເລື່ອງ'); r2.push(''); widths.push(22); }
            r1.push('ລາຍລະອຽດການຮ້ອງຂໍ'); r2.push(''); widths.push(30);

            const reqCol = r1.length + 1;
            r1.push('ພາກສ່ວນຮ້ອງຂໍ', '', '');
            r2.push('ຜູ້ຮ້ອງຂໍ', 'ຝ່າຍ', 'ພະແນກ');
            widths.push(18, 20, 20);

            const locCol = r1.length + 1;
            r1.push('ສະຖານທີ່', '', '');
            r2.push('ຕຶກ', 'ຊັ້ນ', 'ຫ້ອງ');
            widths.push(14, 10, 12);

            const dateCol = r1.length + 1;
            r1.push('ວັນທີຮ້ອງຂໍ'); r2.push(''); widths.push(16);

            if (viewConfig.showStatus) { r1.push('ສະຖານະ'); r2.push(''); widths.push(18); }

            const colCount = r1.length;
            sheet.addRow(r1);
            sheet.addRow(r2);

            let mc = 1;
            for (let i = 0; i < 4; i++) { sheet.mergeCells(1, mc, 2, mc); mc++; }
            if (viewConfig.showTopic) { sheet.mergeCells(1, mc, 2, mc); mc++; }
            sheet.mergeCells(1, mc, 2, mc); mc++;

            sheet.mergeCells(1, reqCol, 1, reqCol + 2);
            sheet.mergeCells(1, locCol, 1, locCol + 2);
            sheet.mergeCells(1, dateCol, 2, dateCol);
            if (viewConfig.showStatus) sheet.mergeCells(1, dateCol + 1, 2, dateCol + 1);

            styleHeaderRows(sheet, colCount);

            const centerCols = new Set([1, 2, 3, 4, locCol, locCol + 1, locCol + 2, dateCol]);
            const exportData = activeIndex === 3
                ? [...data].sort((a, b) => ((a[groupField] as string) || '').localeCompare((b[groupField] as string) || ''))
                : data;
            let prevGroup = '';
            let globalSeq = 0;
            exportData.forEach((item: ReportItem) => {
                const grpVal = (item[groupField] as string) || 'Unknown';
                if (grpVal !== prevGroup) {
                    const count = item._groupTotal ?? groupCounts[grpVal] ?? 0;
                    insertGroupRow(sheet, groupConfig.label, grpVal, count, colCount);
                    prevGroup = grpVal;
                }
                globalSeq++;
                const d: (string | number)[] = [globalSeq, item.id ?? '-', item.code ?? '-', String(item.telephone ?? '-')];
                if (viewConfig.showTopic) d.push(item.topic ?? '-');
                d.push(
                    item.detail ?? '-', item.requester ?? '-',
                    item.department_main ?? '-', item.department_sub ?? '-',
                    item.building ?? '-', item.floor ?? '-', item.room ?? '-',
                    item.date ?? '-'
                );
                if (viewConfig.showStatus) d.push(item.helpdeskStatusName ?? '-');
                const row = sheet.addRow(d);
                styleDataRow(row, colCount, centerCols);
            });

            widths.forEach((w, i) => { sheet.getColumn(i + 1).width = w; });
        }

        const buf = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const fileName = `report_${formatDateLao(new Date()).replace(/\//g, '-')}.xlsx`;
        saveAs(blob, fileName);

        toast.current?.show({
            severity: 'success',
            summary: 'ສຳເລັດ',
            detail: 'ດາວໂຫຼດໄຟລ໌ Excel ສຳເລັດແລ້ວ',
            life: 2500
        });
    }, [data, activeIndex]);

    // ກົດປຸ່ມສົ່ງອອກ → ດາວໂຫຼດ Excel ທັນທີ
    const handleExportClick = () => {
        if (!data || data.length === 0) {
            toast.current?.show({
                severity: 'warn',
                summary: 'ແຈ້ງເຕືອນ',
                detail: 'ກະລຸນາເລືອກຂໍ້ມູນກ່ອນ',
                life: 1100
            });
            return;
        }
        exportToExcel();
    };

    return (
        <div className="report-hd-view grid">
            <Toast ref={toast} position="top-center" />

            <div className="col-12">
                <div className="card">
                    <div>
                        <ReportHeaderControls
                            dateRange={dateRange}
                            setDateRange={setDateRange}
                            onExportClick={handleExportClick}
                        />
                    </div>

                    <div className="mb-3">
                        <TabMenu activeIndex={activeIndex} model={MENU_ITEMS} onTabChange={(e) => setActiveIndex(e.index)} className="custom-report-tabs" />
                    </div>

                    {error && <div className="mb-3 p-3 bg-red-50 text-red-700 border-round">Error: {error}</div>}

                    <ReportTable data={data} activeIndex={activeIndex} />
                </div>
            </div>
        </div>
    );
}
