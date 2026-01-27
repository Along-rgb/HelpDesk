// src/app/reports/page.tsx
'use client';

import React, { useState } from 'react';
import { TabMenu } from 'primereact/tabmenu';
// Imports Components
import { useReportData } from './hooks/useReportData';
import { ReportHeaderControls } from './ReportHeaderControls';
import { ReportTable } from './ReportTable';
import { MENU_ITEMS } from './utils/reportConfig';

export default function ReportHD() {
    // 1. State
    const [dateRange, setDateRange] = useState<Date[] | any>(null);
    const [activeIndex, setActiveIndex] = useState(0);

    // 2. Data Fetching
    const { data, error } = useReportData(activeIndex, dateRange);

    // 3. Render
    return (
        <div className="report-hd-view grid">
            <div className="col-12">
                <div className="card">
                    {/* ส่วนหัว */}
                    <ReportHeaderControls
                        dateRange={dateRange}
                        setDateRange={setDateRange}
                    />

                    {/* เมนู Tab */}
                    <div className="mb-3">
                        <TabMenu
                          activeIndex={activeIndex}
                            model={MENU_ITEMS}
                            onTabChange={(e) => setActiveIndex(e.index)}

                            // ✅ ใส่ Class นี้เพื่อให้ไปดึง Style จาก theme.css ที่เราเพิ่งเพิ่ม
                            className="custom-report-tabs"
                        />
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mb-3 p-3 bg-red-50 text-red-700 border-round">
                            Error: {error}
                        </div>
                    )}

                    {/* ตาราง */}
                    <ReportTable
                        // key={activeIndex}
                        data={data}
                        activeIndex={activeIndex}
                    />
                </div>
            </div>
        </div>
    );
}