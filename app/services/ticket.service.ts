import axios from "axios";
// Import Type จากไฟล์ invalidstate/types.ts
import { Ticket } from "../(main)/uikit/invalidstate/types"; 

const API_URL = "http://localhost:3501/tickets";

export const TicketService = {
    async getTickets(): Promise<Ticket[]> {
        try {
            const res = await axios.get<Ticket[]>(API_URL);
            return res.data;
        } catch (error) {
            console.error("Get tickets error:", error);
            throw error;
        }
    }
};