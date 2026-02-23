// invalidstate/useTicketForm.ts
import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TicketForm, MasterData, City } from './types';
import { ticketService } from '@/app/services/ticketService';
import { CATEGORY_MAP } from './ticketData';
import { getTicketById } from '../ticket/ticketData';
import { useUserProfileStore } from '@/app/store/user/userProfileStore';

const INITIAL_FORM: TicketForm = {
    category: null,
    assetNumber: "",
    topic: null,
    building: null,
    phoneNumber: "",
    route: null,
    level: null,
    roomNumber: null,
    description: "",
    attachments: [],
    images: [],
};

const LOG = (msg: string, data?: unknown) => {
    console.log('[invalidstate]', msg, data !== undefined ? data : '');
};

function getInitialFormFromParams(searchParams: ReturnType<typeof useSearchParams>): Partial<TicketForm> {
    const categoryCode = searchParams.get('category');
    const ticketId = searchParams.get('ticketId');
    const category: City | null = categoryCode && CATEGORY_MAP[categoryCode]
        ? { name: CATEGORY_MAP[categoryCode], code: categoryCode }
        : null;
    const ticket = ticketId ? getTicketById(ticketId) : undefined;
    const topic: City | null = ticket ? { name: ticket.title } : null;
    LOG('getInitialFormFromParams', { categoryCode, ticketId, category, topic, ticketFound: !!ticket });
    return { category, topic };
}

export const useTicketForm = () => {
    const router = useRouter();
    const searchParams = useSearchParams();

    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

    const initialFromParams = getInitialFormFromParams(searchParams);

    const [form, setForm] = useState<TicketForm>({
        ...INITIAL_FORM,
        category: initialFromParams.category ?? null,
        topic: initialFromParams.topic ?? null,
    });

    const [masterData, setMasterData] = useState<MasterData | null>(null);
    const [levelOptions, setLevelOptions] = useState<City[]>([]);
    const [loadingMaster, setLoadingMaster] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const categoryCode = searchParams.get('category');
    const ticketId = searchParams.get('ticketId');

    LOG('useTicketForm render', { categoryCode, ticketId, initialCategory: initialFromParams.category?.name, initialTopic: initialFromParams.topic?.name });

    useEffect(() => {
        let isMounted = true;
        setLoadingMaster(true);
        LOG('initData start', { categoryCode, ticketId });
        const initData = async () => {
            try {
                const data = await ticketService.getMasterData();
                if (!isMounted) {
                    LOG('initData skip (unmounted)');
                    return;
                }
                LOG('getMasterData ok', {
                    buildingsCount: data?.buildings?.length ?? 0,
                    categoriesCount: data?.categories?.length ?? 0,
                    levelsCount: data?.levels?.length ?? 0,
                    roomsCount: data?.rooms?.length ?? 0,
                });
                setMasterData(data);

                const ticket = ticketId ? getTicketById(ticketId) : undefined;
                const topic: City | null = ticket ? { name: ticket.title } : null;
                const category = categoryCode && data.categories
                    ? data.categories.find((c) => c.code === categoryCode) ?? (categoryCode && CATEGORY_MAP[categoryCode] ? { name: CATEGORY_MAP[categoryCode], code: categoryCode } : null)
                    : null;
                LOG('form resolve', { category: category?.name, topic: topic?.name });

                setForm((prev) => ({
                    ...prev,
                    ...(category && { category }),
                    ...(topic && { topic }),
                }));
            } catch (error) {
                const err = error as { message?: string; response?: { status?: number; data?: unknown } };
                console.error('[invalidstate] initData error', {
                    message: err?.message,
                    status: err?.response?.status,
                    data: err?.response?.data,
                    error: err,
                });
                if (isMounted) {
                    const category = categoryCode && CATEGORY_MAP[categoryCode] ? { name: CATEGORY_MAP[categoryCode], code: categoryCode } : null;
                    const ticket = ticketId ? getTicketById(ticketId) : undefined;
                    const topic: City | null = ticket ? { name: ticket.title } : null;
                    setForm((prev) => ({
                        ...prev,
                        ...(category && { category }),
                        ...(topic && { topic }),
                    }));
                    LOG('fallback form set from URL', { category: category?.name, topic: topic?.name });
                }
            } finally {
                if (isMounted) setLoadingMaster(false);
            }
        };
        initData();
        return () => { isMounted = false; };
    }, [categoryCode, ticketId]);

    // โหลดລະດັບຊັ້ນ (floors) ຕາມ building ທີ່ເລືອກ — API floors/selectfloor?buildingId=...
    useEffect(() => {
        const buildingId = form.building?.code;
        if (!buildingId) {
            setLevelOptions([]);
            return;
        }
        let cancelled = false;
        ticketService.getFloorsByBuilding(buildingId).then((list) => {
            if (!cancelled) setLevelOptions(list);
        });
        return () => { cancelled = true; };
    }, [form.building?.code]);

    const updateField = (field: keyof TicketForm, value: any) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleBuildingChange = (building: City | null) => {
        setForm(prev => ({ ...prev, building, level: null, roomNumber: null }));
    };
    
    const handleLevelChange = (level: City | null) => {
        setForm(prev => ({ ...prev, level, roomNumber: null }));
    };

    // --- File Logic (Documents: PDF, DOCX, XLSX) ---
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);

            // ตรวจสอบ MIME Type สำหรับเอกสาร
            const allowedDocTypes = [
                'application/pdf',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'      // .xlsx
            ];

            const hasInvalidFile = newFiles.some(file => !allowedDocTypes.includes(file.type));
            if (hasInvalidFile) {
                LOG('file reject: invalid type', newFiles.map(f => ({ name: f.name, type: f.type })));
                alert("อนุญาตเฉพาะไฟล์ PDF, DOCX และ XLSX เท่านั้น");
                if (fileInputRef.current) fileInputRef.current.value = "";
                return;
            }

            const currentFiles = form.attachments;
            if (currentFiles.length + newFiles.length > 2) {
                alert("ท่านสามารถแนบไฟล์ได้สูงสุด 2 ไฟล์เท่านั้น");
                return;
            }

            const MAX_SIZE_MB = 30;
            const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
            const totalSizeCurrent = currentFiles.reduce((acc, file) => acc + file.size, 0);
            const totalSizeNew = newFiles.reduce((acc, file) => acc + file.size, 0);

            if (totalSizeCurrent + totalSizeNew > MAX_SIZE_BYTES) {
                alert(`ขนาดไฟล์รวมต้องไม่เกิน ${MAX_SIZE_MB}MB`);
                return;
            }

            setForm(prev => ({
                ...prev,
                attachments: [...prev.attachments, ...newFiles]
            }));
        }
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleRemoveFile = (indexToRemove: number) => {
        setForm(prev => ({
            ...prev,
            attachments: prev.attachments.filter((_, index) => index !== indexToRemove)
        }));
    };

    // --- Images Logic (PNG, JPEG, GIF) ---
    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);

            // ตรวจสอบ MIME Type สำหรับรูปภาพ
            const allowedImageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
            const hasInvalidImage = newFiles.some(file => !allowedImageTypes.includes(file.type));
            
            if (hasInvalidImage) {
                LOG('image reject: invalid type', newFiles.map(f => ({ name: f.name, type: f.type })));
                alert("อนุญาตเฉพาะรูปภาพประเภท PNG, JPEG และ GIF เท่านั้น");
                if (imageInputRef.current) imageInputRef.current.value = "";
                return;
            }

            const totalImages = form.images.length + newFiles.length;
            if (totalImages > 6) {
                alert("ท่านสามารถแนบรูปได้สูงสุด 6 รูปเท่านั้น");
                return;
            }

            setForm(prev => ({
                ...prev,
                images: [...prev.images, ...newFiles]
            }));
        }
        if (imageInputRef.current) imageInputRef.current.value = "";
    };

    const handleRemoveImage = (indexToRemove: number) => {
        setForm(prev => ({
            ...prev,
            images: prev.images.filter((_, index) => index !== indexToRemove)
        }));
    };

    const handleReset = () => {
        const fromParams = getInitialFormFromParams(searchParams);
        setForm({
            ...INITIAL_FORM,
            category: fromParams.category ?? null,
            topic: fromParams.topic ?? null,
        });
        if (fileInputRef.current) fileInputRef.current.value = "";
        if (imageInputRef.current) imageInputRef.current.value = "";
    };

    const handleCancel = () => router.back();

    const handleSubmit = async () => {
        LOG('handleSubmit start', {
            category: form.category?.name,
            topic: form.topic?.name,
            building: form.building?.name,
            hasDescription: !!form.description?.replace(/<[^>]*>/g, '').trim(),
            attachmentsCount: form.attachments.length,
            imagesCount: form.images.length,
        });
        setIsSubmitting(true);
        try {
            const profileData = useUserProfileStore.getState().profileData;
            const firstName = profileData?.first_name ?? '';
            const lastName = profileData?.last_name ?? '';
            const requesterName = [firstName, lastName].filter(Boolean).join(' ').trim();
            LOG('requester', { profileData: !!profileData, requesterName: requesterName || '(empty)' });
            const result = await ticketService.createTicket(form, requesterName);
            LOG('createTicket result', result);
            if (result.success) {
                alert(result.message);
                const roleId = useUserProfileStore.getState().currentUser?.roleId ?? 0;
                const path =
                    roleId === 1 || roleId === 2 ? '/uikit/table'
                    : roleId === 3 ? '/uikit/pageTechn'
                    : roleId === 4 ? '/uikit/pageUser'
                    : '/auth/login'; // ไม่มี role ถือว่าไม่มีตัวตน → กลับไปหน้า login
                router.push(path);
            } else {
                console.warn('[invalidstate] createTicket not success', result.message);
                alert("Error: " + result.message);
            }
        } catch (error) {
            const err = error as { message?: string; response?: { status?: number; data?: unknown } };
            console.error('[invalidstate] handleSubmit error', {
                message: err?.message,
                status: err?.response?.status,
                data: err?.response?.data,
                error: err,
            });
            alert("เกิดข้อผิดพลาดในการเชื่อมต่อระบบ");
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        form,
        masterData,
        levelOptions,
        loadingMaster,
        isSubmitting,
        updateField,
        handleBuildingChange,
        handleLevelChange,
        handleFileSelect,
        handleRemoveFile,
        handleImageSelect,
        handleRemoveImage,
        handleSubmit,
        handleReset,
        handleCancel,
        fileInputRef,
        imageInputRef,
    };
};