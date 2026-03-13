/**
 * GET /api/tickets/[id] — รับ ticket ID จาก URL แล้วดึงข้อมูลจาก Helpdesk API
 * Client ส่ง Authorization header มาด้วย
 */
import { NextRequest, NextResponse } from "next/server";
import { env } from "@/config/env";

function getHelpdeskBaseUrl(): string {
    return env.helpdeskApiUrl.trim().replace(/\/$/, "");
}

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id: ticketId } = await context.params;
    if (!ticketId || typeof ticketId !== "string" || ticketId.trim() === "") {
        return NextResponse.json(
            { error: "Invalid ticket link" },
            { status: 400 }
        );
    }

    /** Security H2: Validate ticket ID is a positive integer to prevent path traversal / injection */
    const numericId = Number(ticketId.trim());
    if (!Number.isFinite(numericId) || numericId < 1 || !Number.isInteger(numericId)) {
        return NextResponse.json(
            { error: "Invalid ticket ID" },
            { status: 400 }
        );
    }

    const baseUrl = getHelpdeskBaseUrl();
    if (!baseUrl) {
        return NextResponse.json(
            { error: "Helpdesk API not configured" },
            { status: 503 }
        );
    }

    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json(
            { error: "Authorization required" },
            { status: 401 }
        );
    }

    const url = `${baseUrl}/helpdeskrequests/${numericId}`;
    const res = await fetch(url, {
        method: "GET",
        headers: {
            Authorization: authHeader,
            Accept: "application/json",
            "Cache-Control": "no-store",
            Pragma: "no-cache",
        },
    });

    if (!res.ok) {
        const text = await res.text();
        try {
            const json = JSON.parse(text);
            return NextResponse.json(json, { status: res.status });
        } catch {
            return NextResponse.json({ error: text || "Request failed" }, { status: res.status });
        }
    }

    const data = await res.json();
    return NextResponse.json(data);
}
