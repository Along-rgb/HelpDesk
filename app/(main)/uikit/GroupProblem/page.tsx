// app/(main)/uikit/service-menu/page.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { useMenu } from './useMenu';
import { MenuCard } from './MenuCard';

const ServiceMenuPage = () => {
    const { services, isLoading } = useMenu();

    if (isLoading) {
        return (
            <div className="flex justify-content-center align-items-center h-screen">
                <i className="pi pi-spin pi-spinner text-4xl"></i>
            </div>
        );
    }

    return (
        <div className="grid">
            <div className="col-12">
                {/* แก้ไขตรงนี้: เพิ่ม bg-primary-100 ต่อท้าย card */}
                <div className="card mb-0 bg-blue-50">
                    <div className="flex flex-column align-items-center justify-content-center mb-4 text-center">
                        <h3 className="m-0">ແຈ້ງບັນຫາ</h3>
                        <h5 className="m-0 mt-2">ກະລຸນາເລືອກໝວດບັນຫາຂອງທ່ານ</h5>
                    </div>

                    <div className="grid">
                        {services.map((item) => (
                            <Link
                                key={item.id}
                                href={item.path}
                                className="col-12 md:col-4 p-0 no-underline"
                                style={{ display: 'contents' }}
                            >
                                <MenuCard item={item} />
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ServiceMenuPage;