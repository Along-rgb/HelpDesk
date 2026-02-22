// app/(main)/uikit/GroupServices/page.tsx
'use client';
import React from 'react';
import Link from 'next/link';
import { useMenu } from './useGroupServicesMenu';
import { MenuCard } from './MenuCardd';

const ServiceGroupPage = () => {
    // ດຶງຂໍ້ມູນຈາກ useMenu ຂອງ GroupServices
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
                {/* ຮູບແບບ Card ແລະ ສີພື້ນຫຼັງຄືກັບ GroupProblem */}
                <div className="card mb-0 bg-blue-50">
                    <div className="flex flex-column align-items-center justify-content-center mb-4 text-center">
                        {/* ປ່ຽນຂໍ້ຄວາມໃຫ້ເໝາະກັບ GroupServices */}
                        <h3 className="m-0">ບໍລິການ (Services)</h3>
                        <h5 className="m-0 mt-2">ກະລຸນາເລືອກໝວດໝູ່ບໍລິການທີ່ທ່ານຕ້ອງການ</h5>
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

export default ServiceGroupPage;