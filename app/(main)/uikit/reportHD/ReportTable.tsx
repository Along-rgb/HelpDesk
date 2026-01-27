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

    const headerGroup = (
        <ColumnGroup>
            <Row>
                <Column header="#" rowSpan={2} style={{ width: '40px', textAlign: 'center' }} />
                <Column header="ລະຫັດ" rowSpan={2} style={{ width: '90px', textAlign: 'center' }} />

                {viewConfig.showCategory && <Column header="ໝວດໝູ່" rowSpan={2} style={{ minWidth: '80px' }} />}
                {viewConfig.showTopic && <Column header="ຫົວຂໍ້ເລື່ອງ" rowSpan={2} style={{ minWidth: '100px' }} />}   

                <Column header="ລາຍລະອຽດການຮ້ອງຂໍ" rowSpan={2} style={{ minWidth: '150px' }} />
                <Column header="ຜູ້ຮັບຜິດຊອບ" rowSpan={2} style={{ minWidth: '100px', textAlign: 'center' }} />
                <Column header="ພາກສ່ວນຮ້ອງຂໍ" colSpan={3} headerStyle={{ textAlign: 'center' }} />
                <Column header="ສະຖານທີ່" colSpan={3} headerStyle={{ textAlign: 'center' }} />        
                
                {/* ✅ 1. ປັບວັນທີໃຫ້ກວ້າງຂຶ້ນໃນ Header */}
                <Column header="ວັນທີຮ້ອງຂໍ" rowSpan={2} style={{ minWidth: '120px', textAlign: 'center' }} />     
                <Column header="ໝາຍເຫດ" rowSpan={2} style={{ minWidth: '80px', textAlign: 'center' }} />
            </Row>
            <Row>
                <Column header="ຜູ້ຮ້ອງຂໍ" style={{ minWidth: '80px' }} />
                <Column header="ຝ່າຍ" style={{ minWidth: '80px' }} />
                <Column header="ພະແນກ" style={{ minWidth: '80px' }} />  
                             
                {/* ✅ 2. ປັບ ສະຖານທີ່ (ຕຶກ/ຊັ້ນ/ຫ້ອງ) ໃຫ້ກວ້າງຂຶ້ນໃນ Header */}
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
                headerColumnGroup={headerGroup}
                rowGroupMode="subheader"
                groupRowsBy={groupConfig.field}
                rowGroupHeaderTemplate={rowGroupHeaderTemplate}
                sortMode="single"
                sortField={groupConfig.field}
                sortOrder={1}
                showGridlines
                stripedRows
                paginator rows={25}
                className="p-datatable-sm custom-large-table"  
                scrollable 
                scrollHeight="flex" 
                style={{ minWidth: '100%' }}
                
                tableStyle={{ minWidth: 'auto' }} 

                emptyMessage={<div className="text-center p-4">ບໍ່ພົບຂໍ້ມູນ</div>}
            >
                <Column header="#" body={(d, options) => options.rowIndex + 1} className="text-center" style={{ width: '40px' }} />
                <Column field="code" body={(d) => renderTruncateText(d.code, '100px', 'center')} style={{ width: '90px' }} />
                
                {viewConfig.showCategory && 
                    <Column field="category" body={(d) => renderTruncateText(d.category, '150px')} style={{ minWidth: '80px' }} />
                }
                
                {viewConfig.showTopic && 
                    <Column field="topic" body={(d) => renderTruncateText(d.topic, '200px')} style={{ minWidth: '100px' }} />
                }

                <Column field="detail" body={(d: ReportItem) => renderTruncateText(d.detail, '400px')} style={{ minWidth: '150px' }}/>        
                <Column field="technician" body={(d: ReportItem) => renderTruncateText(d.technician, '150px', 'center')} className="text-blue-600 font-medium" style={{ minWidth: '100px' }} />            
                <Column field="requester" body={(d) => renderTruncateText(d.requester, '150px')} style={{ minWidth: '80px' }} />                     
                {/* ✅ แก้ไข: กำหนด max-width เป็น 150px ตามที่ต้องการ */}
                <Column field="department_main" body={(d: ReportItem) => renderTruncateText(d.department_main, '150px')} style={{ minWidth: '80px' }} /> 
                <Column field="department_sub" body={(d: ReportItem) => renderTruncateText(d.department_sub, '150px')} style={{ minWidth: '80px' }} />        
                <Column field="building" className="text-center" style={{ minWidth: '160px' }} />
                <Column field="floor" className="text-center" style={{ minWidth: '160px' }} />
                <Column field="room" className="text-center" style={{ minWidth: '160px' }} />               
                <Column field="date" className="text-center" style={{ minWidth: '160px' }} />                  
                <Column field="note" body={(d: ReportItem) => renderTruncateText(d.note, '150px')} style={{ minWidth: '80px' }} />
            </DataTable>
        </>
    );
};