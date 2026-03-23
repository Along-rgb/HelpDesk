'use client';
// src/app/reports/ReportTable.tsx
import React, { useMemo, useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ColumnGroup } from 'primereact/columngroup';
import { Row } from 'primereact/row';
import { Tooltip } from 'primereact/tooltip';
import { getGroupConfig, getViewConfig } from '../utils/reportConfig';
import { ReportItem } from '../types';
import { renderTruncateText } from '../../shared/TruncateText';
import { REPORT_TABLE_CSS, WHITE_TOOLTIP_PROPS } from '../../shared/reportTableStyles';

interface Props {
    data: ReportItem[];
    activeIndex: number;
}

export const ReportTable = ({ data, activeIndex }: Props) => {
    const groupConfig = useMemo(() => getGroupConfig(activeIndex), [activeIndex]);
    const viewConfig = useMemo(() => getViewConfig(activeIndex), [activeIndex]);
    
    const [first, setFirst] = useState(0);
    const [rows, setRows] = useState(10);
    const [tooltipVersion, setTooltipVersion] = useState(0);

    const groupCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        data.forEach((item) => {
            const key = (item[groupConfig.field as keyof ReportItem] as string) || 'Unknown';
            counts[key] = (counts[key] || 0) + 1;
        });
        return counts;
    }, [data, groupConfig.field]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setTooltipVersion(prev => prev + 1);
        }, 100);
        return () => clearTimeout(timer);
    }, [data, activeIndex]);

    const rowGroupHeaderTemplate = (rowData: ReportItem) => {
        const field = groupConfig.field as keyof ReportItem;
        const value = (rowData[field] as string);
        const count = rowData._groupTotal ?? groupCounts[value] ?? 0;

        return (
            <div className="flex align-items-center justify-content-between w-full pr-4">
                <span className="font-bold text-lg text-900">{groupConfig.label}: {value || "(ບໍ່ລະບຸ)"}</span>
                <span className="text-700 font-bold">| ລວມ: ({count}) ລາຍການ</span>
            </div>
        );
    };

    const headerGroupGeneral = (
        <ColumnGroup>
            <Row>
                <Column header="#" rowSpan={2} style={{ width: '40px', textAlign: 'center' }} />
                <Column header="ລະຫັດ" rowSpan={2} style={{ width: '90px', textAlign: 'center' }} />
                <Column header="ເລກ ຊຄທ" rowSpan={2} style={{ width: '110px', textAlign: 'center' }} />
                <Column header="ເບີໂທ" rowSpan={2} style={{ width: '110px', textAlign: 'center' }} />
                {viewConfig.showTopic && <Column header="ຫົວຂໍ້ເລື່ອງ" rowSpan={2} style={{ minWidth: '100px' }} />}   
                <Column header="ລາຍລະອຽດການຮ້ອງຂໍ" rowSpan={2} style={{ minWidth: '150px' }} />
                
                <Column header="ພາກສ່ວນຮ້ອງຂໍ" colSpan={3} headerStyle={{ textAlign: 'center' }} />
                <Column header="ສະຖານທີ່" colSpan={3} headerStyle={{ textAlign: 'center' }} />            
                <Column header="ວັນທີຮ້ອງຂໍ" rowSpan={2} style={{ minWidth: '120px', textAlign: 'center' }} />     
                
                {viewConfig.showNote && 
                    <Column header="ໝາຍເຫດ" rowSpan={2} style={{ minWidth: '80px', textAlign: 'center' }} />
                }
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

    const headerGroupDepartment = (
        <ColumnGroup>
            <Row>
                <Column header="#" rowSpan={2} style={{ width: '40px', textAlign: 'center' }} />
                <Column header="ພະແນກ" rowSpan={2} style={{ minWidth: '120px', textAlign: 'center' }} />
                <Column header="ລະຫັດ" rowSpan={2} style={{ width: '90px', textAlign: 'center' }} />
                <Column header="ເລກ ຊຄທ" rowSpan={2} style={{ width: '110px', textAlign: 'center' }} />
                <Column header="ເບີໂທ" rowSpan={2} style={{ width: '110px', textAlign: 'center' }} />
                <Column header="ຫົວຂໍ້ເລື່ອງ" rowSpan={2} style={{ minWidth: '120px' }} />
                <Column header="ລາຍລະອຽດການຮ້ອງຂໍ" rowSpan={2} style={{ minWidth: '150px' }} />
                
                <Column header="ຜູ້ຮ້ອງຂໍ" rowSpan={2} style={{ minWidth: '100px' }} />
                
                <Column header="ສະຖານທີ່" colSpan={3} headerStyle={{ textAlign: 'center' }} />            
                
                <Column header="ວັນທີຮ້ອງຂໍ" rowSpan={2} style={{ minWidth: '120px', textAlign: 'center' }} />     
                
                {viewConfig.showNote && 
                    <Column header="ໝາຍເຫດ" rowSpan={2} style={{ minWidth: '80px', textAlign: 'center' }} />
                }
            </Row>
            <Row>
                <Column header="ຕຶກ" style={{ minWidth: '70px' }} />
                <Column header="ຊັ້ນ" style={{ minWidth: '70px' }} />
                <Column header="ຫ້ອງ" style={{ minWidth: '70px' }} />
            </Row>
        </ColumnGroup>
    );

    return (
        <>
            <style>{REPORT_TABLE_CSS}</style>
            <Tooltip
                key={tooltipVersion}
                target=".custom-tooltip-target"
                {...WHITE_TOOLTIP_PROPS}
            />

            <DataTable
                value={data}
                headerColumnGroup={viewConfig.isDepartmentTab ? headerGroupDepartment : headerGroupGeneral}
                rowGroupMode="subheader"
                groupRowsBy={groupConfig.field}
                rowGroupHeaderTemplate={rowGroupHeaderTemplate}
                sortMode="single"
                sortField={groupConfig.field}
                sortOrder={1}
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
                {/* 1. คอลัมน์ # */}
                <Column header="#" body={(d, options) => (
                    <span style={{ whiteSpace: 'nowrap', display: 'inline-block', minWidth: '24px', textAlign: 'center' }}>{options.rowIndex + 1}</span>
                )} className="text-center" style={{ width: '50px', minWidth: '50px' }} />

                {/* 2. ถ้าเป็น Tab สังกัด: แสดงคอลัมน์ "แผนก" ก่อน */}
                {viewConfig.isDepartmentTab && (
                     <Column field="department_sub" header="ພະແນກ" body={(d) => renderTruncateText(d.department_sub, '150px')} style={{ minWidth: '120px' }} />
                )}

                {/* 3. คอลัมน์ ລະຫັດ (Ticket ID) */}
                <Column field="id" body={(d) => renderTruncateText(String(d.id), '100px', 'center')} style={{ width: '90px' }} />

                {/* 3.1 คอลัมน์ ເລກ ຊຄທ (numberSKT) */}
                <Column field="code" body={(d) => renderTruncateText(d.code, '110px', 'center')} style={{ width: '110px' }} />

                {/* 3.2 คอลัมน์ ເບີໂທ (telephone) */}
                <Column field="telephone" body={(d) => renderTruncateText(String(d.telephone), '110px', 'center')} style={{ width: '110px' }} />    
                
                {/* 4. คอลัมน์ หัวข้อ */}
                {(viewConfig.showTopic || viewConfig.isDepartmentTab) && 
                    <Column field="topic" body={(d) => renderTruncateText(d.topic, '200px')} style={{ minWidth: '100px' }} />
                }

                {/* 5. คอลัมน์ รายละเอียด */}
                <Column field="detail" body={(d: ReportItem) => renderTruncateText(d.detail, '400px')} style={{ minWidth: '150px' }}/>                
                
                {/* 6. Logic การแสดง ผู้ร้องขอ/ฝ่าย */}
                {viewConfig.isDepartmentTab ? (
                    <Column field="requester" header="ຜູ້ຮ້ອງຂໍ" body={(d) => renderTruncateText(d.requester, '150px')} style={{ minWidth: '100px' }} />
                ) : (
                    [
                        <Column key="req" field="requester" body={(d: ReportItem) => renderTruncateText(d.requester, '150px')} style={{ minWidth: '80px' }} />,
                        <Column key="dept_main" field="department_main" body={(d: ReportItem) => renderTruncateText(d.department_main, '150px')} style={{ minWidth: '80px' }} />,
                        <Column key="dept_sub" field="department_sub" body={(d: ReportItem) => renderTruncateText(d.department_sub, '150px')} style={{ minWidth: '80px' }} />
                    ]
                )}

                {/* 7. กลุ่มสถานที่ */}
                <Column field="building" body={(d: ReportItem) => renderTruncateText(d.building, '140px', 'center')} className="text-center" style={{ minWidth: '100px' }} />
                <Column field="floor" body={(d: ReportItem) => renderTruncateText(d.floor, '120px', 'center')} className="text-center" style={{ minWidth: '80px' }} />
                <Column field="room" body={(d: ReportItem) => renderTruncateText(d.room, '100px', 'center')} className="text-center" style={{ minWidth: '70px' }} />               
                
                {/* 8. วันที่ */}
                <Column field="date" body={(d: ReportItem) => renderTruncateText(d.date, '140px', 'center')} className="text-center" style={{ minWidth: '130px' }} />                  
                
                {/* 9. หมายเหตุ */}
                {viewConfig.showNote && 
                    <Column field="note" body={(d: ReportItem) => renderTruncateText(d.note, '150px')} style={{ minWidth: '80px' }} />
                }
            </DataTable>
        </>
    );
};