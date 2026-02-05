// src/app/reports/components/ReportHeaderControls.tsx
import React from 'react';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';

interface Props {
    dateRange: Date[] | any;
    setDateRange: (value: any) => void;
    onExportClick: () => void; // ✅ ປ່ຽນຊື່ function ໃຫ້ສື່ຄວາມໝາຍວ່າ "ກົດສົ່ງອອກ" (ຍັງບໍ່ທັນ Print)
}

export const ReportHeaderControls = ({ dateRange, setDateRange, onExportClick }: Props) => {
    return (
        <div className="flex flex-column md:flex-row justify-content-between align-items-center mb-4">
            <h5 className="m-0 text-900 font-bold mb-3 md:mb-0">
                ລາຍງານ-ການແຈ້ງບັນຫາ ແລະ ການຮ້ອງຂໍບໍລິການ
            </h5>
            <div className="flex align-items-center gap-3 w-full md:w-auto">
                <span className="font-bold text-700 white-space-nowrap">ຊ່ວງເວລາ:</span>
                <div className="relative w-full md:w-20rem">
                    <Calendar
                        value={dateRange}
                        onChange={(e) => setDateRange(e.value)}
                        selectionMode="range"
                        readOnlyInput
                        placeholder="ເລືອກ ວັນທີ/ເດືອນ/ປີ"
                        showIcon
                        className="w-full"
                        inputClassName="p-inputtext-sm"
                        dateFormat="dd/mm/yy"  
                    />
                    {(dateRange && dateRange.length > 0) && (
                        <i 
                            className="pi pi-times absolute cursor-pointer text-500 hover:text-700 bg-white border-circle"
                            style={{ right: '3rem', top: '50%', transform: 'translateY(-50%)', padding: '2px', zIndex: 1 }}
                            onClick={(e) => { e.stopPropagation(); setDateRange(null); }}
                        />
                    )}
                </div>
                
                {/* ✅ ປຸ່ມນີ້ຈະໄປເປີດ Dialog ໃຫ້ເລືອກກ່ອນ */}
                <Button 
                    label="ສົ່ງອອກ / ພິມ" 
                    icon="pi pi-download" 
                    severity="success" 
                    size="small" 
                    onClick={onExportClick} 
                />
            </div>
        </div>
    );
};