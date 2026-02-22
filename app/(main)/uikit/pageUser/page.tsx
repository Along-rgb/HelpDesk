// app/(main)/uikit/pageUser/page.tsx
'use client';

import React, { useState } from 'react';
import { useMenu } from './UserMenu';
import { MenuCard } from './MenuUser';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';

import { TicketActionMenu } from '@/app/components/TicketActionMenu';
import { TitleColumn } from './TitleColumn'; // นำเข้า Component ใหม่
import { STATUS_MAP } from './constants';
import { useProfileData } from '@/app/store/user/userProfileStore';

const PageUser = () => {
    const { services, handleNavigate, isLoading } = useMenu();
    const { profileData } = useProfileData();
    const displayName = profileData
        ? [profileData.first_name, profileData.last_name].filter(Boolean).join(' ').trim() || '—'
        : '—';
    const [activeTab, setActiveTab] = useState('processing');
    const [first, setFirst] = useState(0);

    // ข้อมูลจำลอง (Mock Data)
    const [tickets] = useState([
        {
            id: 'TK-0001',
            title: 'ລົງວິນໂດ ແລະ ໂປຣແກຣມເສີມທີ່ມີມີຄວາມຍາວເກີນເພື່ອສະແດງ Tooltip',
            date: '2024-05-20 10:30',
            assignTo: 'ທະນູຄຳ ວັນລາສີ',
            status: 'ກຳລັງດຳເນີນການ'
        },
        {
            id: 'TK-0002',
            title: 'ອິນເຕີເນັດໃຊ້ງານບໍ່ໄດ້',
            date: '2024-05-20 09:15',
            assignTo: 'ແສງປີຊา ທຳມະວົງ',
            status: 'ສຳເລັດແລ້ວ'
        }
    ]);

    if (isLoading) return <div className="p-4 text-center">ກຳລັງໂຫລດ...</div>;

    return (
        <div className="p-4">
            {/* ส่วนของ Menu Cards */}
            <div className="grid">
                {services.map((item) => (
                    <MenuCard key={item.id} item={item} onSelect={handleNavigate} />
                ))}
            </div>

            <div className="divider-container">
                <span className="divider-text">ການຮ້ອງຂໍຂອງທ່ານ: {displayName}</span>
            </div>

            {/* ส่วนของ Buttons */}
            <div className="selection-button-group">
                {['new', 'processing', 'completed', 'cancelled'].map((tab) => (
                    <button
                        key={tab}
                        className={`selection-btn ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab as any)}
                    >
                        {tab === 'new' && 'ຄຳຮ້ອງຂໍໃໝ່'}
                        {tab === 'processing' && 'ຄຳຮ້ອງຂໍທີ່ກຳລັງດຳເນີນການ'}
                        {tab === 'completed' && 'ຄຳຮ້ອງຂໍທີ່ສຳເລັດແລ้ວ'}
                        {tab === 'cancelled' && 'ຄຳຮ້ອງຂໍທີ່ຖືກປະຕິເສດ'}
                    </button>
                ))}
            </div>

            {/* ส่วนของ DataTable */}
            <div className="table-content-wrapper" style={{ backgroundColor: 'var(--surface-card)', borderRadius: '0 0 20px 20px', padding: '1rem' }}>
                <DataTable value={tickets} paginator rows={10} first={first} onPage={(e) => setFirst(e.first)} size="small">
                    <Column field="id" header="ລຳດັບ" style={{ width: '10%', fontWeight: 'bold' }} align="center" />

                    {/* เรียกใช้ TitleColumn ที่แยกไฟล์ไว้ */}
                    <Column
                        header="ຫົວຂໍ້ເລື່ອງ"
                        body={(rowData) => <TitleColumn title={rowData.title} id={rowData.id} />}
                        style={{ minWidth: '200px' }}
                    />

                    <Column field="date" header="ວັນທີຮ້ອງຂໍ" style={{ width: '150px' }} align="center" />
                    <Column header="ຜູ້ຮັບຜິດຊອບ" body={(rowData) => rowData.assignTo || 'ຍັງບໍ່ໄດ້ມອບໝາຍ'} style={{ width: '150px' }} align="center" />
                    <Column
                        field="status"
                        header="ສະຖານະ"
                        body={(rowData) => (
                            <Tag
                                value={rowData.status}
                                severity={STATUS_MAP[rowData.status] as any}
                                style={{
                                    fontSize: '0.95rem', 
                                    padding: '0.4rem 0.8rem', 
                                    fontWeight: '600'
                                }}
                            />
                        )}
                        style={{ width: '150px' }} 
                        align="center"
                    />
                    <Column
                        header="ດຳເນີນການ"
                        body={(rowData) => <TicketActionMenu ticket={rowData} variant="user" />}
                        style={{ width: '150px' }}
                        align="center"
                    />
                </DataTable>
            </div>
        </div>
    );
};

export default PageUser;