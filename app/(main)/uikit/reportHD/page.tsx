// src/app/reports/page.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { TabMenu } from 'primereact/tabmenu';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { useReportData } from './hooks/useReportData';
import { ReportHeaderControls } from './ReportHeaderControls';
import { ReportTable } from './ReportTable';
import { MENU_ITEMS } from './utils/reportConfig';

export default function ReportHD() {
    // Mock User Data
    const currentUser = {
        fullname: "ທ້າວ ສົມດີ ມີໄຊ",
        department: "ເຕັກໂນໂລຊີ ແລະ ຂໍ້ມູນຂ່າວສານ",
        division: "ພັດທະນາລະບົບ",
        phone: "020 9988 7766"
    };

    // State
    const [dateRange, setDateRange] = useState<Date[] | any>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [printDate, setPrintDate] = useState<Date>(new Date());
    
    // State ສຳລັບເປີດ/ປິດ Dialog ທາງເລືອກ
    const [showExportDialog, setShowExportDialog] = useState(false);
    const toast = useRef<Toast>(null);
    const { data, error } = useReportData(activeIndex, dateRange);

    useEffect(() => {
        setPrintDate(new Date());
    }, []);

    // Function: ກົດປຸ່ມສົ່ງອອກ (ຂັ້ນຕອນທີ 1: ກວດສອບຂໍ້ມູນກ່ອນ)
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
        // ຖ້າມີຂໍ້ມູນ -> ເປີດ Dialog ໃຫ້ເລືອກ
        setShowExportDialog(true);
    };

    // Function: ສັ່ງ Print ຫຼື PDF
    const executePrint = (isPdfMode: boolean) => {
        setShowExportDialog(false); // ປິດ Dialog
        setPrintDate(new Date());   // ອັບເດດເວລາ

        if (isPdfMode) {
            toast.current?.show({
                severity: 'info',
                summary: 'ບັນທຶກເປັນ PDF',
                detail: 'ກະລຸນາເລືອກປາຍທາງ (Destination) ເປັນ "Save as PDF"',
                life: 5000
            });
        }

        setTimeout(() => {
            window.print();
        }, 300);
    };

    // Helper functions
    const formatDate = (d: Date | null) => d ? d.toLocaleDateString('lo-LA', { day: '2-digit', month: '2-digit', year: 'numeric' }) : "-";
    const formatTime = (d: Date) => d.toLocaleTimeString('lo-LA', { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="report-hd-view grid">
            <Toast ref={toast} position="top-center" />

            {/* Dialog ໃຫ້ເລືອກ (Export Choice) */}
            <Dialog 
                header="ເລືອກຮູບແບບການສົ່ງອອກ" 
                visible={showExportDialog} 
                style={{ width: '400px' }} 
                onHide={() => setShowExportDialog(false)}
                footer={
                    <div className="flex justify-content-end">
                        <Button label="ຍົກເລີກ" icon="pi pi-times" text onClick={() => setShowExportDialog(false)} />
                    </div>
                }
            >
                <div className="flex flex-column gap-3 pt-2">
                    <p className="m-0 text-700">ກະລຸນາເລືອກຮູບແບບທີ່ທ່ານຕ້ອງການ:</p>
                    
                    {/* ປຸ່ມເລືອກ PDF */}
                    <Button 
                        label="ບັນທຶກເປັນ PDF" 
                        icon="pi pi-file-pdf" 
                        severity="danger" 
                        outlined 
                        className="w-full p-3 text-left justify-content-start"
                        onClick={() => executePrint(true)} 
                    />

                    {/* ປຸ່ມເລືອກ Print */}
                    <Button 
                        label="ພິມເອກະສານ (Print)" 
                        icon="pi pi-print" 
                        className="w-full p-3 text-left justify-content-start"
                        onClick={() => executePrint(false)} 
                    />
                </div>
            </Dialog>
            
            <div className="col-12">
                <div className="card">
                    {/* Print Header */}
                    <div className="print-only-header hidden">
                        <div className="text-center mb-4">
                            <h3 className="m-0 text-900 font-bold">ສາທາລະນະລັດ ປະຊາທິປະໄຕ ປະຊາຊົນລາວ</h3>
                            <h4 className="m-0 text-700">ສັນຕິພາບ ເອກະລາດ ປະຊາທິປະໄຕ ເອກະພາບ ວັດທະນາຖາວອນ</h4>
                            <div className="mt-4"><h2 className="font-bold underline">ບົດລາຍງານການແຈ້ງບັນຫາ ແລະ ການຮ້ອງຂໍບໍລິການ</h2></div>
                        </div>
                        <div className="grid mb-3 pb-3 border-bottom-1 border-300 w-full m-0">
                            <div className="col-6 p-0">
                                <h5 className="font-bold mb-2 underline">ຂໍ້ມູນລາຍງານ:</h5>
                                <p className="m-0 mb-1 text-lg"><strong>ປະເພດ:</strong> {MENU_ITEMS[activeIndex].label}</p>
                                <p className="m-0 text-lg"><strong>ຊ່ວງເວລາຂໍ້ມູນ:</strong> {dateRange && dateRange[0] ? `${formatDate(dateRange[0])} - ${formatDate(dateRange[1])}` : 'ທັງໝົດ'}</p>
                            </div>
                            <div className="col-6 text-right p-0">
                                <div className="inline-block text-left" style={{ minWidth: '250px' }}>
                                    <h5 className="font-bold mb-2 underline">ຂໍ້ມູນຜູ້ພິມ:</h5>
                                    <p className="m-0 mb-1"><strong>ວັນທີ:</strong> {formatDate(printDate)}</p>
                                    <p className="m-0 mb-1"><strong>ເວລາ:</strong> {formatTime(printDate)}</p>
                                    <p className="m-0 mb-1"><strong>ຊື່ ແລະ ນາມສະກຸນ:</strong> {currentUser.fullname}</p>
                                    <p className="m-0 mb-1"><strong>ຝ່າຍ:</strong> {currentUser.department}</p>
                                    <p className="m-0 mb-1"><strong>ພະແນກ/ສູນ/ສາຂາ:</strong> {currentUser.division}</p>
                                    <p className="m-0"><strong>ເບີໂທ:</strong> {currentUser.phone}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="no-print">
                        <ReportHeaderControls
                            dateRange={dateRange}
                            setDateRange={setDateRange}
                            onExportClick={handleExportClick}
                        />
                    </div>

                    <div className="mb-3 no-print">
                        <TabMenu activeIndex={activeIndex} model={MENU_ITEMS} onTabChange={(e) => setActiveIndex(e.index)} className="custom-report-tabs" />
                    </div>

                    {error && <div className="mb-3 p-3 bg-red-50 text-red-700 border-round">Error: {error}</div>}

                    <ReportTable data={data} activeIndex={activeIndex} />
                    
                    {/* Print Footer */}
                    <div className="print-only-footer hidden mt-5">
                        <div className="flex justify-content-between px-5">
                            <div className="text-center">
                                <p className="font-bold">ຜູ້ລາຍງານ</p><br /><br /><br />
                                <p>.......................................</p>
                                <p className="mt-2">({currentUser.fullname})</p>
                            </div>
                            <div className="text-center">
                                <p className="font-bold">ຜູ້ຮັບຮອງ</p><br /><br /><br />
                                <p>.......................................</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .hidden { display: none !important; }
                
                @media print {
                    /* ✅ 1. ຕັ້ງຄ່າໜ້າເຈ້ຍເປັນ A4 ແນວນອນ (Landscape) */
                    @page { 
                        size: A4 landscape; 
                        margin: 5mm; 
                    }

                    /* ຊ່ອນປຸ່ມ ແລະ ສ່ວນທີ່ບໍ່ກ່ຽວຂ້ອງ */
                    .no-print, .p-button, .p-tabmenu, .p-calendar, .layout-topbar, .layout-sidebar, .p-toast, .p-dialog-mask, .p-paginator, .p-component-overlay {
                        display: none !important;
                    }

                    /* ສະແດງ Header/Footer ສະເພາະຕອນ Print */
                    .print-only-header, .print-only-footer { display: block !important; }
                    
                    /* Reset Layout ໃຫ້ເຕັມຈໍ */
                    .card { box-shadow: none !important; border: none !important; padding: 0 !important; }
                    .report-hd-view { margin: 0 !important; padding: 0 !important; background: white; }
                    
                    /* ✅ 2. Scale ຫຍໍ້ຂໍ້ມູນລົງ (75-80%) ເພື່ອໃຫ້ພໍດີກັບໜ້າເຈ້ຍ */
                    body {
                        zoom: 75%; 
                        -webkit-print-color-adjust: exact;
                    }

                    /* ຈັດການ Grid ຂອງ Header */
                    .grid { display: flex !important; flex-wrap: wrap !important; width: 100% !important; margin: 0 !important; }
                    .col-6 { width: 50% !important; flex: 0 0 auto !important; }

                    /* ✅ 3. ປັບ Font ຕາຕະລາງໃຫ້ໜ້ອຍລົງ */
                    .p-datatable-thead > tr > th, .p-datatable-tbody > tr > td {
                        font-size: 10px !important; 
                        padding: 4px 2px !important;
                        color: #000 !important;
                        border-color: #000 !important;
                        vertical-align: top !important; /* ຈັດໃຫ້ຕົວໜັງສືຢູ່ດ້ານເທິງຂອງ cell */
                    }

                    /* ✅ 4. ແກ້ໄຂບັນຫາຕົວໜັງສືຖືກຕັດ (...) -> ໃຫ້ປັດລົງແຖວໃໝ່ແທນ */
                    .custom-tooltip-target {
                        white-space: normal !important; /* ໃຫ້ຕັດຄຳໄດ້ */
                        overflow: visible !important;
                        text-overflow: clip !important;
                        max-width: none !important; /* ຍົກເລີກການຈຳກັດຄວາມກວ້າງ */
                        width: auto !important;
                    }

                    /* ຈັດ Text Alignment */
                    .text-right { text-align: right !important; }
                    .text-center { text-align: center !important; }
                    p, span, h2, h3, h4, h5 { color: #000 !important; }

                    ::-webkit-scrollbar { display: none; }
                }
            `}</style>
        </div>
    );
}