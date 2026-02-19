// app/(main)/uikit/pageUser/TicketActionMenu.tsx
'use client';
import React from 'react';
import { SplitButton } from 'primereact/splitbutton';
import { useRouter } from 'next/navigation';

interface TicketActionMenuProps {
    ticket: any;
}

export const TicketActionMenu: React.FC<TicketActionMenuProps> = ({ ticket }) => {
    const router = useRouter();

    const items = [
        {
            label: 'ການສົນທະນາ',
            icon: 'pi pi-comments',
            command: () => { console.log('Chat:', ticket.id); }
        },
        {
            label: 'ປິດ',
            icon: 'pi pi-check-circle',
            command: () => { console.log('Close:', ticket.id); }
        },
        {
            label: 'ຍົກເລີກ',
            icon: 'pi pi-times-circle',
            className: 'text-red-500',
            command: () => { console.log('Cancel:', ticket.id); }
        }
    ];

    return (
        <div className="flex justify-content-center">
            <SplitButton 
                label="ລາຍລະອຽດ" 
                model={items} 
               
                className="p-button-secondary p-button-sm custom-splitbutton-xs"
                style={{ height: '26px' }} 
                buttonProps={{ 
                    style: { 
                        padding: '0px 12px', 
                        fontSize: '1rem' 
                    } 
                }}
                menuButtonProps={{ 
                    style: { 
                        width: '25px', 
                        padding: '0' 
                    } 
                }}
                
                onClick={() => router.push(`/uikit/ticket-detail/${ticket.id}`)}
            />
        </div>
    );
};