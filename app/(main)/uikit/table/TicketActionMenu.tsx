"use client";

import React, { useRef } from "react";
import { useRouter } from "next/navigation";
import { SplitButton } from "primereact/splitbutton";
import { Toast } from "primereact/toast";
import { Ticket } from "./types";

interface Props {
    ticket: Ticket;
}

export const TicketActionMenu = ({ ticket }: Props) => {
    const router = useRouter();
    const toast = useRef<Toast>(null);

    const items = [
        { label: 'ແກ້ໄຂແລ້ວ', icon: 'pi pi-check', command: () => {} },
        { label: 'ປິດວຽກ', icon: 'pi pi-times-circle', command: () => {} },
        { separator: true },
        { label: 'ຍົກເລີກ', icon: 'pi pi-trash', className: 'text-red-500', command: () => {} }
    ];

    return (
        <>
            <Toast ref={toast} />
            
            {/* ແກ້ໄຂ: ໃຊ້ justify-content-center ເພື່ອຈັດກາງ */}
            <div className="flex justify-content-center">
                <SplitButton 
                    label="ລາຍລະອຽດ" 
                    icon="pi pi-file" 
                    model={items} 
                    className="p-button-secondary p-button-sm"
                    style={{ height: '28px', fontSize: '12px' }} 
                    buttonProps={{ style: { padding: '0px 8px' } }} 
                    menuButtonProps={{ style: { width: '24px' } }}
                    onClick={() => router.push(`/uikit/ticket-detail/${ticket.id}`)}
                    dropdownIcon="pi pi-chevron-down"
                />
            </div>
        </>
    );
};