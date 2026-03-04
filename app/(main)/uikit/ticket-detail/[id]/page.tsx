"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "primereact/button";
import { Panel } from "primereact/panel";
import { Dropdown } from "primereact/dropdown";
import { TabView, TabPanel } from "primereact/tabview";
import { Toast } from "primereact/toast";
import { Ticket } from "@/app/(main)/uikit/table/types";
import { STATUS_MAP, STATUS_ICON_MAP, STATUS_ICON_FALLBACK } from "@/app/(main)/uikit/table/constants";
import { normalizeHelpdeskRow, unwrapHelpdeskResponse } from "@/app/(main)/uikit/table/normalizeHelpdeskRow";
import type { HelpdeskRowInput } from "@/app/(main)/uikit/table/normalizeHelpdeskRow";
import axiosClientsHelpDesk from "@/config/axiosClientsHelpDesk";
import { HELPDESK_ENDPOINTS } from "@/config/endpoints";
import { useUserProfileStore } from "@/app/store/user/userProfileStore";
import { sanitizeHtml } from "@/utils/sanitizeHtml";

/** Role 3 = Staff — ບໍ່ໃຫ້ເຫັນ ມອບໝາຍວຽກ */
const ROLE_ID_STAFF = 3;
/** ສະຖານະທີ່ໃຫ້ເຫັນປຸ່ມ ຮັບວຽກເອງ (ເມື່ອປ່ຽນແລ້ວປຸ່ມຫາຍ — ໃຫ້ຕົງກັບ pageTechn checkbox) */
const STATUS_WAITING_ACCEPT = "ລໍຖ້າຮັບວຽກ";
/** ກຳລັງດຳເນີນການ — ໃຊ້ເມື່ອຮັບວຽກເອງ (เหมือน pageTechn) */
const HELPDESK_STATUS_IN_PROGRESS = 2;

export default function TicketDetailPage() {
    const params = useParams();
    const router = useRouter();
    const roleId = useUserProfileStore((s) => s.currentUser?.roleId ?? null);
    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [loading, setLoading] = useState(true);

    // --- State ควบคุม Sidebar ---
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);

    const [technicians, setTechnicians] = useState([]);
    const [selectedAssignee, setSelectedAssignee] = useState(null);

    /** ອີເມວ: ดึงจาก endpoint เดียวกับ profileUser (GET users/:id) */
    const [requesterEmail, setRequesterEmail] = useState<string>("");
    const [acceptLoading, setAcceptLoading] = useState(false);
    const toastRef = useRef<Toast | null>(null);

    const fetchTicket = useCallback((id: string) => {
        setLoading(true);
        return axiosClientsHelpDesk
            .get(HELPDESK_ENDPOINTS.requestById(id))
            .then((response) => {
                const row = unwrapHelpdeskResponse<HelpdeskRowInput>(response.data);
                const normalized = row ? normalizeHelpdeskRow(row) : null;
                setTicket(normalized);
            })
            .catch(() => setTicket(null))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        const id = params.id;
        if (!id || typeof id !== "string") return;
        fetchTicket(id);
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

    /** ดึง ອີເມວ จาก GET users/:id (endpoint เดียวกับ profileUser) */
    useEffect(() => {
        if (!ticket?.employeeId) {
            setRequesterEmail("");
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
                const email =
                    (raw && typeof raw === "object" && (raw as { employee?: { email?: string } }).employee?.email) ??
                    (raw && typeof raw === "object" ? (raw as { email?: string }).email : null);
                setRequesterEmail(email != null && String(email).trim() !== "" ? String(email).trim() : "");
            }) 
            .catch(() => setRequesterEmail(""));
    }, [ticket?.employeeId]);

    if (loading) return <div className="p-4 text-xl">ກໍາລັງໂຫຼດຂໍ້ມູນ...</div>;
    if (!ticket) return <div className="p-4 text-xl">ບໍ່ພົບຂໍ້ມູນ Ticket ID: {params.id}</div>;

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
                                {roleId !== ROLE_ID_STAFF && (
                                    <Dropdown
                                        value={selectedAssignee}
                                        onChange={(e) => setSelectedAssignee(e.value)}
                                        options={technicians}
                                        optionLabel="name"
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
                                <Button
                                    label="ຕອບກັບ"
                                    icon="pi pi-reply"
                                    severity="success"
                                    className="bg-green-500 border-green-500 hover:bg-green-600"
                                />

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
                            <h2 className="m-0 text-900 font-bold text-3xl mb-2">#{ticket.id} {ticket.title}</h2>
                            <span className="text-600 text-base">
                                ໂດຍ: [{ticket.emp_code ?? ''}]-{requesterName} | ເວລາ: {ticket.date}
                            </span>
                        </div>

                        {/* TABS */}
                        <TabView className="p-0 custom-tabview text-lg">
                            <TabPanel header="ລາຍລະອຽດ" leftIcon="pi pi-list mr-2">
                                <div className="flex flex-column gap-3 mt-3 -mx-3 md:-mx-4">

                                    <Panel header="ລາຍລະອຽດ" toggleable className="border-top-1 border-yellow-500 shadow-none border-1 surface-border border-round-none">
                                        <div className="m-0 text-700 line-height-3 text-base px-3 md:px-4">
                                            {ticket.description ? (
                                                <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(ticket.description) }} />
                                            ) : (
                                                <div className="text-500">ບໍ່ມີລາຍລະອຽດເພີ່ມເຕີມ</div>
                                            )}
                                        </div>
                                    </Panel>

                                    <Panel header="ການສົນທະນາ" toggleable className="border-top-1 border-yellow-500 shadow-none border-1 surface-border border-round-none">
                                        <div className="text-500 text-base italic py-4 px-3 md:px-4">
                                            ພື້ນທີ່ສໍາລັບການສະແດງລາຍການສົນທະນາ... (ກໍາລັງອັບເດດ)
                                        </div>
                                    </Panel>

                                    <Panel header="ຂໍ້ມູນອຸປະກອນ ແລະ ລາຍລະອຽດເພີ່ມເຕີມ" toggleable className="border-top-1 border-yellow-500 shadow-none border-1 surface-border border-round-none">
                                        <div className="text-500 text-base italic py-4 px-3 md:px-4">
                                            ພື້ນທີ່ສໍາລັບສະແດງຂໍ້ມູນລາຍລະອຽດຂອງອຸປະກອນ (ກໍາລັງອັບເດດ)
                                        </div>
                                    </Panel>

                                </div>
                            </TabPanel>
                        </TabView>
                    </div>

                    {/* --- RIGHT COLUMN: Sidebar --- */}
                    {isSidebarVisible && (
                        <div className="col-12 md:col-3 p-4 md:p-4 surface-border md:border-left-1 surface-50 md:surface-0 fadein animation-duration-300">

                            {/* Card 1: Requester Info */}
                            <div className="mb-4">
                                <div className="text-blue-600 font-bold text-2xl mb-3 border-bottom-1 surface-border pb-2">
                                    ພາກສ່ວນຮ້ອງຂໍ
                                </div>

                                <ul className="list-none p-0 m-0 text-base">
                                    <li className="flex align-items-center gap-2 py-3 border-bottom-1 surface-border">
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
                                    <li className="flex align-items-start gap-2 py-3 border-bottom-1 surface-border">
                                        <span className="text-900 font-bold flex-shrink-0">ວັນທີຮ້ອງຂໍ : </span>
                                        <span className="text-700 flex-1 min-w-0">{ticket.date}</span>
                                    </li>
                                    <li className="flex align-items-start gap-2 py-3 border-bottom-1 surface-border">
                                        <span className="text-900 font-bold flex-shrink-0">ຜູ້ຮ້ອງຂໍ : </span>
                                        <span className="text-700 flex-1 min-w-0">[{ticket.emp_code ?? ''}]-{requesterName}</span>
                                    </li>
                                    <li className="flex align-items-start gap-2 py-3 border-bottom-1 surface-border">
                                        <span className="text-900 font-bold flex-shrink-0">ຝ່າຍ : </span>
                                        <span className="text-700 flex-1 min-w-0">{ticket.department || '-'}</span>
                                    </li>
                                    <li className="flex align-items-start gap-2 py-3 border-bottom-1 surface-border">
                                        <span className="text-900 font-bold flex-shrink-0">ພະແນກ :</span>
                                        <span className="text-700 flex-1 min-w-0">{ticket.division || '-'}</span>
                                    </li>
                                    <li className="flex align-items-start gap-2 py-3 border-bottom-1 surface-border">
                                        <span className="text-900 font-bold flex-shrink-0">ເລກ ຊຄທ : </span>
                                        <span className="text-700 flex-1 min-w-0">{ticket.numberSKT ?? '-'}</span>
                                    </li>
                                    <li className="flex align-items-start gap-2 py-3 border-bottom-1 surface-border">
                                        <span className="text-900 font-bold flex-shrink-0">ສະຖານທີ່ :</span>
                                        <span className="text-700 flex-1 min-w-0">{ticket.building || 'ຕຶກສໍານັກງານໃຫຍ່'}</span>
                                    </li>
                                    <li className="flex align-items-start gap-2 py-3 border-bottom-1 surface-border">
                                        <span className="text-900 font-bold flex-shrink-0">ຊັ້ນ :</span>
                                        <span className="text-700 flex-1 min-w-0">{ticket.level || 'ຊັ້ນ-05'}</span>
                                    </li>
                                    <li className="flex align-items-start gap-2 py-3 border-bottom-1 surface-border">
                                        <span className="text-900 font-bold flex-shrink-0">ຫ້ອງ :</span>
                                        <span className="text-700 font-bold flex-1 min-w-0">{ticket.room || '502'}</span>
                                    </li>
                                    <li className="flex align-items-start gap-2 py-3 border-bottom-1 surface-border">
                                        <span className="text-900 font-bold flex-shrink-0">ອອກລິບມາ :</span>
                                        <span className="text-700 flex-1 min-w-0">{ticket.turning ?? '-'}</span>
                                    </li>
                                    <li className="flex align-items-start gap-2 py-3 border-bottom-1 surface-border">
                                        <span className="text-900 font-bold flex-shrink-0">ເບີໂທ :</span>
                                        <span className="text-700 flex-1 min-w-0">{ticket.contactPhone || '020 9999 9999'}</span>
                                    </li>
                                    <li className="flex align-items-start gap-2 py-3">
                                        <span className="text-900 font-bold flex-shrink-0">ອີເມວ :</span>
                                        <span className="text-700 flex-1 min-w-0" style={{ wordBreak: 'break-all' }}>{requesterEmail}</span>
                                    </li>
                                </ul>
                            </div>

                            {/* Card 2: Repair Units */}
                            <div className="mt-4 -mx-4">

                                {/* Panel 1: Internal */}
                                <Panel
                                    header="ໜ່ວຍງານສ້ອມແປງພາຍໃນ"
                                    toggleable
                                    className="shadow-none border-y-1 border-x-none border-noround surface-border"
                                >
                                    <div className="m-0">
                                        <div className="text-700 font-bold mb-3 text-base">ວິຊາການກວດກາ:</div>
                                        <ul className="list-none p-0 m-0">
                                            {ticket.assignees && ticket.assignees.length > 0 ? (
                                                ticket.assignees.map((assignee: any, index: number) => (
                                                    <li key={index} className="flex align-items-center py-1 gap-2 mb-1">
                                                        <i className="pi pi-chevron-right text-sm text-500"></i>
                                                        <div className="flex flex-column">
                                                            <span className="text-700 text-base">
                                                                {assignee.name} {assignee.phone ? ` | ${assignee.phone}` : ''}
                                                            </span>
                                                        </div>
                                                    </li>
                                                ))
                                            ) : (
                                                <div className="text-500 italic text-base">ຍັງບໍ່ມີຜູ້ຮັບຜິດຊອບ</div>
                                            )}
                                        </ul>

                                        <div className="text-700 font-bold mt-4 mb-2 text-base">ລາຍລະອຽດການກວດກາ ແລະ ສ້ອມແປງ:</div>
                                        <div className="text-500 text-base pl-3 border-left-2 border-300">
                                        </div>
                                    </div>
                                </Panel>

                                {/* Panel 2: External */}
                                <Panel
                                    header="ຮ້ານແປງນອກ"
                                    toggleable
                                    className="shadow-none border-bottom-1 border-top-none border-x-none border-noround surface-border"
                                >
                                    <ul className="list-none p-0 m-0 text-base">
                                        <li className="flex align-items-center justify-content-between py-2">
                                            <span className="text-700 font-bold">ຮ້ານທີ່ສັ່ງແປງ:</span>
                                        </li>
                                        <li className="flex align-items-center justify-content-between py-2">
                                            <span className="text-700 font-bold">ເລກທີໃບນຳສົ່ງ:</span>
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
        </div>
    );
}
