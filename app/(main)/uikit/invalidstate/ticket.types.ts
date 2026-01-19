// app/(main)/uikit/invalidstate/ticket.types.ts

export type TicketStatus = 'doing' | 'done' | 'waiting' | 'open';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent' | 'ບໍ່ລະບຸ' | 'ສູງ' | 'ກາງ' | 'ຕ່ຳ';

export interface Assignee {
    id: number;
    name: string;
    image?: string;
    status: TicketStatus;
}

export interface Ticket {
    id: number;
    title: string;
    date: string;
    requester: string;
    assignTo?: string; 
    assignees?: Assignee[]; 
    status: string;
    priority: string;
    verified: boolean;
}