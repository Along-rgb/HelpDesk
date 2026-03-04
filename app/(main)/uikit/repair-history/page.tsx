'use client';

import React, { useState } from 'react';
import { Checkbox } from 'primereact/checkbox';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';

export default function RepairHistoryPage() {
    const [searchByTicketNo, setSearchByTicketNo] = useState(false);
    const [searchByDate, setSearchByDate] = useState(false);
    const [myHistory, setMyHistory] = useState(false);
    const [ticketNoValue, setTicketNoValue] = useState('');
    const [dateRange, setDateRange] = useState<Date[] | null>(null);

    return (
        <div className="layout-dashboard p-4">
            <h4 className="mb-4 text-900 font-bold">ປະຫວັດການຊ້ອມແປງ</h4>

            <div className="card p-4 mb-4">
                <h5 className="mt-0 mb-3 text-900 font-semibold">ການຄົ້ນຫາ</h5>
                <div className="flex flex-wrap align-items-start gap-8">
                    <div className="flex flex-column gap-2">
                        <div className="flex align-items-center gap-2">
                            <Checkbox
                                inputId="search-by-ticket"
                                checked={searchByTicketNo}
                                onChange={(e) => setSearchByTicketNo(e.checked ?? false)}
                            />
                            <label htmlFor="search-by-ticket" className="cursor-pointer text-color">
                                ຄົ້ນຫາໂດຍ ເລກ ຊຄທ
                            </label>
                        </div>
                        <div className="w-full md:w-20rem" style={{ minHeight: '2.5rem' }}>
                            {searchByTicketNo && (
                                <InputText
                                    id="ticket-no-search"
                                    value={ticketNoValue}
                                    onChange={(e) => setTicketNoValue(e.target.value)}
                                    placeholder="ໃສ່ເລກ ຊຄທ"
                                    className="w-full p-inputtext-sm"
                                />
                            )}
                        </div>
                    </div>
                    <div className="flex flex-column gap-2">
                        <div className="flex align-items-center gap-2">
                            <Checkbox
                                inputId="search-by-date"
                                checked={searchByDate}
                                onChange={(e) => setSearchByDate(e.checked ?? false)}
                            />
                            <label htmlFor="search-by-date" className="cursor-pointer text-color">
                                ຄົ້ນຫາໂດຍວັນທີ
                            </label>
                        </div>
                        <div className="w-full md:w-20rem" style={{ minHeight: '2.5rem' }}>
                            {searchByDate && (
                                <div className="relative w-full">
                                    <Calendar
                                        value={dateRange}
                                        onChange={(e) => {
                                            const v = e.value;
                                            if (v == null) setDateRange(null);
                                            else if (Array.isArray(v)) setDateRange(v.filter((d): d is Date => d instanceof Date));
                                            else setDateRange(null);
                                        }}
                                        selectionMode="range"
                                        readOnlyInput
                                        showIcon
                                        dateFormat="dd/mm/yy"
                                        className="w-full"
                                        inputClassName="p-inputtext-sm"
                                    />
                                    {dateRange && dateRange.length > 0 && (
                                        <i
                                            className="cls pi pi-times absolute cursor-pointer text-500 hover:text-700"
                                            style={{ right: '3rem', top: '50%', transform: 'translateY(-50%)', padding: '2px', zIndex: 1 }}
                                            onClick={(e) => { e.stopPropagation(); setDateRange(null); }}
                                            role="button"
                                            aria-label="ລົບວັນທີ"
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-column gap-2">
                        <div className="flex align-items-center gap-2">
                            <Checkbox
                                inputId="search-my-history"
                                checked={myHistory}
                                onChange={(e) => setMyHistory(e.checked ?? false)}
                            />
                            <label htmlFor="search-my-history" className="cursor-pointer text-color">
                                ປະຫວັດຂອງຂ້ອຍ
                            </label>
                        </div>
                        <div className="w-full md:w-20rem" style={{ minHeight: '2.5rem' }} />
                    </div>
                </div>
            </div>

            <div className="card p-4">
                <p className="text-color-secondary m-0">ຫນ້ານີ້ໃຊ້ສຳລັບສະແດງປະຫວັດການຊ້ອມແປງ.</p>
            </div>
        </div>
    );
}
