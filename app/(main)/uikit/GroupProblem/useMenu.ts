'use client';
import { useState } from 'react';
import { ServiceItem } from './types';
import { getTicketCountByCategory } from '../ticket/ticketData';

const DB_SERVICES: ServiceItem[] = [
    {
        id: 1,
        title: "ການສື່ສານ (Communication)",
        description: "ກ່ຽວກັບການສື່ສານລະບົບໂທລະສັບພາຍໃນ ແລະ ພາຍນອກ",
        icon: "/layout/images/Communication.png",
        color: "bg-blue-100 text-blue-600",
        path: "/uikit/ticket?category=PHONE",
        ticketCount: getTicketCountByCategory('PHONE'),
    },
    {
        id: 2,
        title: "ອິນເຕີເນັດ-ເນັດເວີກ (Internet-Network)",
        description: "ການຕິດຕັ້ງ, ການນຳໃຊ້ ແລະ ການແກ້ໄຂບັນຫາຕ່າງໆ ທີ່ກ່ຽວຂ້ອງກັບການນຳໃຊ້ລະບົບ-ເນັດເວີກ",
        icon: "/layout/images/network.png",
        color: "bg-green-100 text-green-600",
        path: "/uikit/ticket?category=NET",
        ticketCount: getTicketCountByCategory('NET'),
    },
    {
        id: 3,
        title: "ຄອມພີວເຕີທົ່ວໄປ (Computer)",
        description: "ການຕິດຕັ້ງ,ການນຳໃຊ້ ແລະ ການແກ້ໄຂບັນຫາທົ່ວໄປທີ່ອາດຈະພົບເຫັນໄດ້ ເພາະອຸປະກອນຮາດແວຄອມພີວເຕີ...",
        icon: "/layout/images/computer.png",
        color: "bg-orange-100 text-orange-600",
        path: "/uikit/ticket?category=IT",
        ticketCount: getTicketCountByCategory('IT'),
    }
];

export const useMenu = () => {
    const [services] = useState<ServiceItem[]>(DB_SERVICES);
    const [isLoading] = useState(false);

    return { services, isLoading };
};