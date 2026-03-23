'use client';
import React, { useState } from 'react';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import axiosClientsHelpDesk from '@/config/axiosClientsHelpDesk';

interface SyncItem {
    label: string;
    endpoint: string;
}

const SYNC_ITEMS: SyncItem[] = [
    { label: 'Sync User', endpoint: 'users' },
    { label: 'Sync employes', endpoint: 'employees' },
    { label: 'Sync Department', endpoint: 'departments' },
    { label: 'Sync Division', endpoint: 'divisions' },
    { label: 'Sync Office', endpoint: 'offices' },
    { label: 'Sync Unit', endpoint: 'units' },
    { label: 'Sync PositionGroup', endpoint: 'positiongroups' },
    { label: 'Sync PositionCode', endpoint: 'positioncodes' },
    { label: 'Sync Position', endpoint: 'positions' },
];

interface SyncDataPanelProps {
    toast: React.RefObject<Toast | null>;
}

export default function SyncDataPanel({ toast }: SyncDataPanelProps) {
    const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

    const handleSync = async (item: SyncItem) => {
        setLoadingMap((prev) => ({ ...prev, [item.endpoint]: true }));
        try {
            await axiosClientsHelpDesk.post(item.endpoint);
            toast.current?.show({
                severity: 'success',
                summary: 'ສຳເລັດ',
                detail: 'ການ Sync ຂໍ້ມູນສຳເລັດ',
                life: 3000,
            });
        } catch {
            toast.current?.show({
                severity: 'error',
                summary: 'ຜິດພາດ',
                detail: 'ການ Sync ຂໍ້ມູນບໍ່ສຳເລັດ',
                life: 4000,
            });
        } finally {
            setLoadingMap((prev) => ({ ...prev, [item.endpoint]: false }));
        }
    };

    return (
        <div>
            <h5 className="m-0 mb-3 font-bold text-xl">ການ Sync ຂໍ້ມູນພະນັກງານ</h5>
            <div className="flex flex-column gap-3">
                {SYNC_ITEMS.map((item, index) => (
                    <div
                        key={item.endpoint}
                        className="flex align-items-center justify-content-between surface-100 border-round p-3"
                    >
                        <div className="flex align-items-center gap-2">
                            <span className="font-medium text-700">{index + 1}.</span>
                            <span className="font-medium text-900">{item.label}</span>
                        </div>
                        <Button
                            label="Sync ຂໍ້ມູນ"
                            icon="pi pi-sync"
                            size="small"
                            className="p-button-outlined"
                            loading={loadingMap[item.endpoint] ?? false}
                            onClick={() => handleSync(item)}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
