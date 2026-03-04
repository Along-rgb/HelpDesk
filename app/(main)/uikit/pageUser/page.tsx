// app/(main)/uikit/pageUser/page.tsx
'use client';

import React from 'react';
import Link from 'next/link';

const PageUser = () => {
    return (
        <div className="p-4">
            <div className="flex flex-column align-items-center justify-content-center text-center py-6">
                <h3 className="m-0 mb-2">ໜ້າຫຼັກ</h3>
                <p className="text-600 m-0 mb-3">
                    ກະລຸນາເລືອກເມນູດ້ານເທິງ ເຊັ່ນ ປະຫວັດການຮ້ອງຂໍ ຫຼື ກ່ຽວກັບລະບົບ
                </p>
                <Link href="/uikit/request-history" className="p-button p-button-outlined">
                    <i className="pi pi-folder-open mr-2" />
                    ປະຫວັດການຮ້ອງຂໍ
                </Link>
            </div>
        </div>
    );
};

export default PageUser;
