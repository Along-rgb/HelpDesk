"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Image } from "primereact/image";
import { Panel } from "primereact/panel";
import { Dropdown } from "primereact/dropdown";
import { TabView, TabPanel } from "primereact/tabview";
import { Toast } from "primereact/toast";
import { Ticket, AssigneeOption, type AdminAssignUserRow } from "@/app/(main)/uikit/table/types";
import { STATUS_MAP, STATUS_ICON_MAP, STATUS_ICON_FALLBACK } from "@/app/(main)/uikit/table/constants";
import { normalizeHelpdeskRow, unwrapHelpdeskResponse } from "@/app/(main)/uikit/table/normalizeHelpdeskRow";
import type { HelpdeskRowInput } from "@/app/(main)/uikit/table/normalizeHelpdeskRow";
import axiosClientsHelpDesk from "@/config/axiosClientsHelpDesk";
import { HELPDESK_ENDPOINTS } from "@/config/endpoints";
import { normalizeDataList } from "@/utils/apiNormalizers";
import { useUserProfileStore } from "@/app/store/user/userProfileStore";
import { sanitizeHtml } from "@/utils/sanitizeHtml";
import { decryptId } from "@/lib/crypto";
import { fetchTurningsForSelect } from "@/app/services/ticketService";
import { getHelpdeskFileUrl, getHelpdeskFileUrlAbsolute } from "@/utils/helpdeskFileUrl";
import { getDownloadApiUrl, downloadFile } from "@/utils/downloadFile";
import InlineLoading from "@/app/components/InlineLoading";

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

export default function TicketDetailPage() {
    const params = useParams();
    const router = useRouter();
    const roleId = useUserProfileStore((s) => s.currentUser?.roleId ?? null);
    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [loading, setLoading] = useState(true);

    // --- State ควบคุม Sidebar ---
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);

    /** ຕາມ table: ດຶງຈາກ USERS_ADMINASSIGN ແລະກອງເປັນ Staff (roleId === 3) ເທົ່ານັ້ນ */
    const [assignOptions, setAssignOptions] = useState<AssigneeOption[]>([]);
    const [selectedAssignee, setSelectedAssignee] = useState<AssigneeOption | null>(null);

    /** ອີເມວ / ຝ່າຍ / ພະແນກ: ดึงจาก GET users/:id (ຜູ້ປ້ອນຂໍ້ມູນ) */
    const [requesterEmail, setRequesterEmail] = useState<string>("");
    const [requesterDivision, setRequesterDivision] = useState<string>("");
    const [requesterDepartment, setRequesterDepartment] = useState<string>("");
    /** ອອກລິບມາ: รายการจาก turnings/selectturning ເພື່ອ resolve turningId → name */
    const [turningOptions, setTurningOptions] = useState<{ id: number; name: string }[]>([]);
    const [acceptLoading, setAcceptLoading] = useState(false);
    const [invalidLink, setInvalidLink] = useState(false);
    const [downloadingPdf, setDownloadingPdf] = useState(false);
    const [downloadingImageKey, setDownloadingImageKey] = useState<string | null>(null);
    const [imagePreview, setImagePreview] = useState<{ imgSrc: string; downloadUrl: string; fileName: string; key: string } | null>(null);
    /** ການຫມຸນ / ຂະຫຍາຍຮູບໃນ Dialog ເບິ່ງຮູບ */
    const [imagePreviewRotation, setImagePreviewRotation] = useState(0);
    const [imagePreviewScale, setImagePreviewScale] = useState(1);
    const toastRef = useRef<Toast | null>(null);

    /** ຣີເຊັດ rotation/scale ເມື່ອເປີດຫຼືປິດ Dialog ເບິ່ງຮູບ */
    useEffect(() => {
        if (!imagePreview) {
            setImagePreviewRotation(0);
            setImagePreviewScale(1);
        }
    }, [imagePreview]);

    const handleDownloadPdf = useCallback((fileName: string) => {
        setDownloadingPdf(true);
        try {
            downloadFile(getHelpdeskFileUrl("hdFile", fileName), fileName);
        } finally {
            setTimeout(() => setDownloadingPdf(false), 2000);
        }
    }, []);

    const handleDownloadImage = useCallback((fileName: string, key: string) => {
        setDownloadingImageKey(key);
        try {
            downloadFile(getHelpdeskFileUrl("hdImgs", fileName), fileName);
        } finally {
            setTimeout(() => setDownloadingImageKey(null), 2000);
        }
    }, []);

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

    /** ມອບໝາຍວຽກ — ເອີ້ນ USERS_ADMINASSIGN ເທົ່ານັ້ນເມື່ອ role 1 ຫຼື 2 (ຫຼີກ 403 ສຳລັບ role 3, 4) */
    useEffect(() => {
        const canCall = roleId != null && ROLE_IDS_CAN_ADMIN_ASSIGN.includes(roleId as 1 | 2);
        if (!canCall) {
            setAssignOptions([]);
            return;
        }
        axiosClientsHelpDesk
            .get(HELPDESK_ENDPOINTS.USERS_ADMINASSIGN)
            .then((response) => {
                const list = normalizeDataList<AdminAssignUserRow>(response.data);
                const staff = list.filter((u) => Number(u.roleId) === ROLE_ID_STAFF);
                const options: AssigneeOption[] = staff.map((u) => {
                    const first = u.employee?.first_name ?? "";
                    const last = u.employee?.last_name ?? "";
                    const label = [first, last].filter(Boolean).join(" ").trim() || String(u.id);
                    return { id: u.id, label };
                });
                setAssignOptions(options);
            })
            .catch(() => setAssignOptions([]));
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
        if (!ticket?.employeeId) {
            setRequesterEmail("");
            setRequesterDivision("");
            setRequesterDepartment("");
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
                setRequesterEmail(email != null && String(email).trim() !== "" ? String(email).trim() : "");
                const divName = obj.employee?.division?.division_name;
                const deptName = obj.employee?.department?.department_name;
                setRequesterDivision(divName != null && String(divName).trim() !== "" ? String(divName).trim() : "");
                setRequesterDepartment(deptName != null && String(deptName).trim() !== "" ? String(deptName).trim() : "");
            })
            .catch(() => {
                setRequesterEmail("");
                setRequesterDivision("");
                setRequesterDepartment("");
            });
    }, [ticket?.employeeId]);

    /** โหลดรายการ ອອກລິບມາ (turnings) ເພື່ອ resolve turningId → name */
    useEffect(() => {
        fetchTurningsForSelect()
            .then((list) => {
                const options = list.map((item) => ({
                    id: Number(item.code),
                    name: item.name,
                })).filter((o) => Number.isFinite(o.id));
                setTurningOptions(options);
            })
            .catch(() => setTurningOptions([]));
    }, []);

    if (invalidLink) return <div className="p-4 text-xl">ລິ້ງຄ໌ບໍ່ຖືກຕ້ອງ ຫຼືໝົດອາຍຸ</div>;
    if (loading) return <InlineLoading />;
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
                                {roleId !== ROLE_ID_STAFF && (
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
                                            {(ticket.details ?? ticket.description) ? (
                                                <div dangerouslySetInnerHTML={{ __html: sanitizeHtml((ticket.details ?? ticket.description) ?? '') }} />
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
                                        <div className="py-3 px-3 md:px-4">
                                            {(() => {
                                                const fromTicket = ticket.hdImgs && ticket.hdImgs.length > 0 ? ticket.hdImgs : null;
                                                const fromRaw = (ticket._raw as { hdImgs?: { id?: number; helpdeskRequestId?: number; hdImg?: string }[] } | undefined)?.hdImgs;
                                                const imgList = fromTicket ?? (Array.isArray(fromRaw) ? fromRaw.filter((i) => i != null && typeof (i as { hdImg?: string }).hdImg === "string").map((i) => ({ id: (i as { id?: number }).id ?? 0, helpdeskRequestId: (i as { helpdeskRequestId?: number }).helpdeskRequestId ?? 0, hdImg: String((i as { hdImg: string }).hdImg) })) : []);
                                                const hasPdf = !!ticket.hdFile;
                                                const hasAny = hasPdf || imgList.length > 0;
                                                return (
                                                    <div className="surface-50 p-4 border-round">
                                                        <div className="flex align-items-center gap-2 mb-4">
                                                            <i className="pi pi-paperclip text-primary" style={{ fontSize: "1.25rem" }} />
                                                            <span className="font-bold text-lg text-900">ເອກະສານແນບ (Attachments)</span>
                                                        </div>
                                                        {!hasAny && (
                                                            <div className="text-500 text-base italic">ບໍ່ມີໄຟລ໌ PDF ຫຼື ຮູບພາບ</div>
                                                        )}
                                                        {hasPdf && (
                                                            <div
                                                                className="flex align-items-center gap-4 p-3 surface-card border-1 surface-border border-round shadow-1 cursor-pointer hover:surface-100 transition-colors transition-duration-200 mb-4"
                                                                style={{ gap: "1rem" }}
                                                            >
                                                                <div className="flex-shrink-0" style={{ color: "#e24c4c" }}>
                                                                    <i className="pi pi-file-pdf text-4xl" />
                                                                </div>
                                                                <div className="flex-1 min-w-0 flex flex-column gap-0">
                                                                    <span className="text-900 font-medium block truncate" title={ticket.hdFile as string}>
                                                                        {ticket.hdFile as string}
                                                                    </span>
                                                                    <span className="text-500 text-sm">PDF Document</span>
                                                                </div>
                                                                <Button
                                                                    type="button"
                                                                    icon={downloadingPdf ? "pi pi-spin pi-spinner" : "pi pi-download"}
                                                                    rounded
                                                                    className="p-button-secondary p-button-text flex-shrink-0"
                                                                    onClick={() => handleDownloadPdf(ticket.hdFile as string)}
                                                                    disabled={downloadingPdf}
                                                                    aria-label="ດາວໂຫຼດ"
                                                                />
                                                            </div>
                                                        )}
                                                        {imgList.length > 0 && (
                                                            <>
                                                                <div className="grid gap-3">
                                                                    {imgList.map((img) => {
                                                                        const imgUrlAbs = getHelpdeskFileUrlAbsolute("hdImgs", img.hdImg) || getHelpdeskFileUrl("hdImgs", img.hdImg);
                                                                        const imgSrc = getDownloadApiUrl(imgUrlAbs, img.hdImg, "inline");
                                                                        const downloadUrl = getDownloadApiUrl(imgUrlAbs, img.hdImg, "attachment");
                                                                        const key = `${img.id}-${img.hdImg}`;
                                                                        const isDownloading = downloadingImageKey === key;
                                                                        return (
                                                                            <div
                                                                                key={key}
                                                                                className="relative border-1 surface-border border-round overflow-hidden surface-card shadow-1 col-12 md:col-6 cursor-pointer"
                                                                                onClick={() => setImagePreview({ imgSrc, downloadUrl, fileName: img.hdImg, key })}
                                                                                onKeyDown={(e) => e.key === "Enter" && setImagePreview({ imgSrc, downloadUrl, fileName: img.hdImg, key })}
                                                                                role="button"
                                                                                tabIndex={0}
                                                                                aria-label="ເປີດການເບິ່ງຮູບ"
                                                                            >
                                                                                <div className="relative overflow-hidden transition-opacity transition-duration-200 hover:opacity-80">
                                                                                    <img
                                                                                        src={imgSrc}
                                                                                        alt={img.hdImg}
                                                                                        className="w-full h-auto block"
                                                                                        style={{ maxHeight: 180, objectFit: "cover" }}
                                                                                    />
                                                                                    <Button
                                                                                        type="button"
                                                                                        icon={isDownloading ? "pi pi-spin pi-spinner" : "pi pi-download"}
                                                                                        rounded
                                                                                        size="small"
                                                                                        className="absolute top-1 right-1 shadow-2 p-button-secondary"
                                                                                        style={{ width: "2rem", height: "2rem", minWidth: "2rem", zIndex: 10 }}
                                                                                        onClick={(e) => {
                                                                                            e.preventDefault();
                                                                                            e.stopPropagation();
                                                                                            handleDownloadImage(img.hdImg, key);
                                                                                        }}
                                                                                        disabled={!!downloadingImageKey}
                                                                                        aria-label="ດາວໂຫຼດ"
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                                <Dialog
                                                                    visible={!!imagePreview}
                                                                    onHide={() => setImagePreview(null)}
                                                                    className="p-0 overflow-hidden w-full max-w-6xl"
                                                                    style={{ width: "95vw" }}
                                                                    contentStyle={{ padding: 0, overflow: "hidden" }}
                                                                    dismissableMask
                                                                    closable={false}
                                                                    blockScroll
                                                                    showHeader={false}
                                                                >
                                                                    {imagePreview && (
                                                                        <div className="relative w-full surface-ground flex justify-content-center align-items-center" style={{ minHeight: "70vh" }}>
                                                                            <img
                                                                                src={imagePreview.imgSrc}
                                                                                alt={imagePreview.fileName}
                                                                                className="max-w-full max-h-[85vh] object-contain transition-transform duration-200"
                                                                                style={{
                                                                                    transform: `rotate(${imagePreviewRotation}deg) scale(${imagePreviewScale})`,
                                                                                }}
                                                                            />
                                                                            <div
                                                                                className="absolute flex gap-1 align-items-center surface-card border-1 surface-border border-round p-2 shadow-2"
                                                                                style={{ top: "0.75rem", right: "0.75rem" }}
                                                                            >
                                                                                <Button
                                                                                    icon="pi pi-refresh"
                                                                                    rounded
                                                                                    text
                                                                                    className="p-button-rounded p-button-text text-900 border-1 border-400 border-round"
                                                                                    style={{ minWidth: "2.5rem", height: "2.5rem" }}
                                                                                    aria-label="ຫມຸນຂວາ"
                                                                                    title="ຫມຸນຂວາ 90°"
                                                                                    onClick={() => setImagePreviewRotation((r) => (r + 90) % 360)}
                                                                                />
                                                                                <Button
                                                                                    icon="pi pi-undo"
                                                                                    rounded
                                                                                    text
                                                                                    className="p-button-rounded p-button-text text-900 border-1 border-400 border-round"
                                                                                    style={{ minWidth: "2.5rem", height: "2.5rem" }}
                                                                                    aria-label="ຫມຸນຊ້າຍ"
                                                                                    title="ຫມຸນຊ້າຍ 90°"
                                                                                    onClick={() => setImagePreviewRotation((r) => (r - 90 + 360) % 360)}
                                                                                />
                                                                                <Button
                                                                                    icon="pi pi-search-minus"
                                                                                    rounded
                                                                                    text
                                                                                    className="p-button-rounded p-button-text text-900 border-1 border-400 border-round"
                                                                                    style={{ minWidth: "2.5rem", height: "2.5rem" }}
                                                                                    aria-label="ຂະຫຍາຍອອກ"
                                                                                    title="ຂະຫຍາຍອອກ"
                                                                                    onClick={() => setImagePreviewScale((s) => Math.max(0.25, s - 0.25))}
                                                                                />
                                                                                <Button
                                                                                    icon="pi pi-search-plus"
                                                                                    rounded
                                                                                    text
                                                                                    className="p-button-rounded p-button-text text-900 border-1 border-400 border-round"
                                                                                    style={{ minWidth: "2.5rem", height: "2.5rem" }}
                                                                                    aria-label="ຂະຫຍາຍເຂົ້າ"
                                                                                    title="ຂະຫຍາຍເຂົ້າ"
                                                                                    onClick={() => setImagePreviewScale((s) => Math.min(3, s + 0.25))}
                                                                                />
                                                                                <Button
                                                                                    icon={downloadingImageKey === imagePreview.key ? "pi pi-spin pi-spinner" : "pi pi-download"}
                                                                                    rounded
                                                                                    text
                                                                                    className="p-button-rounded p-button-text text-900 border-1 border-400 border-round"
                                                                                    style={{ minWidth: "2.5rem", height: "2.5rem" }}
                                                                                    onClick={() => handleDownloadImage(imagePreview.fileName, imagePreview.key)}
                                                                                    disabled={!!downloadingImageKey}
                                                                                    aria-label="ດາວໂຫຼດ"
                                                                                    title="ດາວໂຫຼດ"
                                                                                />
                                                                                <Button
                                                                                    icon="pi pi-times"
                                                                                    rounded
                                                                                    text
                                                                                    className="p-button-rounded p-button-text text-900 border-1 border-400 border-round"
                                                                                    style={{ minWidth: "2.5rem", height: "2.5rem" }}
                                                                                    onClick={() => setImagePreview(null)}
                                                                                    aria-label="ປິດ"
                                                                                    title="ປິດ"
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </Dialog>
                                                            </>
                                                        )}
                                                    </div>
                                                );
                                            })()}
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
                                        <span className="text-700 flex-1 min-w-0">{ticket.division || requesterDivision || '-'}</span>
                                    </li>
                                    <li className="flex align-items-start gap-2 py-3 border-bottom-1 surface-border">
                                        <span className="text-900 font-bold flex-shrink-0">ພະແນກ :</span>
                                        <span className="text-700 flex-1 min-w-0">{ticket.department || requesterDepartment || '-'}</span>
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
                                        <span className="text-700 flex-1 min-w-0">
                                            {ticket.turning ??
                                                (ticket.turningId != null && turningOptions.length > 0
                                                    ? (turningOptions.find((t) => t.id === ticket.turningId)?.name ?? '-')
                                                    : '-')}
                                        </span>
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
