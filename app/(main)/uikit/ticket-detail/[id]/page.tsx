"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "primereact/button";
import { Panel } from "primereact/panel";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { InputTextarea } from "primereact/inputtextarea";
import { Avatar } from "primereact/avatar";
import { Tag } from "primereact/tag";
import { Image } from "primereact/image";
import NextImage from "next/image";
import { Ticket, AssigneeOption, type AdminAssignUserRow } from "@/app/(main)/uikit/table/types";
import { STATUS_MAP, STATUS_ICON_MAP, STATUS_ICON_FALLBACK } from "@/app/(main)/uikit/table/constants";
import { normalizeHelpdeskRow, unwrapHelpdeskResponse } from "@/app/(main)/uikit/table/normalizeHelpdeskRow";
import type { HelpdeskRowInput } from "@/app/(main)/uikit/table/normalizeHelpdeskRow";
import axiosClientsHelpDesk, { getTokenFromStorage } from "@/config/axiosClientsHelpDesk";
import { env } from "@/config/env";
import { HELPDESK_ENDPOINTS } from "@/config/endpoints";
import { normalizeDataList } from "@/utils/apiNormalizers";
import { useUserProfileStore } from "@/app/store/user/userProfileStore";
import { sanitizeHtml } from "@/utils/sanitizeHtml";
import { decryptId } from "@/lib/crypto";
import { fetchTurningsForSelect } from "@/app/services/ticketService";
import { getHelpdeskFileUrl, getHelpdeskFileUrlAbsolute } from "@/utils/helpdeskFileUrl";
import { getDownloadApiUrl } from "@/utils/downloadFile";
import { authenStore } from "@/app/store/user/loginAuthStore";

/** ແປ statusId ຂອງ assignment ເປັນ PrimeReact Tag severity */
function getAssigneeStatusSeverity(statusId?: number): "success" | "info" | "warning" | "secondary" | "danger" | null {
    if (statusId == null) return null;
    if (statusId === 1) return "warning";   // ລໍຖ້າຮັບວຽກ
    if (statusId === 2) return "info";      // ກຳລັງດຳເນີນການ
    if (statusId === 3) return "success";   // ແກ້ໄຂແລ້ວ
    if (statusId >= 7) return "secondary";  // ປິດວຽກ / ຍົກເລີກ
    return null;
}

/** Role 2 = Admin — ticket-detail ໃຊ້ GET helpdeskrequests/admin ແລ້ວຄົ້ນຫາໂດຍ id */
const ROLE_ID_ADMIN = 2;
/** Role 3 = Staff/Techn — ticket-detail ໃຊ້ GET helpdeskrequests/[id] (ຂໍ້ມູນຈາກ Admin assignedTo) */
const ROLE_ID_STAFF = 3;
/** Role 4 = User — ticket-detail ໃຊ້ GET helpdeskrequests/user ແລ້ວຄົ້ນຫາໂດຍ id */
const ROLE_ID_USER = 4;
/** Role 1, 2 เท่านั้นที่ Backend ອະນຸຍາດ GET users/adminassign — ບໍ່ສົ່ງ request ເມື່ອ role 3, 4 ເພື່ອຫຼີກ 403 */
const ROLE_IDS_CAN_ADMIN_ASSIGN = [1, 2] as const;
/** ສະຖານະທີ່ໃຫ້ເຫັນປຸ່ມ ຮັບວຽກເອງ (ເມື່ອປ່ຽນແລ້ວປຸ່ມຫາຍ — ໃຫ້ຕົງກັບ pageTechn checkbox) */
const STATUS_WAITING_ACCEPT = "ລໍຖ້າຮັບວຽກ";
/** ກຳລັງດຳເນີນການ — ໃຊ້ເມື່ອຮັບວຽກເອງ (เหมือน pageTechn) */
const HELPDESK_STATUS_IN_PROGRESS = 2;

interface ChatMessage {
    id: number;
    message: string;
    senderId?: number | string;
    sender?: {
        employee?: {
            first_name?: string;
            last_name?: string;
        };
    };
    createdAt?: string;
    isDeleted?: boolean;
}

export default function TicketDetailPage() {
    const params = useParams();
    const router = useRouter();
    const roleId = useUserProfileStore((s) => s.currentUser?.roleId ?? null);
    const currentAuthUserId = authenStore((s) => s.authData?.userId ?? null);
    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [loading, setLoading] = useState(true);

    // --- State ควบคุม Sidebar ---
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);

    /** ຕາມ table: ດຶງຈາກ USERS_ADMINASSIGN ແລະກອງເປັນ Staff (roleId === 3) ເທົ່ານັ້ນ */
    const [assignOptions, setAssignOptions] = useState<AssigneeOption[]>([]);
    const [selectedAssignee, setSelectedAssignee] = useState<AssigneeOption | null>(null);

    /** ອີເມວ / ຝ່າຍ / ພະແນກ: ดึงจาก GET users/:id (ຜູ້ປ້ອນຂໍ້ມູນ) */
    const [requesterInfo, setRequesterInfo] = useState<{ email: string; division: string; department: string }>({
        email: "", division: "", department: "",
    });
    /** ອອກລິບມາ: รายการจาก turnings/selectturning ເພື່ອ resolve turningId → name */
    const [turningOptions, setTurningOptions] = useState<{ id: number; name: string }[]>([]);
    const [acceptLoading, setAcceptLoading] = useState(false);
    const [invalidLink, setInvalidLink] = useState(false);
    const toastRef = useRef<Toast | null>(null);

    // --- Chat State ---
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatDialogVisible, setChatDialogVisible] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const [chatSending, setChatSending] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement | null>(null);
    const [editChat, setEditChat] = useState<{ id: number | null; input: string; saving: boolean; visible: boolean }>({
        id: null, input: '', saving: false, visible: false,
    });

    /** ລອງ GET helpdeskrequests/[id] ກ່ອນເພື່ອໃຫ້ໄດ້ຂໍ້ມູນເຕັມລວມ hdFile, hdImgs. ຖ້າ 403/404 ຈຶ່ງ fallback ໃສ່ list (Admin/User). */
    const fetchTicket = useCallback(
        (id: string) => {
            setLoading(true);
            const numId = Number(id);
            const role = roleId != null ? Number(roleId) : null;

            return axiosClientsHelpDesk
                .get(HELPDESK_ENDPOINTS.requestById(id))
                .then((response) => {
                    const row = unwrapHelpdeskResponse<HelpdeskRowInput>(response.data);
                    setTicket(row ? normalizeHelpdeskRow(row) : null);
                })
                .catch((err) => {
                    const status = err?.response?.status;
                    if ((status === 403 || status === 404) && (role === ROLE_ID_ADMIN || role === ROLE_ID_USER)) {
                        const endpoint = role === ROLE_ID_ADMIN ? HELPDESK_ENDPOINTS.REQUESTS_ADMIN : HELPDESK_ENDPOINTS.REQUESTS_USER;
                        return axiosClientsHelpDesk.get(endpoint).then((res) => {
                            const list = normalizeDataList<HelpdeskRowInput>(res.data);
                            const row = list.find((r) => Number(r.id) === numId) ?? null;
                            setTicket(row ? normalizeHelpdeskRow(row) : null);
                        });
                    }
                    setTicket(null);
                })
                .finally(() => setLoading(false));
        },
        [roleId]
    );

    /**
     * Parallel init: fire assignOptions + turnings in a single effect
     * instead of 2 sequential useEffect waterfalls.
     */
    useEffect(() => {
        let cancelled = false;
        const canCallAdmin = roleId != null && ROLE_IDS_CAN_ADMIN_ASSIGN.includes(roleId as 1 | 2);

        const assignPromise = canCallAdmin
            ? axiosClientsHelpDesk.get(HELPDESK_ENDPOINTS.USERS_ADMINASSIGN).catch(() => null)
            : Promise.resolve(null);

        const turningsPromise = fetchTurningsForSelect().catch(() => [] as { code: string; name: string }[]);

        Promise.all([assignPromise, turningsPromise]).then(([assignRes, turningsList]) => {
            if (cancelled) return;
            if (assignRes) {
                const list = normalizeDataList<AdminAssignUserRow>(assignRes.data);
                const staff = list.filter((u) => Number(u.roleId) === ROLE_ID_STAFF);
                const options: AssigneeOption[] = staff.map((u) => {
                    const first = u.employee?.first_name ?? "";
                    const last = u.employee?.last_name ?? "";
                    const label = [first, last].filter(Boolean).join(" ").trim() || String(u.id);
                    return { id: u.id, label };
                });
                setAssignOptions(options);
            } else {
                setAssignOptions([]);
            }
            const options = (turningsList as { code: string; name: string }[]).map((item) => ({
                id: Number(item.code),
                name: item.name,
            })).filter((o) => Number.isFinite(o.id));
            setTurningOptions(options);
        });

        return () => { cancelled = true; };
    }, [roleId]);

    useEffect(() => {
        const encodedId = params.id;
        if (!encodedId || typeof encodedId !== "string") {
            setInvalidLink(true);
            setTicket(null);
            setLoading(false);
            return;
        }
        const ticketId = decryptId(encodedId);
        if (!ticketId) {
            setInvalidLink(true);
            setTicket(null);
            setLoading(false);
            return;
        }
        fetchTicket(ticketId);
    }, [params.id, fetchTicket]);

    const handleAcceptWork = useCallback(() => {
        if (!ticket || ticket.status !== STATUS_WAITING_ACCEPT) return;
        const id = Number(ticket.id);
        if (!Number.isFinite(id)) return;
        setAcceptLoading(true);
        axiosClientsHelpDesk
            .put(HELPDESK_ENDPOINTS.updateHelpdeskStatus(id), { helpdeskStatusId: HELPDESK_STATUS_IN_PROGRESS })
            .then(() => {
                toastRef.current?.show({
                    severity: "success",
                    summary: "ສຳເລັດ",
                    detail: "ຮັບວຽກເອງສຳເລັດ ສະຖານະເປັນກຳລັງດຳເນີນການ",
                    life: 3000,
                });
                return fetchTicket(String(id));
            })
            .catch(() => {
                toastRef.current?.show({
                    severity: "error",
                    summary: "ຜິດພາດ",
                    detail: "ຮັບວຽກເອງບໍ່ສຳເລັດ",
                    life: 4000,
                });
            })
            .finally(() => setAcceptLoading(false));
    }, [ticket, fetchTicket]);

    /** ดึง ອີເມວ, ຝ່າຍ, ພະແນກ ของຜູ້ປ້ອນຂໍ້ມູນ (GET users/:id) */
    useEffect(() => {
        const empty = { email: "", division: "", department: "" };
        if (!ticket?.employeeId) {
            setRequesterInfo(empty);
            return;
        }
        const userId = String(ticket.employeeId);
        axiosClientsHelpDesk
            .get(HELPDESK_ENDPOINTS.USER_BY_ID(userId), {
                params: { _ts: Date.now() },
                headers: { "Cache-Control": "no-store", Pragma: "no-cache" },
            })
            .then((res) => {
                const raw = res.data?.data ?? res.data;
                if (!raw || typeof raw !== "object") return;
                const obj = raw as {
                    email?: string;
                    employee?: {
                        email?: string;
                        department?: { department_name?: string };
                        division?: { division_name?: string };
                    };
                };
                const email = obj.employee?.email ?? obj.email;
                const divName = obj.employee?.division?.division_name;
                const deptName = obj.employee?.department?.department_name;
                setRequesterInfo({
                    email: email != null && String(email).trim() !== "" ? String(email).trim() : "",
                    division: divName != null && String(divName).trim() !== "" ? String(divName).trim() : "",
                    department: deptName != null && String(deptName).trim() !== "" ? String(deptName).trim() : "",
                });
            })
            .catch(() => setRequesterInfo(empty));
    }, [ticket?.employeeId]);

    // --- Chat: fetch history ---
    const fetchChatHistory = useCallback(() => {
        if (!ticket?.id) return;
        axiosClientsHelpDesk
            .get(HELPDESK_ENDPOINTS.CHATS, { params: { helpdeskRequestId: ticket.id } })
            .then((res) => {
                const raw = res.data;
                const list: ChatMessage[] = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
                list.sort((a, b) => new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime());
                setChatMessages(list);
            })
            .catch(() => {});
    }, [ticket?.id]);

    // --- Chat: SSE real-time connection ---
    useEffect(() => {
        if (!ticket?.id) return;
        fetchChatHistory();

        const baseUrl = env.useHelpdeskProxy ? '/api/helpdesk-proxy' : env.helpdeskApiUrl;
        const token = getTokenFromStorage();
        if (!token) return;
        const sseParams = new URLSearchParams({ helpdeskRequestId: String(ticket.id), token });
        const sseUrl = [baseUrl, HELPDESK_ENDPOINTS.CHATS_SSE].join('/') + '?' + sseParams.toString();

        let es: EventSource | null = null;
        try {
            es = new EventSource(sseUrl);
            es.onmessage = (event) => {
                try {
                    const msg: ChatMessage = JSON.parse(event.data);
                    setChatMessages((prev) => {
                        if (prev.some((m) => m.id === msg.id)) return prev;
                        return [...prev, msg].sort((a, b) => new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime());
                    });
                } catch { /* ignore parse errors */ }
            };
            es.onerror = () => {
                es?.close();
            };
        } catch { /* ignore SSE init errors */ }

        return () => { es?.close(); };
    }, [ticket?.id, fetchChatHistory]);

    // --- Chat: auto-scroll within container only (no page scroll) ---
    useEffect(() => {
        const el = chatContainerRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [chatMessages]);

    // --- Chat: send message ---
    const sendChatMessage = useCallback(async () => {
        if (!ticket?.id || !chatInput.trim()) return;
        setChatSending(true);
        try {
            await axiosClientsHelpDesk.post(HELPDESK_ENDPOINTS.CHATS, {
                helpdeskRequestId: Number(ticket.id),
                message: chatInput.trim(),
            });
            setChatInput('');
            setChatDialogVisible(false);
            fetchChatHistory();
        } catch {
            toastRef.current?.show({
                severity: 'error',
                summary: 'ຜິດພາດ',
                detail: 'ສົ່ງຂໍ້ຄວາມບໍ່ສຳເລັດ',
                life: 4000,
            });
        } finally {
            setChatSending(false);
        }
    }, [ticket?.id, chatInput, fetchChatHistory]);

    // --- Chat: delete message ---
    const deleteChat = useCallback(async (chatId: number) => {
        try {
            await axiosClientsHelpDesk.delete(`${HELPDESK_ENDPOINTS.CHATS}/${chatId}`);
            setChatMessages((prev) => prev.map((m) => m.id === chatId ? { ...m, isDeleted: true, message: 'ຂໍ້ຄວາມນີ້ຖືກລົບ' } : m));
        } catch {
            toastRef.current?.show({ severity: 'error', summary: 'ຜິດພາດ', detail: 'ລົບຂໍ້ຄວາມບໍ່ສຳເລັດ', life: 4000 });
        }
    }, []);

    // --- Chat: update message ---
    const updateChat = useCallback(async () => {
        if (editChat.id == null || !editChat.input.trim()) return;
        setEditChat((prev) => ({ ...prev, saving: true }));
        try {
            await axiosClientsHelpDesk.put(`${HELPDESK_ENDPOINTS.CHATS}/${editChat.id}`, { message: editChat.input.trim() });
            const savedMsg = editChat.input.trim();
            const savedId = editChat.id;
            setChatMessages((prev) => prev.map((m) => m.id === savedId ? { ...m, message: savedMsg } : m));
            setEditChat({ id: null, input: '', saving: false, visible: false });
        } catch {
            toastRef.current?.show({ severity: 'error', summary: 'ຜິດພາດ', detail: 'ແກ້ໄຂຂໍ້ຄວາມບໍ່ສຳເລັດ', life: 4000 });
            setEditChat((prev) => ({ ...prev, saving: false }));
        }
    }, [editChat.id, editChat.input]);

    if (invalidLink) return <div className="p-4 text-xl">ລິ້ງຄ໌ບໍ່ຖືກຕ້ອງ ຫຼືໝົດອາຍຸ</div>;
    if (loading) return <div className="p-4 text-xl">ກໍາລັງໂຫຼດຂໍ້ມູນ...</div>;
    if (!ticket) return <div className="p-4 text-xl">ບໍ່ພົບຂໍ້ມູນ Ticket</div>;

    const requesterName = ticket.requester || `${ticket.firstname_req || ''} ${ticket.lastname_req || ''}`.trim();

    return (
        <div className="surface-ground px-4 py-5 md:px-6 lg:px-8">
            <Toast ref={toastRef} position="top-center" />
            <div className="surface-card shadow-2 border-round bg-white overflow-hidden">
                <div className="grid list-none m-0">

                    {/* --- LEFT COLUMN (Content) --- */}
                    <div className={`col-12 ${isSidebarVisible ? 'md:col-9' : 'md:col-12'} p-4 md:p-5 transition-all transition-duration-300`}>

                        {/* TOP TOOLBAR */}
                        <div className="flex flex-column md:flex-row align-items-center justify-content-between mb-4">
                            <div className="flex align-items-center gap-2 w-full md:w-auto">
                                <Button
                                    icon="pi pi-arrow-left"
                                    outlined
                                    severity="secondary"
                                    className="border-1 border-300 text-700"
                                    onClick={() => router.back()}
                                />
                                {roleId !== ROLE_ID_STAFF && roleId !== ROLE_ID_USER && !(roleId === ROLE_ID_ADMIN && (ticket.assignees?.length ?? 0) > 0) && (
                                    <Dropdown
                                        value={selectedAssignee}
                                        onChange={(e) => setSelectedAssignee(e.value)}
                                        options={assignOptions}
                                        optionLabel="label"
                                        placeholder="ມອບໝາຍວຽກ"
                                        className="w-16rem"
                                        emptyMessage="ບໍ່ພົບລາຍຊື່"
                                        pt={{ root: { className: 'border-1 border-300' } }}
                                    />
                                )}
                                {ticket.status === STATUS_WAITING_ACCEPT && (
                                    <Button
                                        label="ຮັບວຽກເອງ"
                                        icon="pi pi-check"
                                        className="surface-700 border-none text-white hover:surface-800"
                                        loading={acceptLoading}
                                        disabled={acceptLoading}
                                        onClick={handleAcceptWork}
                                    />
                                )}
                            </div>

                            <div className="flex align-items-center gap-2 mt-3 md:mt-0 w-full md:w-auto justify-content-end">
                                {/* ปุ่ม Toggle Sidebar */}
                                <Button
                                    icon={isSidebarVisible ? "pi pi-chevron-right" : "pi pi-chevron-left"}
                                    outlined
                                    severity="secondary"
                                    className="border-1 border-300 text-700"
                                    onClick={() => setIsSidebarVisible(!isSidebarVisible)}
                                    tooltip={isSidebarVisible ? "ປິດແຖບຂໍ້ມູນ" : "ສະແດງແຖບຂໍ້ມູນ"}
                                    tooltipOptions={{ position: 'bottom' }}
                                />
                            </div>
                        </div>

                        {/* HEADER TITLE */}
                        <div className="mb-4">
                            <h2 className="m-0 text-900 font-bold text-2xl mb-2">#{ticket.id} {ticket.title}</h2>
                            <span className="text-600 text-sm">
                                ໂດຍ: [{ticket.emp_code ?? ''}]-{requesterName} | ເວລາ: {ticket.date}
                            </span>
                        </div>

                        {/* CONTENT */}
                        <div className="flex flex-column gap-3 mt-3 -mx-3 md:-mx-4">

                                    <Panel header="ລາຍລະອຽດ" toggleable className="border-top-1 border-yellow-500 shadow-none border-1 surface-border border-round-none">
                                        <div className="m-0 text-700 line-height-3 text-base px-3 md:px-4">
                                            {(ticket.details ?? ticket.description) ? (
                                                <div dangerouslySetInnerHTML={{ __html: sanitizeHtml((ticket.details ?? ticket.description) ?? '') }} />
                                            ) : (
                                                <div className="text-500">ບໍ່ມີລາຍລະອຽດເພີ່ມເຕີມ</div>
                                            )}
                                        </div>
                                    </Panel>

                                    <Panel
                                        headerTemplate={(options) => {
                                            const toggleIcon = options.collapsed ? 'pi pi-chevron-down' : 'pi pi-chevron-up';
                                            return (
                                                <div className="flex align-items-center justify-content-between w-full px-3 py-2">
                                                    <div className="flex align-items-center gap-2 cursor-pointer" onClick={options.onTogglerClick}>
                                                        <i className={toggleIcon} style={{ fontSize: '0.85rem' }} />
                                                        <span className="font-bold text-900">ສົນທະນາ</span>
                                                    </div>
                                                    <Button
                                                        label="ແຊັດຫາ +"
                                                        icon="pi pi-plus"
                                                        size="small"
                                                        className="p-button-outlined p-button-sm"
                                                        style={{ height: '28px', fontSize: '12px' }}
                                                        onClick={(e) => { e.stopPropagation(); setChatDialogVisible(true); }}
                                                    />
                                                </div>
                                            );
                                        }}
                                        toggleable
                                        className="border-top-1 border-yellow-500 shadow-none border-1 surface-border border-round-none"
                                    >
                                        <div ref={chatContainerRef} style={{ maxHeight: '400px', overflowY: 'auto' }} className="px-3 md:px-4 py-2">
                                            {chatMessages.length === 0 ? (
                                                <div className="text-500 text-base italic py-4">ຍັງບໍ່ມີການສົນທະນາ</div>
                                            ) : (
                                                chatMessages.map((msg) => {
                                                    const senderName = [msg.sender?.employee?.first_name, msg.sender?.employee?.last_name].filter(Boolean).join(' ') || 'Unknown';
                                                    const initials = senderName.substring(0, 2).toUpperCase();
                                                    const isOwner = currentAuthUserId != null && msg.senderId != null && String(msg.senderId) === String(currentAuthUserId);
                                                    const deleted = !!msg.isDeleted;
                                                    return (
                                                        <div
                                                            key={msg.id}
                                                            className={`flex align-items-start gap-2 mb-3 ${isOwner ? '' : 'flex-row-reverse'}`}
                                                        >
                                                            <Avatar
                                                                label={initials}
                                                                shape="circle"
                                                                size="normal"
                                                                style={{
                                                                    backgroundColor: isOwner ? '#3b82f6' : '#8b5cf6',
                                                                    color: '#fff',
                                                                    flexShrink: 0,
                                                                }}
                                                            />
                                                            <div className={`flex flex-column flex-1 min-w-0 ${isOwner ? '' : 'align-items-end'}`}>
                                                                <span className="font-bold text-900 text-sm mb-1">{senderName}</span>
                                                                <div className={`flex align-items-center gap-1 ${isOwner ? '' : 'flex-row-reverse'}`}>
                                                                    <div
                                                                        className={`border-round p-3 text-base line-height-3 ${deleted ? 'text-500 italic surface-200' : (isOwner ? 'surface-100 text-700' : 'bg-purple-50 text-800')}`}
                                                                        style={{ wordBreak: 'break-word', maxWidth: '85%' }}
                                                                    >
                                                                        {deleted ? 'ຂໍ້ຄວາມນີ້ຖືກລົບ' : msg.message}
                                                                    </div>
                                                                    {isOwner && !deleted && (
                                                                        <div className="flex flex-column gap-1" style={{ flexShrink: 0 }}>
                                                                            <Button
                                                                                icon="pi pi-pencil"
                                                                                rounded
                                                                                text
                                                                                severity="secondary"
                                                                                style={{ width: '1.8rem', height: '1.8rem' }}
                                                                                tooltip="ແກ້ໄຂ"
                                                                                tooltipOptions={{ position: 'top' }}
                                                                                onClick={() => setEditChat({ id: msg.id, input: msg.message, saving: false, visible: true })}
                                                                            />
                                                                            <Button
                                                                                icon="pi pi-trash"
                                                                                rounded
                                                                                text
                                                                                severity="danger"
                                                                                style={{ width: '1.8rem', height: '1.8rem' }}
                                                                                tooltip="ລົບ"
                                                                                tooltipOptions={{ position: 'top' }}
                                                                                onClick={() => deleteChat(msg.id)}
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </Panel>

                                    <Panel header="ຂໍ້ມູນອຸປະກອນ ແລະ ລາຍລະອຽດເພີ່ມເຕີມ" toggleable className="border-top-1 border-yellow-500 shadow-none border-1 surface-border border-round-none">
                                        <div className="flex flex-column gap-4 py-3 px-3 md:px-4">
                                            {ticket.hdFile && (
                                                <div>
                                                    <span className="text-900 font-bold text-base block mb-2">ໄຟລ໌ PDF</span>
                                                    <a
                                                        href={getDownloadApiUrl(getHelpdeskFileUrlAbsolute("hdFile", ticket.hdFile) || getHelpdeskFileUrl("hdFile", ticket.hdFile), ticket.hdFile)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex align-items-center gap-2 text-primary no-underline hover:underline"
                                                    >
                                                        <i className="pi pi-file-pdf" />
                                                        {ticket.hdFile}
                                                    </a>
                                                </div>
                                            )}
                                            {(() => {
                                                const fromTicket = ticket.hdImgs && ticket.hdImgs.length > 0 ? ticket.hdImgs : null;
                                                const fromRaw = (ticket._raw as { hdImgs?: { id?: number; helpdeskRequestId?: number; hdImg?: string }[] } | undefined)?.hdImgs;
                                                const list = fromTicket ?? (Array.isArray(fromRaw) ? fromRaw.filter((i) => i != null && typeof (i as { hdImg?: string }).hdImg === "string").map((i) => ({ id: (i as { id?: number }).id ?? 0, helpdeskRequestId: (i as { helpdeskRequestId?: number }).helpdeskRequestId ?? 0, hdImg: String((i as { hdImg: string }).hdImg) })) : []);
                                                return list.length > 0 ? (
                                                    <div>
                                                        <span className="text-900 font-bold text-base block mb-2">ຮູບພາບ</span>
                                                        <div className="flex flex-wrap gap-3">
                                                            {list.map((img) => {
                                                                const imgUrlAbs = getHelpdeskFileUrlAbsolute("hdImgs", img.hdImg) || getHelpdeskFileUrl("hdImgs", img.hdImg);
                                                                const imgSrc = getDownloadApiUrl(imgUrlAbs, img.hdImg, "inline");
                                                                const downloadUrl = getDownloadApiUrl(imgUrlAbs, img.hdImg, "attachment");
                                                                return (
                                                                    <div
                                                                        key={`${img.id}-${img.hdImg}`}
                                                                        className="block border-1 surface-border border-round overflow-hidden surface-50"
                                                                        style={{ maxWidth: 200 }}
                                                                    >
                                                                        <NextImage
                                                                            src={imgSrc}
                                                                            alt={img.hdImg}
                                                                            width={200}
                                                                            height={180}
                                                                            className="w-full block"
                                                                            style={{ maxHeight: 180, objectFit: "cover", height: 'auto' }}
                                                                            unoptimized
                                                                        />
                                                                        <a
                                                                            href={downloadUrl}
                                                                            target="_blanklf"
                                                                            rel="noopener noreferrer"
                                                                            className="block text-center p-2 text-primary text-sm hover:underline"
                                                                        >
                                                                            ດາວໂຫຼດ
                                                                        </a>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ) : null;
                                            })()}
                                            {!ticket.hdFile && !(ticket.hdImgs?.length || (Array.isArray((ticket._raw as unknown as { hdImgs?: unknown[] })?.hdImgs) && (ticket._raw as unknown as { hdImgs: unknown[] }).hdImgs.length > 0)) && (
                                                <div className="text-500 text-base italic">ບໍ່ມີໄຟລ໌ PDF ຫຼື ຮູບພາບ</div>
                                            )}
                                        </div>
                                    </Panel>

                                    {/* Panel: Internal Repair */}
                                    <Panel
                                        header="ຫນ່ວຍງານສ້ອມແປງພາຍໃນ"
                                        toggleable
                                        className="border-top-1 border-yellow-500 shadow-none border-1 surface-border border-round-none"
                                    >
                                        <div className="m-0 px-3 md:px-4 py-2">
                                            <div className="text-700 font-bold mb-3 text-base">ວິຊາການກວດກາ:</div>
                                            <ul className="list-none p-0 m-0">
                                                {ticket.assignees && ticket.assignees.length > 0 ? (
                                                    ticket.assignees.map((assignee: any, index: number) => (
                                                        <li key={assignee.id ?? index} className="py-2 border-bottom-1 surface-border last:border-none">
                                                            <div className="flex align-items-center justify-content-between gap-2 mb-1">
                                                                <span className="text-700 text-base font-medium">
                                                                    <i className="pi pi-user text-400 mr-2"></i>
                                                                    {assignee.name}{assignee.phone ? ` | ${assignee.phone}` : ''}
                                                                </span>
                                                                {assignee.helpdeskStatusName && (
                                                                    <Tag
                                                                        value={assignee.helpdeskStatusName}
                                                                        severity={getAssigneeStatusSeverity(assignee.statusId)}
                                                                        className="text-xs white-space-nowrap flex-shrink-0"
                                                                    />
                                                                )}
                                                            </div>
                                                            {(assignee.comment || assignee.commentImg) && (
                                                                <div className="mt-2 pl-3 border-left-2 border-300">
                                                                    {assignee.comment && (
                                                                        <p className="m-0 text-500 text-sm">
                                                                            <span className="font-medium text-600">ລາຍລະອຽດການກວດກາ ແລະ ສ້ອມແປງ:</span> {assignee.comment}
                                                                        </p>
                                                                    )}
                                                                    {assignee.commentImg && (() => {
                                                                        const name = (assignee.commentImg ?? '').trim().replace(/^\//, '');
                                                                        if (!name) return null;
                                                                        const base = (env.helpdeskUploadRequestBaseUrl ?? '').trim();
                                                                        const src = base
                                                                            ? `${base}/commentimg/${encodeURIComponent(name)}`
                                                                            : env.useHelpdeskProxy
                                                                                ? `/api/proxy-helpdesk/upload/commentimg/${encodeURIComponent(name)}`
                                                                                : '';
                                                                        if (!src) return null;
                                                                        return (
                                                                            <Image
                                                                                src={src}
                                                                                alt="repair-img"
                                                                                preview
                                                                                className="mt-2"
                                                                                style={{ display: 'inline-block', maxWidth: '100%' }}
                                                                                imageClassName="border-round border-1 surface-border"
                                                                                imageStyle={{ maxHeight: '180px', objectFit: 'contain', display: 'block' }}
                                                                            />
                                                                        );
                                                                    })()}
                                                                </div>
                                                            )}
                                                        </li>
                                                    ))
                                                ) : (
                                                    <div className="text-500 italic text-base">ຍັງບໍ່ມີຜູ້ຮັບຜິດຊອບ</div>
                                                )}
                                            </ul>
                                        </div>
                                    </Panel>


                        </div>
                    </div>

                    {/* --- RIGHT COLUMN: Sidebar --- */}
                    {isSidebarVisible && (
                        <div className="col-12 md:col-3 p-4 md:p-4 surface-border md:border-left-1 surface-50 md:surface-0 fadein animation-duration-300">

                            {/* Card 1: Requester Info */}
                            <div className="mb-4">
                                <div className="text-blue-600 font-bold text-xl mb-2 border-bottom-1 surface-border pb-2">
                                    ພາກສ່ວນຮ້ອງຂໍ
                                </div>

                                <ul className="list-none p-0 m-0 text-sm">
                                    <li className="flex align-items-center gap-2 py-2 border-bottom-1 surface-border">
                                        <span className="text-900 font-bold flex-shrink-0">ສະຖານະ </span>
                                        <div className="flex align-items-center gap-2 flex-1 min-w-0">
                                            {(() => {
                                                const severity = STATUS_MAP[ticket.status] ?? null;
                                                const iconClass = STATUS_ICON_MAP[ticket.status] ?? STATUS_ICON_MAP[ticket.status?.trim() ?? ''] ?? STATUS_ICON_FALLBACK;
                                                const textColor = severity === 'success' ? 'text-green-600' : severity === 'info' ? 'text-blue-600' : severity === 'warning' ? 'text-orange-600' : severity === 'danger' ? 'text-red-600' : 'text-700';
                                                return (
                                                    <>
                                                        <i className={`${iconClass} ${textColor} flex-shrink-0`} style={{ fontSize: '1rem' }} />
                                                        <span className={`font-medium ${textColor} min-w-0`}>{ticket.status || '—'}</span>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </li>
                                    <li className="flex align-items-start gap-2 py-2 border-bottom-1 surface-border">
                                        <span className="text-900 font-bold flex-shrink-0">ວັນທີຮ້ອງຂໍ : </span>
                                        <span className="text-700 flex-1 min-w-0">{ticket.date}</span>
                                    </li>
                                    <li className="flex align-items-start gap-2 py-2 border-bottom-1 surface-border">
                                        <span className="text-900 font-bold flex-shrink-0">ຜູ້ຮ້ອງຂໍ : </span>
                                        <span className="text-700 flex-1 min-w-0">[{ticket.emp_code ?? ''}]-{requesterName}</span>
                                    </li>
                                    <li className="flex align-items-start gap-2 py-2 border-bottom-1 surface-border">
                                        <span className="text-900 font-bold flex-shrink-0">ຝ່າຍ : </span>
                                        <span className="text-700 flex-1 min-w-0">{ticket.division || requesterInfo.division || '-'}</span>
                                    </li>
                                    <li className="flex align-items-start gap-2 py-2 border-bottom-1 surface-border">
                                        <span className="text-900 font-bold flex-shrink-0">ພະແນກ :</span>
                                        <span className="text-700 flex-1 min-w-0">{ticket.department || requesterInfo.department || '-'}</span>
                                    </li>
                                    <li className="flex align-items-start gap-2 py-2 border-bottom-1 surface-border">
                                        <span className="text-900 font-bold flex-shrink-0">ເລກ ຊຄທ : </span>
                                        <span className="text-700 flex-1 min-w-0">{ticket.numberSKT ?? '-'}</span>
                                    </li>
                                    <li className="flex align-items-start gap-2 py-2 border-bottom-1 surface-border">
                                        <span className="text-900 font-bold flex-shrink-0">ສະຖານທີ່ :</span>
                                        <span className="text-700 flex-1 min-w-0">{ticket.building || 'ຕຶກສໍານັກງານໃຫຍ່'}</span>
                                    </li>
                                    <li className="flex align-items-start gap-2 py-2 border-bottom-1 surface-border">
                                        <span className="text-900 font-bold flex-shrink-0">ຊັ້ນ :</span>
                                        <span className="text-700 flex-1 min-w-0">{ticket.level || 'ຊັ້ນ-05'}</span>
                                    </li>
                                    <li className="flex align-items-start gap-2 py-2 border-bottom-1 surface-border">
                                        <span className="text-900 font-bold flex-shrink-0">ຫ້ອງ :</span>
                                        <span className="text-700 font-bold flex-1 min-w-0">{ticket.room || '502'}</span>
                                    </li>
                                    <li className="flex align-items-start gap-2 py-2 border-bottom-1 surface-border">
                                        <span className="text-900 font-bold flex-shrink-0">ອອກລິບມາ :</span>
                                        <span className="text-700 flex-1 min-w-0">
                                            {ticket.turning ??
                                                (ticket.turningId != null && turningOptions.length > 0
                                                    ? (turningOptions.find((t) => t.id === ticket.turningId)?.name ?? '-')
                                                    : '-')}
                                        </span>
                                    </li>
                                    <li className="flex align-items-start gap-2 py-2 border-bottom-1 surface-border">
                                        <span className="text-900 font-bold flex-shrink-0">ເບີໂທ :</span>
                                        <span className="text-700 flex-1 min-w-0">{ticket.contactPhone || '020 9999 9999'}</span>
                                    </li>
                                    <li className="flex align-items-start gap-2 py-2">
                                        <span className="text-900 font-bold flex-shrink-0">ອີເມວ :</span>
                                        <span className="text-700 flex-1 min-w-0" style={{ wordBreak: 'break-all' }}>{requesterInfo.email}</span>
                                    </li>
                                </ul>
                            </div>

                            {/* Card 2: External Repair */}
                            <div className="mt-4 -mx-4">
                                <Panel
                                    header="ຮ້ານແປງນອກ"
                                    toggleable
                                    className="shadow-none border-y-1 border-x-none border-noround surface-border"
                                >
                                    <ul className="list-none p-0 m-0 text-base">
                                        <li className="flex align-items-center justify-content-between py-2">
                                            <span className="text-700 font-bold">ຮ້ານທີ່ສັ່ງແປງ:</span>
                                        </li>
                                        <li className="flex align-items-center justify-content-between py-2">
                                            <span className="text-700 font-bold">ເລກທີໃບນຳສ່ງ:</span>
                                        </li>
                                        <li className="flex align-items-center justify-content-between py-2">
                                            <span className="text-700 font-bold">ວັນທີສັ່ງ:</span>
                                        </li>
                                        <li className="flex align-items-center justify-content-between py-2">
                                            <span className="text-700 font-bold">ສະຖານະ:</span>
                                        </li>
                                    </ul>
                                </Panel>
                            </div>

                        </div>
                    )}
                </div>
            </div>

            {/* --- Chat Dialog --- */}
            <Dialog
                header="ສົນທະນາ"
                visible={chatDialogVisible}
                style={{ width: '500px' }}
                onHide={() => { setChatDialogVisible(false); setChatInput(''); }}
                modal
                draggable={false}
            >
                <div className="flex flex-column gap-3">
                    <InputTextarea
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        rows={4}
                        autoResize
                        placeholder="ພິມຂໍ້ຄວາມ..."
                        className="w-full"
                    />
                    {chatInput.trim() !== '' && (
                        <div className="flex justify-content-end">
                            <Button
                                label="Send"
                                icon="pi pi-telegram"
                                loading={chatSending}
                                disabled={chatSending}
                                onClick={sendChatMessage}
                            />
                        </div>
                    )}
                </div>
            </Dialog>

            {/* --- Edit Chat Dialog --- */}
            <Dialog
                header="ແກ້ໄຂຂໍ້ຄວາມ"
                visible={editChat.visible}
                style={{ width: '500px' }}
                onHide={() => setEditChat({ id: null, input: '', saving: false, visible: false })}
                modal
                draggable={false}
            >
                <div className="flex flex-column gap-3">
                    <InputTextarea
                        value={editChat.input}
                        onChange={(e) => setEditChat((prev) => ({ ...prev, input: e.target.value }))}
                        rows={4}
                        autoResize
                        placeholder="ແກ້ໄຂຂໍ້ຄວາມ..."
                        className="w-full"
                    />
                    {editChat.input.trim() !== '' && (
                        <div className="flex justify-content-end">
                            <Button
                                label="ບັນທຶກ"
                                icon="pi pi-check"
                                loading={editChat.saving}
                                disabled={editChat.saving}
                                onClick={updateChat}
                            />
                        </div>
                    )}
                </div>
            </Dialog>
        </div>
    );
}
