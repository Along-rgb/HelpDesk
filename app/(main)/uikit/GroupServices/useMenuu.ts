// app/(main)/uikit/group-services/useMenu.ts
'use client';
import { useState } from 'react';
import { ServiceItem } from './types';

const DB_SERVICES: ServiceItem[] = [
    {
        id: 1,
        title: "ບໍລິການຄອມພີວເຕີທົ່ວໄປ (ທີ່ກ່ຽວພັນກັບຄອມພີວເຕີ)",
        description: "ບໍລິການຂໍ ຫຼື ເບີກອຸປະກອນໄອທີຕ່າງໆ ສຳລັບການເຮັດວຽກ",
        icon: "/layout/images/computer.png", 
        color: "bg-blue-100 text-blue-600",
        path: "/uikit/invalidstate?category=SerCOM" 
    },
    {
        id: 2,
        title: "ບໍລິການດ້ານ Software (Software Service)",
        description: "ຂໍຕິດຕັ້ງໂປຣແກຣມ, ອັບເດດ License ຫຼື ຂໍສິດການເຂົ້າເຖິງລະບົບ",
        icon: "/layout/images/network.png", 
        color: "bg-green-100 text-green-600",
        path: "/uikit/invalidstate?category=SerSOFT"
    },
    {
        id: 3,
        title: "ບໍລິການອື່ນໆ (Other Services)",
        description: "ຕິດຕໍ່ສອບຖາມຂໍ້ມູນ ຫຼື ຂໍຄວາມຊ່ວຍເຫຼືອດ້ານບໍລິການອື່ນໆ",
        icon: "/layout/images/Communication.png",
        color: "bg-orange-100 text-orange-600",
        path: "/uikit/invalidstate?category=SerOTHER" 
    }
];

export const useMenu = () => {
    // ໃຊ້ຂໍ້ມູນ DB_SERVICES ຂອງໄຟລ໌ນີ້
    const [services] = useState<ServiceItem[]>(DB_SERVICES);
    const [isLoading] = useState(false);

    return { services, isLoading };
};