// table/useTicketTable.ts
import { useState, useEffect, useCallback } from "react";
import { Ticket, Assignee } from "./types";
import { ticketService } from "@/app/services/ticketService";
import { ASSIGNMENT_GROUPS } from "./constants";
import { getCurrentDateTimeString } from "@/utils/dateUtils";

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

                // ✅ เรียงลำดับตาม ID (ລະຫັດ) อย่างเดียว (จากมาก -> น้อย)
                ticketData.sort((a, b) => {
                    const idA = Number(a.id);
                    const idB = Number(b.id);
                    
                    if (!isNaN(idA) && !isNaN(idB)) {
                        return idB - idA; 
                    }
                    return String(b.id).localeCompare(String(a.id));
                });

                setTickets(ticketData);
                setFilteredTickets(filterTickets(ticketData, globalFilter));
            })
            .catch((err) => console.error("Fetch Error:", err))
            .finally(() => setLoading(false));
    }, [globalFilter]); 

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
            // Logic การตั้งชื่อ
            let assignedName = item.label || item.firstname ? `${item.firstname} ${item.lastname || ''}` : item;
            let assignedId = item.id;
            
            // ✅ ดึงเบอร์โทรศัพท์ (item เป็น any อยู่แล้ว ตรงนี้จึงไม่ error)
            let assignedPhone = item.Phonenumber || ''; 

            if (typeof item === 'string') {
                const found = ASSIGNMENT_GROUPS.flatMap(g => g.items).find((i: any) => i.value === item || i.label === item);
                if (found) {
                    assignedName = found.label;
                    assignedId = found.id;
                    
                    // ✅ [FIXED] ใช้ (found as any) เพื่อแก้ปัญหา Property 'Phonenumber' does not exist
                    assignedPhone = (found as any).Phonenumber || '';
                }
            }

            return {
                id: assignedId || (Date.now() + index),
                name: assignedName,
                status: 'waiting',
                image: '',
                phone: assignedPhone 
            };
        });

        try {
            setLoading(true);
            const assignDate = getCurrentDateTimeString();
            await Promise.all(selectedTickets.map(ticket =>
                ticketService.updateTicket({
                    ...ticket,
                    assignees: [...(ticket.assignees || []), ...newAssignees],
                    assignDate,
                } as any)
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