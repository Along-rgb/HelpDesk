// app/(main)/uikit/GroupServices/types.ts

export interface ServiceItem {
    id: number;
    title: string;
    description: string;
    icon: string;
    color: string;
    path: string;
    /** ຈຳນວນລາຍການ Ticket ໃນຫມວດໝູ່ນີ້ */
    ticketCount?: number;
}