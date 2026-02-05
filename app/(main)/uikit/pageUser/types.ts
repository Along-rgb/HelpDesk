// app/(main)/uikit/pageUser/types.ts
export interface ServiceItem {
    id: number;
    title: string;
    description: string;
    icon: string; 
    color: string;
    path: string; 
}

export type MenuCardType = ServiceItem;