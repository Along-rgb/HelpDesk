// app/(main)/uikit/pageUser/useMenu.ts
'use client';
import { useState } from 'react';
import { ServiceItem } from './types';

export const useMenu = () => {
    const [services] = useState<ServiceItem[]>([
        {
            id: 1,
            title: "ການແຈ້ງເຕືອນຂອງທ່ານ",
            description: "",
            icon: "/layout/images/bell.png", 
            color: "bg-green-gradient",
            path: "/uikit/notifications"
        },
        {
            id: 2,
            title: "ການແຈ້ງບັນຫາໃຫມ່",
            description: "",
            icon: "/layout/images/error.png",
            color: "bg-blue-gradient",
            path: "/uikit/GroupProblem"
        }
    ]);

    const [isLoading] = useState(false);

    const handleNavigate = (path: string) => {
        window.location.href = path; 
    };

    return { services, handleNavigate, isLoading };
};