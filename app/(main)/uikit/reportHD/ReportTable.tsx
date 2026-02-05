// src/app/reports/ReportTable.tsx
import React, { useMemo, useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ColumnGroup } from 'primereact/columngroup';
import { Row } from 'primereact/row';
import { Tooltip } from 'primereact/tooltip';
import { getGroupConfig, getViewConfig } from './utils/reportConfig';
import { ReportItem } from './types';

interface Props {
    data: ReportItem[];
    activeIndex: number;
}

export const ReportTable = ({ data, activeIndex }: Props) => {
    const groupConfig = useMemo(() => getGroupConfig(activeIndex), [activeIndex]);
    const viewConfig = useMemo(() => getViewConfig(activeIndex), [activeIndex]);
    
    // ✅ State สำหรับควบคุม Paginator
    const [first, setFirst] = useState(0);
    const [rows, setRows] = useState(10); // ค่าเริ่มต้น 10 แถว
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

    const renderTruncateText = (text: string | undefined | null, maxWidth: string = '150px', align: 'left' | 'center' = 'left') => {
        const displayText = text || '-';

        const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
            const element = e.currentTarget;
            if (element.scrollWidth > element.clientWidth) {
                element.setAttribute('data-pr-tooltip', displayText);
                element.style.cursor = 'pointer';
            } else {
                element.removeAttribute('data-pr-tooltip');
                element.style.cursor = 'text'; 
            }
        };

        return (
            <div
                className="custom-tooltip-target"
                onMouseEnter={handleMouseEnter}
                data-pr-position="bottom"
                data-pr-at="center bottom"
                data-pr-my="center top"
                style={{
                    maxWidth: maxWidth,
                    width: 'fit-content',
                    minWidth: '20px', 
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    cursor: 'text',
                    textAlign: align,
                    margin: align === 'center' ? '0 auto' : '0'
                }}
            >
                {displayText}
            </div>
        );
    };

    const rowGroupHeaderTemplate = (rowData: ReportItem) => {
        const field = groupConfig.field as keyof ReportItem;
        const value = (rowData[field] as string);
        const count = groupCounts[value] || 0;

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
            <style>{`
                .custom-large-table .p-datatable-thead > tr > th { 
                    font-size: 14px !important; 
                    font-weight: bold; 
                    padding: 0.75rem 0.5rem !important;
                }
                .custom-large-table .p-datatable-tbody > tr > td { 
                    font-size: 14px !important; 
                    padding: 0.5rem 0.5rem !important;
                }
                .custom-large-table .p-rowgroup-header { background-color: #f8f9fa !important; }

                .white-tooltip .p-tooltip-text {
                    background-color: #ffffff !important;
                    color: #495057 !important;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.15) !important;
                    border: 1px solid #e9ecef;
                    padding: 10px 15px;
                    border-radius: 6px;
                    font-size: 14px;
                    white-space: pre-wrap; 
                    max-width: 400px; 
                }
                .white-tooltip.p-tooltip-bottom .p-tooltip-arrow {
                    border-bottom-color: #d32f2f !important;
                }

                /* ✅ CSS ปรับปรุง Paginator */
                .p-paginator {
                    display: flex;
                    justify-content: center !important; /* จัดกึ่งกลางหน้าจอ */
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 1.5rem; /* ✅ ระยะห่างระหว่าง ข้อความ - ปุ่ม - Dropdown (ขยับให้ใกล้แต่ไม่ติด) */
                    padding: 0.5rem 1rem;
                }

                /* ส่วนข้อความ (เช่น แสดง 1 ถึง 10...) */
                .p-paginator-current {
                    background: transparent;
                    color: #495057;
                    font-weight: bold;
                    margin: 0 !important;
                    padding: 0 !important;
                    /* ไม่ต้องใช้ position absolute แล้ว */
                }

                /* ส่วน Dropdown เลือกจำนวนแถว */
                .p-paginator-rpp-options {
                    margin: 0 !important;
                    /* ไม่ต้องใช้ position absolute แล้ว */
                }

                /* Responsive สำหรับมือถือ */
                @media (max-width: 768px) {
                    .p-paginator {
                        flex-direction: column;
                        gap: 10px;
                    }
                }
            `}</style>
            <Tooltip 
                key={tooltipVersion}
                target=".custom-tooltip-target" 
                className="white-tooltip" 
                mouseTrack={false}
                autoZIndex={true}
                baseZIndex={10000}
                showDelay={300} 
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
                scrollHeight="flex" 
                style={{ minWidth: '100%' }}
                tableStyle={{ minWidth: 'auto' }} 
                emptyMessage={<div className="text-center p-4">ບໍ່ພົບຂໍ້ມູນ</div>}

                // ✅ เพิ่มส่วน Config Paginator
                paginator
                rows={rows}
                first={first}
                onPage={(e) => {
                    setFirst(e.first);
                    setRows(e.rows);
                }}
                rowsPerPageOptions={[10, 25, 50,100]}
                currentPageReportTemplate="ສະແດງ {first} ເຖິງ {last} ຈາກທັງໝົດ {totalRecords} ລາຍການ"
                paginatorTemplate="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
            >
                {/* 1. คอลัมน์ # */}
                <Column header="#" body={(d, options) => options.rowIndex + 1} className="text-center" style={{ width: '40px' }} />

                {/* 2. ถ้าเป็น Tab สังกัด: แสดงคอลัมน์ "แผนก" ก่อน */}
                {viewConfig.isDepartmentTab && (
                     <Column field="department_sub" header="ພະແນກ" body={(d) => renderTruncateText(d.department_sub, '150px')} style={{ minWidth: '120px' }} />
                )}

                {/* 3. คอลัมน์ รหัส */}
                <Column field="code" body={(d) => renderTruncateText(d.code, '100px', 'center')} style={{ width: '90px' }} />    
                
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
                <Column field="building" className="text-center" style={{ minWidth: '160px' }} />
                <Column field="floor" className="text-center" style={{ minWidth: '160px' }} />
                <Column field="room" className="text-center" style={{ minWidth: '160px' }} />               
                
                {/* 8. วันที่ */}
                <Column field="date" className="text-center" style={{ minWidth: '160px' }} />                  
                
                {/* 9. หมายเหตุ */}
                {viewConfig.showNote && 
                    <Column field="note" body={(d: ReportItem) => renderTruncateText(d.note, '150px')} style={{ minWidth: '80px' }} />
                }
            </DataTable>
        </>
    );
};