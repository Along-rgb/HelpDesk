// src/app/reports/page.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { TabMenu } from 'primereact/tabmenu';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ColumnGroup } from 'primereact/columngroup';
import { Row } from 'primereact/row';

// เรียกใช้ Hook ที่เราสร้างขึ้น
import { useReportData } from './hooks/useReportData';

export default function ReportHD() {
    // --- 1. State UI ---
    const [dateRange, setDateRange] = useState<Date[] | any>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    
    // --- 2. Logic & Data (Clean Code: เหลือบรรทัดเดียว) ---
    const { data: reportData, loading, error } = useReportData(activeIndex, dateRange);

    const items = [
        { label: 'ແຍກຕາມຫົວຂໍ້ເລື່ອງ' },
        { label: 'ແຍກຕາມໝວດໝູ່' },
        { label: 'ແຍກຕາມສັງກັດ' },
        { label: 'ແຍກຕາມວິຊາການຊ່າງ' }
    ];

    // --- 3. View Configuration ---
    const viewConfig = useMemo(() => ({
        isDepartmentTab: activeIndex === 2,
        showCategory: false, 
        showDepartmentCol: activeIndex === 2,
        showTopic: activeIndex !== 0 
    }), [activeIndex]);

    // --- 4. Render Helpers ---
    const renderHeaderGroup = () => (
        <ColumnGroup>
            <Row>
                <Column header="#" rowSpan={2} style={{ width: '50px', textAlign: 'center' }} />
                {viewConfig.showCategory && <Column header="ໝວດໝູ່" rowSpan={2} style={{ width: '120px' }} />}
                {viewConfig.showDepartmentCol && <Column header="ພະແນກ" rowSpan={2} style={{ width: '120px' }} />}
                <Column header="ລະຫັດ" rowSpan={2} style={{ width: '80px' }} />
                {viewConfig.showTopic && <Column header="ຫົວຂໍ້ເລື່ອງ" rowSpan={2} style={{ minWidth: '150px' }} />}
                <Column header="ລາຍລະອຽດການຮ້ອງຂໍ" rowSpan={2} style={{ minWidth: '180px' }} />
                
                {viewConfig.isDepartmentTab ? (
                    <Column header="ຜູ້ຮ້ອງຂໍ" rowSpan={2} style={{ width: '120px' }} />
                ) : (
                    <Column header="ພາກສ່ວນຮ້ອງຂໍ" colSpan={3} />
                )}
                
                <Column header="ສະຖານທີ່" colSpan={3} />        
                <Column header="ວັນທີຮ້ອງຂໍ" rowSpan={2} style={{ width: '100px' }} />
                <Column header="ໝາຍເຫດ" rowSpan={2} style={{ width: '80px' }} />
            </Row>
            <Row>
                {!viewConfig.isDepartmentTab && <Column header="ຜູ້ຮ້ອງຂໍ" style={{ width: '100px' }} />}
                {!viewConfig.isDepartmentTab && <Column header="ຝ່າຍ" style={{ width: '100px' }} />}
                {!viewConfig.isDepartmentTab && <Column header="ພະແນກ" style={{ width: '100px' }} />}
                <Column header="ຕຶກ" style={{ width: '60px' }} />
                <Column header="ຊັ້ນ" style={{ width: '50px' }} />
                <Column header="ຫ້ອງ" style={{ width: '50px' }} />
            </Row>
        </ColumnGroup>
    );

    // --- 5. Main Render ---
    return (
        <div className="report-hd-view grid">
            <div className="col-12">
                <div className="card">
                    {/* Header Controls */}
                    <div className="flex flex-column md:flex-row justify-content-between align-items-center mb-4">
                        <h5 className="m-0 text-900 font-bold mb-3 md:mb-0">
                            ລາຍງານ-ການແຈ້ງບັນຫາ ແລະ ການຮ້ອງຂໍບໍລິການ
                        </h5>
                        <div className="flex align-items-center gap-3 w-full md:w-auto">
                            <span className="font-bold text-700 white-space-nowrap">ຊ່ວງເວລາ:</span>
                            
                            {/* START: แก้ไขส่วน Calendar ให้มีปุ่ม Clear ด้านใน */}
                            <div className="relative w-full md:w-20rem">
                                <Calendar
                                    value={dateRange}
                                    onChange={(e) => setDateRange(e.value)}
                                    selectionMode="range"
                                    readOnlyInput
                                    placeholder="ເລືອກ"
                                    showIcon
                                    className="w-full"
                                    inputClassName="p-inputtext-sm"
                                />
                                {/* ปุ่มกากบาท (X) จะแสดงเมื่อมีค่า dateRange */}
                                {(dateRange && dateRange.length > 0) && (
                                    <i 
                                        className="pi pi-times absolute cursor-pointer text-500 hover:text-700 bg-white border-circle"
                                        style={{ 
                                            right: '3rem', // เว้นที่ให้ปุ่มปฏิทินขวาสุด (ประมาณ 2.5-3rem)
                                            top: '50%', 
                                            transform: 'translateY(-50%)',
                                            padding: '2px', // เพิ่มพื้นที่กดเล็กน้อย
                                            zIndex: 1
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation(); // ป้องกันไม่ให้ Calendar เด้งเปิดเมื่อกดลบ
                                            setDateRange(null);
                                        }}
                                    />
                                )}
                            </div>
                            {/* END: จบส่วนแก้ไข */}

                            <Button label="ສົ່ງອອກ" icon="pi pi-file-excel" severity="success" size="small" />
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="mb-3">
                        <TabMenu
                            model={items}
                            activeIndex={activeIndex}
                            onTabChange={(e) => setActiveIndex(e.index)}
                            className="custom-tabmenu"
                        />
                    </div>

                    {/* Error Handling UI */}
                    {error && (
                        <div className="mb-3 p-3 border-round bg-red-50 text-red-700 border-1 border-red-200 flex align-items-center">
                            <i className="pi pi-exclamation-circle mr-2 text-xl"></i>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Table */}
                    <DataTable
                        key={activeIndex}
                        value={reportData}
                        headerColumnGroup={renderHeaderGroup()}
                        showGridlines
                        stripedRows
                        className="p-datatable-sm"
                        tableStyle={{ minWidth: '100%' }}
                        paginator
                        rows={25}
                        rowsPerPageOptions={[10, 25, 50]}
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown CurrentPageReport"
                        currentPageReportTemplate="ສະແດງ {first} ເຖິງ {last} ຈາກທັງໝົດ {totalRecords} ລາຍການ"
                        emptyMessage={
                            <div className="flex flex-column align-items-center justify-content-center p-5">
                                <i className="pi pi-folder-open text-4xl text-gray-400 mb-3"></i>
                                <span className="font-medium text-gray-500">ບໍ່ພົບຂໍ້ມູນ (No Data Found)</span>
                            </div>
                        }
                    >
                        <Column field="id" className="text-center" />
                        {viewConfig.showCategory && <Column field="category" />}
                        {viewConfig.showDepartmentCol && <Column field="department" />}
                        <Column field="code" />
                        {viewConfig.showTopic && <Column field="topic" />}
                        <Column field="detail" />           
                        {/* Dynamic Columns */}
                        <Column field="requester" />
                        {!viewConfig.isDepartmentTab && <Column field="department_main" />}
                        {!viewConfig.isDepartmentTab && <Column field="department_sub" />}
                        <Column field="building" />
                        <Column field="floor" />
                        <Column field="room" />
                        <Column field="date" className="text-center" />
                        <Column field="note" />
                    </DataTable>
                </div>
            </div>
        </div>
    );
}