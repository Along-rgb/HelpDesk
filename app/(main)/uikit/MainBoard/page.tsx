'use client';
import React from 'react';
import { Button } from 'primereact/button';
import { StatItem } from './StatItem';
import { EmptyStateCard } from './EmptyStateCard';

// ตัวอย่าง Mock Data สำหรับรูปภาพ (ในโปรเจกต์จริง เปลี่ยน string นี้เป็น path ของไฟล์คุณ)
const svgs = {
    emptyWork: '/layout/images/Board.svg',        // รูปคนถือกระดาษ
    emptyApprove: '/layout/images/ture.svg',  // รูปเครื่องหมายถูก
    emptyNews: '/layout/images/Tphone.svg',        // รูปโทรโข่ง
    emptyNotify: '/layout/images/time.svg'     // รูปนาฬิกา
};

const MainBoard = () => {
    return (
        <div className="grid">
            <div className="col-12">
                <h4 className="text-900 font-bold flex align-items-center gap-2">
                    <i className="pi pi-th-large"></i> 
                    ສິດ ແລະ ສະຖານະຜູ້ໃຊ້: ຜູ້ເບິ່ງແຍງລະບົບ
                </h4>
            </div>

            {/* Row 1 */}
            <div className="col-12 lg:col-4">
                <EmptyStateCard 
                    title="ສະຫຼຸບລວມຂອງຂ້ອຍ"
                    headerIcon="pi pi-list text-orange-500" // Icon เล็กตรงหัวข้อ
                    headerColorClass="border-orange-500"
                >
                    <div className="pt-2">
                        <StatItem label="ການຮ້ອງຂໍທີ່ເກັບກຳທັງໝົດ" value={0} />
                        <StatItem label="ການຮ້ອງຂໍທີ່ເກັບກຳມື້ນີ້" value={0} />
                        <StatItem label="ການຮ້ອງຂໍທີ່ກຳລັງດຳເນີນການ" value={0} />
                    </div>
                </EmptyStateCard>
            </div>

            <div className="col-12 lg:col-4">
                <EmptyStateCard 
                    title="ວຽກຂອງຂ້ອຍ" 
                    headerIcon="pi pi-clipboard text-green-500"
                    imageSrc={svgs.emptyWork} // ใส่ Path รูป SVG ตรงนี้
                    message="ຍັງບໍ່ມີລາຍການໜ້າວຽກ"
                    headerColorClass="border-green-500"
                    showLink={true}
                />
            </div>

            <div className="col-12 lg:col-4">
                <EmptyStateCard 
                    title="ການອະນຸມັດຂອງຂ້ອຍ" 
                    headerIcon="pi pi-user-edit text-pink-500"
                    imageSrc={svgs.emptyApprove} // ใส่ Path รูป SVG ตรงนี้
                    message="ບໍ່ມີລາຍການລໍອະນຸມັດ"
                    headerColorClass="border-pink-500"
                    showLink={true}
                />
            </div>

            {/* Row 2 */}
            <div className="col-12 lg:col-6">
                <EmptyStateCard 
                    title="ການປະກາດ" 
                    headerIcon="pi pi-megaphone text-blue-500"
                    imageSrc={svgs.emptyNews} // ใส่ Path รูป SVG ตรงนี้
                    message="ມື້ນີ້ຍັງບໍ່ມີການປະກາດ"
                    headerColorClass="border-blue-500"
                />
            </div>

            <div className="col-12 lg:col-6">
                <EmptyStateCard 
                    title="ການແຈ້ງເຕືອນຂອງຂ້ອຍ" 
                    headerIcon="pi pi-clock text-pink-500"
                    imageSrc={svgs.emptyNotify} // ใส่ Path รูป SVG ตรงนี้
                    message="ຍັງບໍ່ມີການແຈ້ງເຕືອນ"
                    headerColorClass="border-pink-500"
                    action={
                        <Button label="ເພີ່ມໃຫມ່" icon="pi pi-plus" className="p-button-outlined p-button-secondary text-sm" />
                    }
                />
            </div>
        </div>
    );
};

export default MainBoard;