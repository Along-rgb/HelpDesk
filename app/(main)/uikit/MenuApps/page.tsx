'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { MENU_ITEMS } from './data';
import { SettingsCard } from './SettingsCard';
import { useAdminRouteGuard } from '@/app/hooks/useAdminRouteGuard';
import { useUserProfile } from '@/types/useUserProfile';

/** Role 2: Tab ໝວດໝູ່ & ລາຍການຫົວຂໍ້. Role 1: Tab ເພີ່ມໄອຄອນ. */
const isRole2 = (r: number | string | null | undefined) => Number(r) === 2;
const isRole1 = (r: number | string | null | undefined) => Number(r) === 1;

const SettingsPage = () => {
    const router = useRouter();
    const [activeButton, setActiveButton] = useState<string | null>(null);
    const { loading, allowed } = useAdminRouteGuard('/uikit/profileUser');
    const { roleId } = useUserProfile();

    const canManageCategoryAndTopic = isRole2(roleId);
    const canManageIcons = isRole1(roleId);
    const profileReady = roleId === 1 || roleId === 2;

    /** ทุกการ์ดใช้ PrimeReact icon จาก MENU_ITEMS เท่านั้น — ไม่ใช้รูปจาก API เพื่อหลีกเลี่ยง placeholder/รูปโหลดไม่ขึ้น. Role 2 ບໍ່ເຫັນກາດ ອາຄານສະຖານທີ່ (locations). */
    const visibleItems = useMemo(() => {
        const base = MENU_ITEMS.map((item) => ({ ...item, iconUrl: undefined }));
        if (roleId === 2) return base.filter((item) => item.id !== 'locations');
        return base;
    }, [roleId]);

    /** Role 1: tab ໝວດໝູ່, ລາຍການຫົວຂໍ້ (0,1) disabled. Role 2: tab ເພີ່ມໄອຄອນ (2) disabled.
     * ການແຈ້ງບັນຫາ/ການຮ້ອງຂໍ: Role 1 ກົດໄດ້ແຕ່ ເພີ່ມໄອຄອນ (tabIndex=2). Role 2 ກົດໄດ້ແຕ່ ໝວດໝູ່, ລາຍການຫົວຂໍ້ (tabIndex=0,1). */
    const getSubMenuDisabled = useMemo(() => {
        const r = Number(roleId);
        return (itemId: string, tabIndex: number) => {
            if (itemId === 'users') {
                if (r === 1 && tabIndex === 1) return true;
                if (r === 2 && tabIndex === 0) return true;
                return false;
            }
            if (itemId === 'issues') {
                if (r === 1 && (tabIndex === 0 || tabIndex === 1)) return true;
                if (r === 2 && tabIndex === 2) return true;
                return false;
            }
            return false;
        };
    }, [roleId]);

    /** การ์ด dis ເມື່ອ role ບໍ່ມີສິດໃຊ້ງານ: ຜູ້ໃຊ້ = ຕ້ອງ profileReady; ອາຄານ = Role 1 ເທົ່ານັ້ນ (API /api/buildings, /api/floors); ການແຈ້ງບັນຫາ/ການຮ້ອງຂໍ = ຕ້ອງมีສິດ Tab. */
    const getCardDisabled = useMemo(() => {
        return (itemId: string): boolean => {
            if (itemId === 'users') return !profileReady;
            if (itemId === 'locations') return !profileReady || !isRole1(roleId);
            if (itemId === 'issues') return !(canManageCategoryAndTopic || canManageIcons);
            return false;
        };
    }, [profileReady, roleId, canManageCategoryAndTopic, canManageIcons]);

    const handleSubMenuClick = (itemId: string, label: string, mainPath: string, tabIndex?: number) => {
        if (tabIndex !== undefined && itemId === 'issues') {
            if (!canManageCategoryAndTopic && (tabIndex === 0 || tabIndex === 1)) return;
            if (!canManageIcons && tabIndex === 2) return;
        }
        const uniqueKey = `${itemId}-${label}`;
        setActiveButton(uniqueKey);
        const destination = tabIndex !== undefined
            ? `${mainPath}?tab=${tabIndex}`
            : mainPath;
        router.push(destination);
    };

    if (loading) {
        return (
            <div className="flex align-items-center justify-content-center p-8">
                <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem' }}></i>
            </div>
        );
    }
    if (!allowed) {
        return null;
    }

    return (
        <div className="layout-dashboard p-4">
            <h4 className="mb-4 text-900 font-bold">ການຕັ້ງຄ່າ ແລະ ຈັດການຂໍ້ມູນ</h4>

            <div className="grid">
                {visibleItems.map((item) => (
                    <div key={item.id} className="col-12 md:col-6 lg:col-3 p-2">
                        <SettingsCard
                            item={item}
                            activeButton={activeButton}
                            onSubMenuClick={handleSubMenuClick}
                            getSubMenuDisabled={getSubMenuDisabled}
                            cardDisabled={getCardDisabled(item.id)}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SettingsPage;