// app/(main)/uikit/GroupServices/useMenuu.ts
'use client';
import { useState } from 'react';
import { ServiceItem } from './types';
import { getTicketCountByCategory } from '../ticket/ticketData';

const DB_SERVICES: ServiceItem[] = [
    {
        id: 1,
        title: "ບໍລິການຄອມພີວເຕີທົ່ວໄປ (ທີ່ກ່ຽວພັນກັບຄອມພີວເຕີ)",
        description: "ບໍລິການຂໍ ຫຼື ເບີກອຸປະກອນໄອທີຕ່າງໆ ສຳລັບການເຮັດວຽກ",
        icon: "/layout/images/computer.png",
        color: "bg-blue-100 text-blue-600",
        path: "/uikit/ticket?category=SerCOM",
        ticketCount: getTicketCountByCategory('SerCOM'),
    },
    {
        id: 2,
        title: "ບໍລິການດ້ານ Software (Software Service)",
        description: "ຂໍຕິດຕັ້ງໂປຣແກຣມ, ອັບເດດ License ຫຼື ຂໍສິດການເຂົ້າເຖິງລະບົບ",
        icon: "/layout/images/network.png",
        color: "bg-green-100 text-green-600",
        path: "/uikit/ticket?category=SerSOFT",
        ticketCount: getTicketCountByCategory('SerSOFT'),
    },
    {
        id: 3,
        title: "ບໍລິການອື່ນໆ (Other Services)",
        description: "ຕິດຕໍ່ສອບຖາມຂໍ້ມູນ ຫຼື ຂໍຄວາມຊ່ວຍເຫຼືອດ້ານບໍລິການອື່ນໆ",
        icon: "/layout/images/Communication.png",
        color: "bg-orange-100 text-orange-600",
        path: "/uikit/ticket?category=SerOTHER",
        ticketCount: getTicketCountByCategory('SerOTHER'),
    }
];

export const useMenu = () => {
    // ໃຊ້ຂໍ້ມູນ DB_SERVICES ຂອງໄຟລ໌ນີ້
    const [services] = useState<ServiceItem[]>(DB_SERVICES);
    const [isLoading] = useState(false);

    return { services, isLoading };
};