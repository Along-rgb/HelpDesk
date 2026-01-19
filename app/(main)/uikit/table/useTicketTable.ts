// table/useTicketTable.ts
import { useState, useEffect, useCallback } from "react";
import { Ticket, Assignee } from "./types";
import { ticketService } from "../../../services/ticketService";
import { ASSIGNMENT_GROUPS } from "./constants";

export const useTicketTable = () => {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [globalFilter, setGlobalFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState(null);
    const [assignFilter, setAssignFilter] = useState<any[] | null>(null);
    const [selectedTickets, setSelectedTickets] = useState<Ticket[]>([]);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [currentAssignees, setCurrentAssignees] = useState<Assignee[]>([]);

    // ✅ Helper Function: ใช้กรองข้อมูล (Search)
    const filterTickets = (data: Ticket[], filterValue: string) => {
        if (!filterValue) return data;
        const lowerValue = filterValue.toLowerCase();
        return data.filter((ticket) =>
            ticket.id.toString().includes(lowerValue) ||
            ticket.title.toLowerCase().includes(lowerValue) ||
            (ticket.firstname_req && ticket.firstname_req.toLowerCase().includes(lowerValue)) ||
            (ticket.requester && ticket.requester.toLowerCase().includes(lowerValue))
        );
    };

    const fetchData = useCallback(() => {
        setLoading(true);
        ticketService.getTickets()
            .then((data) => {
                const ticketData = data as Ticket[];

                // ✅ [UPDATE] เรียงลำดับตาม ID (ລະຫັດ) อย่างเดียว (จากมาก -> น้อย)
                // ตัดเรื่องวันที่ออกไป เพื่อป้องกันการชนกันของข้อมูล
                ticketData.sort((a, b) => {
                    const idA = Number(a.id);
                    const idB = Number(b.id);
                    
                    // กรณี ID เป็นตัวเลข (เช่น 2259, 2258) ให้ลบกันตรงๆ
                    if (!isNaN(idA) && !isNaN(idB)) {
                        return idB - idA; 
                    }
                    // กรณี ID เป็น String ผสมตัวหนังสือ (Fallback)
                    return String(b.id).localeCompare(String(a.id));
                });

                setTickets(ticketData);
                
                // กรองข้อมูลหลังจาก Sort แล้ว
                setFilteredTickets(filterTickets(ticketData, globalFilter));
            })
            .catch((err) => console.error("Fetch Error:", err))
            .finally(() => setLoading(false));
    }, [globalFilter]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => { fetchData(); }, []);

    const onCheckboxChange = (e: any, rowData: Ticket) => {
        let _selected = [...selectedTickets];
        if (e.checked) _selected.push(rowData);
        else _selected = _selected.filter((t) => t.id !== rowData.id);
        setSelectedTickets(_selected);
    };

    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setGlobalFilter(value);
        // ใช้ข้อมูล tickets ที่ Sort มาแล้วเสมอ
        setFilteredTickets(filterTickets(tickets, value));
    };

    const onPriorityChange = async (id: string | number, newPriority: string) => {
        const targetTicket = tickets.find(t => t.id === id);
        if (!targetTicket) return;
        try {
            setLoading(true);
            await ticketService.updateTicket({ ...targetTicket, priority: newPriority } as any);
            fetchData();
        } catch (error) {
            console.error("Update Priority Failed:", error);
            setLoading(false);
        }
    };

    const onBulkAssign = async () => {
        if (!assignFilter || (Array.isArray(assignFilter) && assignFilter.length === 0) || selectedTickets.length === 0) return;

        const newAssignees: Assignee[] = assignFilter.map((item: any, index) => {
            let assignedName = item.label || item.firstname ? `${item.firstname} ${item.lastname || ''}` : item;
            let assignedId = item.id;

            if (typeof item === 'string') {
                const found = ASSIGNMENT_GROUPS.flatMap(g => g.items).find((i: any) => i.value === item || i.label === item);
                if (found) {
                    assignedName = found.label;
                    assignedId = found.id;
                }
            }

            return {
                id: assignedId || (Date.now() + index),
                name: assignedName,
                status: 'waiting',
                image: ''
            };
        });

        try {
            setLoading(true);
            await Promise.all(selectedTickets.map(ticket =>
                ticketService.updateTicket({ ...ticket, assignees: [...(ticket.assignees || []), ...newAssignees] } as any)
            ));
            fetchData();
            setAssignFilter(null);
            setSelectedTickets([]);
        } catch (error) {
            console.error("Bulk Assign Failed:", error);
            setLoading(false);
        }
    };

    const openAssigneeDialog = (assignees: Assignee[]) => {
        setCurrentAssignees(assignees);
        setDialogVisible(true);
    };

    return {
        tickets: filteredTickets, loading, selectedTickets,
        globalFilter, onGlobalFilterChange,
        statusFilter, setStatusFilter, assignFilter, setAssignFilter,
        onCheckboxChange, onPriorityChange, onBulkAssign,
        dialogVisible, currentAssignees, openAssigneeDialog, closeDialog: () => setDialogVisible(false)
    };
};