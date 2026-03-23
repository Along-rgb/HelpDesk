import type ExcelJS from 'exceljs';

export const BORDER_THIN = {
    top: { style: 'thin' as const },
    left: { style: 'thin' as const },
    bottom: { style: 'thin' as const },
    right: { style: 'thin' as const },
};

export const HDR_FILL = {
    type: 'pattern' as const,
    pattern: 'solid' as const,
    fgColor: { argb: 'FF2563EB' },
};

export const GRP_FILL = {
    type: 'pattern' as const,
    pattern: 'solid' as const,
    fgColor: { argb: 'FFF3F4F6' },
};

export const HDR_FONT = {
    bold: true,
    color: { argb: 'FFFFFFFF' },
    name: 'Phetsarath OT',
    size: 11,
};

export const GRP_FONT = { bold: true, name: 'Phetsarath OT', size: 11 };
export const BASE_FONT = { name: 'Phetsarath OT', size: 11 };

export const ALIGN_CENTER: Partial<ExcelJS.Alignment> = {
    vertical: 'middle',
    horizontal: 'center',
    wrapText: true,
};

export const ALIGN_LEFT: Partial<ExcelJS.Alignment> = {
    vertical: 'middle',
    horizontal: 'left',
    wrapText: true,
};

export const ALIGN_CENTER_NOWRAP: Partial<ExcelJS.Alignment> = {
    vertical: 'middle',
    horizontal: 'center',
    wrapText: false,
};

export const ALIGN_LEFT_NOWRAP: Partial<ExcelJS.Alignment> = {
    vertical: 'middle',
    horizontal: 'left',
    wrapText: false,
};

export function styleHeaderRows(sheet: ExcelJS.Worksheet, colCount: number): void {
    [1, 2].forEach((r) => {
        const row = sheet.getRow(r);
        row.height = 28;
        for (let c = 1; c <= colCount; c++) {
            const cell = row.getCell(c);
            cell.fill = HDR_FILL as ExcelJS.FillPattern;
            cell.font = HDR_FONT;
            cell.alignment = ALIGN_CENTER;
            cell.border = BORDER_THIN;
        }
    });
}

export function styleDataRow(
    row: ExcelJS.Row,
    colCount: number,
    centerCols: Set<number>,
): void {
    for (let c = 1; c <= colCount; c++) {
        const cell = row.getCell(c);
        cell.font = BASE_FONT;
        cell.alignment = centerCols.has(c) ? ALIGN_CENTER_NOWRAP : ALIGN_LEFT_NOWRAP;
        cell.border = BORDER_THIN;
    }
}

export function insertGroupRow(
    sheet: ExcelJS.Worksheet,
    label: string,
    value: string,
    count: number,
    colCount: number,
): void {
    const labelText = `${label}: ${value || '(ບໍ່ລະບຸ)'}`;
    const countText = `| ລວມ: (${count}) ລາຍການ`;
    const cells: string[] = new Array(colCount).fill('');
    cells[0] = labelText;
    cells[colCount - 1] = countText;
    const grpRow = sheet.addRow(cells);
    const rowNum = grpRow.number;
    if (colCount > 2) sheet.mergeCells(rowNum, 1, rowNum, colCount - 1);
    grpRow.height = 24;
    for (let c = 1; c <= colCount; c++) {
        const cell = grpRow.getCell(c);
        cell.fill = GRP_FILL as ExcelJS.FillPattern;
        cell.font = GRP_FONT;
        cell.alignment = {
            vertical: 'middle',
            horizontal: c === colCount ? 'right' : 'left',
            wrapText: false,
        };
        cell.border = BORDER_THIN;
    }
}
