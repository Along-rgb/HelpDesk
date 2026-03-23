'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ColumnGroup } from 'primereact/columngroup';
import { Row } from 'primereact/row';
import { Tooltip } from 'primereact/tooltip';
import { Image } from 'primereact/image';
import axiosClientsHelpDesk from '@/config/axiosClientsHelpDesk';
import { useUserRoleAndId } from '@/app/store/user/userProfileStore';
import { renderTruncateText } from '../shared/TruncateText';
import { REPORT_TABLE_CSS, WHITE_TOOLTIP_PROPS } from '../shared/reportTableStyles';
import { env } from '@/config/env';
import { getDownloadApiUrl } from '@/utils/downloadFile';
import { fetchReferenceData, getBuildingName, getFloorName, getStatusName } from '@/app/(main)/uikit/shared/referenceDataCache';
import { formatDateTime24h, formatDateISO, formatDateDisplay } from '@/app/(main)/uikit/shared/formatUtils';
import { styleHeaderRows, styleDataRow } from '@/app/(main)/uikit/shared/excelStyles';
import { REPAIR_STAFF_ENDPOINT, COMMENT_IMG_UPLOAD_SEGMENT } from '@/app/(main)/uikit/shared/constants';
import { saveAs } from 'file-saver';
import ExcelJS from 'exceljs';

// --------------- Interfaces ---------------
interface RepairHistoryItem {
    id: number | string;
    code: string;
    telephone: string | number;
    topic: string;
    repairDetail: string;
    repairImages: string[];
    requester: string;
    department_main: string;
    department_sub: string;
    building: string;
    floor: string;
    room: string;
    date: string;
    status: string;
}

// --------------- Image URL helpers ---------------
function buildImgDisplayUrl(filename: string): string {
    if (!filename || typeof filename !== 'string') return '';
    const name = filename.trim().replace(/^\//, '');
    if (!name) return '';
    if (/^https?:\/\//i.test(name)) return getDownloadApiUrl(name, name, 'inline');
    const encoded = encodeURIComponent(name);
    const apiBase = (env.helpdeskApiUrl ?? '').trim().replace(/\/+$/, '');
    if (apiBase) {
        return getDownloadApiUrl(`${apiBase}/uploads/${COMMENT_IMG_UPLOAD_SEGMENT}/${encoded}`, name, 'inline');
    }
    if (env.useHelpdeskProxy) {
        return getDownloadApiUrl(`/api/proxy-helpdesk/uploads/${COMMENT_IMG_UPLOAD_SEGMENT}/${encoded}`, name, 'inline');
    }
    return '';
}

function extractFilename(item: unknown): string {
    if (!item) return '';
    if (typeof item === 'string') return item;
    if (typeof item === 'object' && item !== null) {
        const obj = item as Record<string, unknown>;
        const candidate = obj.hdImg ?? obj.commentImg ?? obj.filename ?? obj.name ?? obj.img;
        if (typeof candidate === 'string' && candidate.length > 0) return candidate;
    }
    return '';
}

// --------------- Data mapping ---------------
function normalizeImages(raw: unknown): string[] {
    if (!raw) return [];

    let entries: unknown[] = [];

    if (Array.isArray(raw)) {
        entries = raw;
    } else if (typeof raw === 'string' && raw.length > 0) {
        const trimmed = raw.trim();
        if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
            try {
                const parsed = JSON.parse(trimmed);
                entries = Array.isArray(parsed) ? parsed : [parsed];
            } catch {
                entries = [trimmed];
            }
        } else {
            entries = [trimmed];
        }
    } else if (typeof raw === 'object') {
        entries = [raw];
    }

    return entries
        .map((e) => extractFilename(e))
        .filter((f) => f.length > 0)
        .map((f) => buildImgDisplayUrl(f))
        .filter((url) => url.length > 0);
}

interface RawRepairApiItem {
    helpdeskRequest?: RawRepairRequest;
    helpdeskStatusId?: number;
    comment?: string;
    commentImg?: unknown;
    [key: string]: unknown;
}

interface RawRepairRequest {
    id?: number | string;
    numberSKT?: string;
    telephone?: string | number;
    buildingId?: number;
    floorId?: number;
    room?: string;
    createdAt?: string;
    ticket?: { title?: string };
    createdBy?: { employee?: { first_name?: string; last_name?: string; tel?: string; department?: { department_name?: string }; division?: { division_name?: string } } };
    [key: string]: unknown;
}

function mapApiToItem(raw: RawRepairApiItem): RepairHistoryItem {
    const req: RawRepairRequest = raw.helpdeskRequest ?? raw;
    const employee = req.createdBy?.employee;
    const firstName = employee?.first_name ?? '';
    const lastName = employee?.last_name ?? '';

    return {
        id: req.id ?? '',
        code: req.numberSKT ?? '',
        telephone: req.telephone ?? employee?.tel ?? '',
        topic: req.ticket?.title ?? '',
        repairDetail: raw.comment ?? '',
        repairImages: normalizeImages(raw.commentImg),
        requester: `${firstName} ${lastName}`.trim(),
        department_main: employee?.department?.department_name ?? '',
        department_sub: employee?.division?.division_name ?? '',
        building: getBuildingName(req.buildingId),
        floor: getFloorName(req.floorId),
        room: req.room ?? '',
        date: req.createdAt ?? '',
        status: getStatusName(raw.helpdeskStatusId),
    };
}

// =============== Component ===============
export default function RepairHistoryPage() {
    const [dateRange, setDateRange] = useState<Date[] | null>(null);
    const [data, setData] = useState<RepairHistoryItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [first, setFirst] = useState(0);
    const [rows, setRows] = useState(10);
    const [tooltipVersion, setTooltipVersion] = useState(0);

    const toast = useRef<Toast>(null);
    const { currentUserId } = useUserRoleAndId();

    // --------------- Stable date memo ---------------
    const startTs = dateRange?.[0] instanceof Date ? dateRange[0].getTime() : 0;
    const endTs = dateRange?.[1] instanceof Date ? dateRange[1].getTime() : 0;

    const stableDateRange = useMemo(() => {
        if (!startTs || !endTs) return null;
        return [new Date(startTs), new Date(endTs)] as const;
    }, [startTs, endTs]);

    // --------------- Fetch data ---------------
    useEffect(() => {
        const controller = new AbortController();

        const fetchData = async () => {
            if (!stableDateRange) {
                setData([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                await fetchReferenceData();

                const params = {
                    startDate: formatDateISO(stableDateRange[0]),
                    endDate: formatDateISO(stableDateRange[1]),
                };

                const response = await axiosClientsHelpDesk.get(REPAIR_STAFF_ENDPOINT, {
                    params,
                    signal: controller.signal,
                });

                const rawList: Record<string, any>[] = Array.isArray(response.data)
                    ? response.data
                    : [];

                const items: RepairHistoryItem[] = rawList.map((raw) => mapApiToItem(raw));

                if (items.length > 1) {
                    items.sort((a, b) => {
                        const da = a.date || '';
                        const db = b.date || '';
                        return da > db ? -1 : da < db ? 1 : 0;
                    });
                }

                for (let i = 0, len = items.length; i < len; i++) {
                    items[i].date = formatDateTime24h(items[i].date);
                }

                if (!controller.signal.aborted) {
                    setData(items);
                }
            } catch (err: unknown) {
                const e = err as { name?: string; code?: string };
                if (!controller.signal.aborted && e.name !== 'CanceledError' && e.code !== 'ERR_CANCELED') {
                    setError('ເກີດຂໍ້ຜິດພາດໃນການດຶງຂໍ້ມູນ');
                    setData([]);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        fetchData();
        return () => { controller.abort(); };
    }, [stableDateRange, currentUserId]);

    // --------------- Tooltip refresh ---------------
    useEffect(() => {
        const timer = setTimeout(() => {
            setTooltipVersion((prev) => prev + 1);
        }, 100);
        return () => clearTimeout(timer);
    }, [data]);

    const renderImages = (images: string[] | undefined | null) => {
        if (!images || images.length === 0) {
            return <span className="text-color-secondary">-</span>;
        }
        return (
            <div className="flex align-items-center gap-1 flex-wrap" style={{ maxWidth: '120px' }}>
                {images.slice(0, 2).map((src, idx) => (
                    <Image
                        key={idx}
                        src={src}
                        alt={`repair-img-${idx}`}
                        width="32"
                        height="32"
                        preview
                        imageStyle={{ objectFit: 'cover', borderRadius: '4px' }}
                    />
                ))}
                {images.length > 2 && (
                    <span className="text-primary text-xs font-semibold">+{images.length - 2}</span>
                )}
            </div>
        );
    };

    // --------------- Excel Export ---------------
    const exportToExcel = useCallback(async () => {
        if (!data || data.length === 0) return;

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('ປະຫວັດການສ້ອມແປງ', { views: [{ showGridLines: true }] });

        // Row 1: Group headers (removed ລາຍລະອຽດການສ້ອມແປງ and ສະຖານະ)
        const r1 = ['#', 'ລະຫັດ', 'ເລກ ຊຄທ', 'ເບີໂທ', 'ຫົວຂໍ້ເລື່ອງ', 'ພາກສ່ວນຮ້ອງຂໍ', '', '', 'ສະຖານທີ່', '', '', 'ວັນທີຮ້ອງຂໍ'];
        // Row 2: Sub-headers
        const r2 = ['', '', '', '', '', 'ຜູ້ຮ້ອງຂໍ', 'ຝ່າຍ', 'ພະແນກ', 'ຕຶກ', 'ຊັ້ນ', 'ຫ້ອງ', ''];

        const colCount = r1.length;
        sheet.addRow(r1);
        sheet.addRow(r2);

        // Merge: rowSpan=2 for single columns (#, ລະຫັດ, ເລກ ຊຄທ, ເບີໂທ, ຫົວຂໍ້ເລື່ອງ, ວັນທີຮ້ອງຂໍ)
        [1, 2, 3, 4, 5, 12].forEach((c) => sheet.mergeCells(1, c, 2, c));
        // Merge: colSpan group headers
        sheet.mergeCells(1, 6, 1, 8);   // ພາກສ່ວນຮ້ອງຂໍ
        sheet.mergeCells(1, 9, 1, 11);  // ສະຖານທີ່

        styleHeaderRows(sheet, colCount);

        const centerCols = new Set([1, 2, 3, 4, 9, 10, 11, 12]);

        data.forEach((item, idx) => {
            const d: (string | number)[] = [
                idx + 1,
                item.id ?? '-',
                item.code ?? '-',
                String(item.telephone ?? '-'),
                item.topic ?? '-',
                item.requester ?? '-',
                item.department_main ?? '-',
                item.department_sub ?? '-',
                item.building ?? '-',
                item.floor ?? '-',
                item.room ?? '-',
                item.date ?? '-',
            ];
            const row = sheet.addRow(d);
            styleDataRow(row, colCount, centerCols);
        });

        // Column widths
        [8, 12, 14, 14, 22, 18, 20, 20, 14, 10, 12, 18].forEach((w, i) => {
            sheet.getColumn(i + 1).width = w;
        });

        const buf = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const fileName = `repair_history_${formatDateDisplay(new Date()).replace(/\//g, '-')}.xlsx`;
        saveAs(blob, fileName);

        toast.current?.show({
            severity: 'success',
            summary: 'ສຳເລັດ',
            detail: 'ດາວໂຫຼດໄຟລ໌ Excel ສຳເລັດແລ້ວ',
            life: 2500,
        });
    }, [data]);

    const handleExportClick = () => {
        if (!data || data.length === 0) {
            toast.current?.show({
                severity: 'warn',
                summary: 'ແຈ້ງເຕືອນ',
                detail: 'ບໍ່ມີຂໍ້ມູນສຳລັບສົ່ງອອກ',
                life: 1100,
            });
            return;
        }
        exportToExcel();
    };

    // --------------- ColumnGroup Header ---------------
    const headerGroup = (
        <ColumnGroup>
            <Row>
                <Column header="#" rowSpan={2} style={{ width: '40px', textAlign: 'center' }} />
                <Column header="ລະຫັດ" rowSpan={2} style={{ width: '90px', textAlign: 'center' }} />
                <Column header="ເລກ ຊຄທ" rowSpan={2} style={{ width: '110px', textAlign: 'center' }} />
                <Column header="ເບີໂທ" rowSpan={2} style={{ width: '110px', textAlign: 'center' }} />
                <Column header="ຫົວຂໍ້ເລື່ອງ" rowSpan={2} style={{ minWidth: '100px' }} />
                <Column header="ພາກສ່ວນຮ້ອງຂໍ" colSpan={3} headerStyle={{ textAlign: 'center' }} />
                <Column header="ສະຖານທີ່" colSpan={3} headerStyle={{ textAlign: 'center' }} />
                <Column header="ວັນທີຮ້ອງຂໍ" rowSpan={2} style={{ minWidth: '120px', textAlign: 'center' }} />
            </Row>
            <Row>
                <Column header="ຜູ້ຮ້ອງຂໍ" style={{ minWidth: '80px' }} />
                <Column header="ຝ່າຍ" style={{ minWidth: '80px' }} />
                <Column header="ພະແນກ" style={{ minWidth: '80px' }} />
                <Column header="ຕຶກ" style={{ minWidth: '70px' }} />
                <Column header="ຊັ້ນ" style={{ minWidth: '70px' }} />
                <Column header="ຫ້ອງ" style={{ minWidth: '70px' }} />
            </Row>
        </ColumnGroup>
    );

    // --------------- JSX ---------------
    return (
        <div className="layout-dashboard p-4">
            <Toast ref={toast} position="top-center" />

            <div className="card p-4 mb-4">
                <div className="flex flex-column md:flex-row justify-content-between align-items-center mb-0">
                    <h5 className="m-0 text-900 font-bold mb-3 md:mb-0">ປະຫວັດການສ້ອມແປງ</h5>
                    <div className="flex align-items-center gap-3 w-full md:w-auto">
                        <span className="font-bold text-700 white-space-nowrap">ຊ່ວງເວລາ:</span>
                        <div className="relative w-full md:w-20rem">
                            <Calendar
                                value={dateRange}
                                onChange={(e) => setDateRange(e.value as Date[] | null)}
                                selectionMode="range"
                                readOnlyInput
                                placeholder="ເລືອກ ວັນທີ/ເດືອນ/ປີ"
                                showIcon
                                className="w-full"
                                inputClassName="p-inputtext-sm"
                                dateFormat="dd/mm/yy"
                            />
                            {dateRange && dateRange.length > 0 && (
                                <i
                                    className="pi pi-times absolute cursor-pointer text-500 hover:text-700 bg-white border-circle"
                                    style={{ right: '3rem', top: '50%', transform: 'translateY(-50%)', padding: '2px', zIndex: 1 }}
                                    onClick={(e) => { e.stopPropagation(); setDateRange(null); }}
                                />
                            )}
                        </div>
                        <Button
                            label="ດາວໂຫຼດ File "
                            icon="pi pi-file-excel"
                            severity="success"
                            size="small"
                            onClick={handleExportClick}
                        />
                    </div>
                </div>
            </div>

            {error && <div className="mb-3 p-3 bg-red-50 text-red-700 border-round">{error}</div>}

            <div className="card p-4">
                <style>{REPORT_TABLE_CSS}</style>

                <Tooltip
                    key={tooltipVersion}
                    target=".custom-tooltip-target"
                    {...WHITE_TOOLTIP_PROPS}
                />

                <DataTable
                        value={data}
                        headerColumnGroup={headerGroup}
                        showGridlines
                        stripedRows
                        className="p-datatable-sm custom-large-table"
                        scrollable
                        scrollHeight="650px"
                        responsiveLayout="scroll"
                        style={{ minWidth: '100%' }}
                        tableStyle={{ minWidth: 'auto' }}
                        emptyMessage={<div className="text-center p-4">ບໍ່ພົບຂໍ້ມູນ</div>}
                        paginator
                        rows={rows}
                        first={first}
                        onPage={(e) => {
                            setFirst(e.first);
                            setRows(e.rows);
                        }}
                        rowsPerPageOptions={[10, 25, 50, 100]}
                        currentPageReportTemplate="ສະແດງ {first} ເຖິງ {last} ຈາກທັງໝົດ {totalRecords} ລາຍການ"
                        paginatorTemplate="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
                    >
                        <Column
                            header="#"
                            body={(_d, options) => (
                                <span style={{ whiteSpace: 'nowrap', display: 'inline-block', minWidth: '24px', textAlign: 'center' }}>
                                    {options.rowIndex + 1}
                                </span>
                            )}
                            className="text-center"
                            style={{ width: '50px', minWidth: '50px' }}
                        />
                        <Column field="id" body={(d: RepairHistoryItem) => renderTruncateText(String(d.id), '100px', 'center')} style={{ width: '90px' }} />
                        <Column field="code" body={(d: RepairHistoryItem) => renderTruncateText(d.code, '110px', 'center')} style={{ width: '110px' }} />
                        <Column field="telephone" body={(d: RepairHistoryItem) => renderTruncateText(String(d.telephone), '110px', 'center')} style={{ width: '110px' }} />
                        <Column field="topic" body={(d: RepairHistoryItem) => renderTruncateText(d.topic, '200px')} style={{ minWidth: '100px' }} />
                        <Column field="requester" body={(d: RepairHistoryItem) => renderTruncateText(d.requester, '150px')} style={{ minWidth: '80px' }} />
                        <Column field="department_main" body={(d: RepairHistoryItem) => renderTruncateText(d.department_main, '150px')} style={{ minWidth: '80px' }} />
                        <Column field="department_sub" body={(d: RepairHistoryItem) => renderTruncateText(d.department_sub, '150px')} style={{ minWidth: '80px' }} />
                        <Column field="building" body={(d: RepairHistoryItem) => renderTruncateText(d.building, '140px', 'center')} className="text-center" style={{ minWidth: '100px' }} />
                        <Column field="floor" body={(d: RepairHistoryItem) => renderTruncateText(d.floor, '120px', 'center')} className="text-center" style={{ minWidth: '80px' }} />
                        <Column field="room" body={(d: RepairHistoryItem) => renderTruncateText(d.room, '100px', 'center')} className="text-center" style={{ minWidth: '70px' }} />
                        <Column field="date" body={(d: RepairHistoryItem) => renderTruncateText(d.date, '140px', 'center')} className="text-center" style={{ minWidth: '130px' }} />
                    </DataTable>
            </div>
        </div>
    );
}
