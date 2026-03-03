import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Toast } from 'primereact/toast';
import { TicketForm, MasterData, City } from './types';
import { ticketService } from '@/app/services/ticketService';
import axiosClientsHelpDesk from '@/config/axiosClientsHelpDesk';
import { useUserProfileStore } from '@/app/store/user/userProfileStore';

/** Endpoint: POST .../helpdesk/api/helpdeskrequests (baseURL มาจาก axiosClientsHelpDesk) */
const HELPDESK_REQUESTS_PATH = 'helpdeskrequests';

/** ข้อความเมื่อเจอ 413 Payload Too Large */
const ERROR_413_MESSAGE = 'ขนาดไฟล์ใหญ่เกินไป กรุณาติดต่อ Admin เพื่อขยายสิทธิ์ Nginx';

const INITIAL_FORM: TicketForm = {
    ticketId: null,
    topic: null,
    assetNumber: '',
    building: null,
    phoneNumber: '',
    route: null,
    level: null,
    room: '',
    description: '',
    attachments: [],
    images: [],
};

function getInitialFormFromParams(searchParams: ReturnType<typeof useSearchParams>): Partial<Pick<TicketForm, 'ticketId' | 'topic'>> {
    const ticketIdParam = searchParams.get('ticketId');
    const title = searchParams.get('title');
    const ticketId = ticketIdParam ? Number(ticketIdParam) : null;
    const topic: City | null = title ? { name: title } : null;
    return { ticketId: Number.isNaN(ticketId) ? null : ticketId, topic };
}

export const useTicketForm = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const toastRef = useRef<Toast>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

    const initialFromParams = getInitialFormFromParams(searchParams);

    const [form, setForm] = useState<TicketForm>({
        ...INITIAL_FORM,
        ticketId: initialFromParams.ticketId ?? null,
        topic: initialFromParams.topic ?? null,
    });

    const [masterData, setMasterData] = useState<MasterData | null>(null);
    const [levelOptions, setLevelOptions] = useState<City[]>([]);
    const [loadingMaster, setLoadingMaster] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const ticketIdParam = searchParams.get('ticketId');
    const titleParam = searchParams.get('title');

    useEffect(() => {
        let isMounted = true;
        setLoadingMaster(true);
        const initData = async () => {
            try {
                const data = await ticketService.getMasterData();
                if (!isMounted) return;
                setMasterData(data);
                const next = getInitialFormFromParams(searchParams);
                setForm((prev) => ({
                    ...prev,
                    ticketId: next.ticketId ?? prev.ticketId,
                    topic: next.topic ?? prev.topic,
                }));
            } catch {
                if (isMounted) {
                    const next = getInitialFormFromParams(searchParams);
                    setForm((prev) => ({
                        ...prev,
                        ticketId: next.ticketId ?? prev.ticketId,
                        topic: next.topic ?? prev.topic,
                    }));
                }
            } finally {
                if (isMounted) setLoadingMaster(false);
            }
        };
        initData();
        return () => { isMounted = false; };
    }, [ticketIdParam, titleParam, searchParams]);

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

    const updateField = (field: keyof TicketForm, value: unknown) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleBuildingChange = (building: City | null) => {
        setForm((prev) => ({ ...prev, building, level: null }));
    };

    const handleLevelChange = (level: City | null) => {
        setForm((prev) => ({ ...prev, level }));
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            const allowedDocTypes = ['application/pdf'];
            const hasInvalidFile = newFiles.some((file) => !allowedDocTypes.includes(file.type));
            if (hasInvalidFile) {
                toastRef.current?.show({ severity: 'warn', summary: 'ແຈ້ງເຕືອນ', detail: 'ອະນຸຍາດແຕ່ PDF', life: 4000 });
                if (fileInputRef.current) fileInputRef.current.value = '';
                return;
            }
            const currentFiles = form.attachments;
            if (currentFiles.length + newFiles.length > 2) {
                toastRef.current?.show({ severity: 'warn', summary: 'ແຈ້ງເຕືອນ', detail: 'ແນບໄຟລ໌ໄດ້ສູງສຸດ 2 ໄຟລ໌', life: 4000 });
                return;
            }
            const MAX_SIZE_MB = 3;
            const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
            const totalSizeCurrent = currentFiles.reduce((acc, file) => acc + file.size, 0);
            const totalSizeNew = newFiles.reduce((acc, file) => acc + file.size, 0);
            if (totalSizeCurrent + totalSizeNew > MAX_SIZE_BYTES) {
                toastRef.current?.show({ severity: 'warn', summary: 'ແຈ້ງເຕືອນ', detail: `ຂະໜາດໄຟລ໌ລວມບໍ່ເກີນ ${MAX_SIZE_MB}MB`, life: 4000 });
                return;
            }
            setForm((prev) => ({ ...prev, attachments: [...prev.attachments, ...newFiles] }));
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleRemoveFile = (indexToRemove: number) => {
        setForm((prev) => ({
            ...prev,
            attachments: prev.attachments.filter((_, index) => index !== indexToRemove),
        }));
    };

    const IMAGE_MAX_SIZE_MB = 2;
    const IMAGE_MAX_TOTAL_MB = 5;
    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            const allowedImageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
            const hasInvalidImage = newFiles.some((file) => !allowedImageTypes.includes(file.type));
            if (hasInvalidImage) {
                toastRef.current?.show({ severity: 'warn', summary: 'ແຈ້ງເຕືອນ', detail: 'ອະນຸຍາດແຕ່ PNG, JPEG ແລະ GIF', life: 4000 });
                if (imageInputRef.current) imageInputRef.current.value = '';
                return;
            }
            const totalImages = form.images.length + newFiles.length;
            if (totalImages > 6) {
                toastRef.current?.show({ severity: 'warn', summary: 'ແຈ້ງເຕືອນ', detail: 'ແນບຮູບໄດ້ສູງສຸດ 6 ຮູບ', life: 4000 });
                return;
            }
            const maxPerImage = IMAGE_MAX_SIZE_MB * 1024 * 1024;
            const maxTotalImages = IMAGE_MAX_TOTAL_MB * 1024 * 1024;
            const currentTotal = form.images.reduce((acc, f) => acc + f.size, 0);
            for (const file of newFiles) {
                if (file.size > maxPerImage) {
                    toastRef.current?.show({
                        severity: 'warn',
                        summary: 'ແຈ້ງເຕືອນ',
                        detail: `ແນບຮູບຕໍ່ຮູບບໍ່ເກີນ ${IMAGE_MAX_SIZE_MB} MB`,
                        life: 4000,
                    });
                    if (imageInputRef.current) imageInputRef.current.value = '';
                    return;
                }
            }
            const newTotal = newFiles.reduce((acc, f) => acc + f.size, 0);
            if (currentTotal + newTotal > maxTotalImages) {
                toastRef.current?.show({
                    severity: 'warn',
                    summary: 'ແຈ້ງເຕືອນ',
                    detail: `ຂະໜາດຮູບລວມບໍ່ເກີນ ${IMAGE_MAX_TOTAL_MB} MB`,
                    life: 4000,
                });
                if (imageInputRef.current) imageInputRef.current.value = '';
                return;
            }
            setForm((prev) => ({ ...prev, images: [...prev.images, ...newFiles] }));
        }
        if (imageInputRef.current) imageInputRef.current.value = '';
    };

    const handleRemoveImage = (indexToRemove: number) => {
        setForm((prev) => ({
            ...prev,
            images: prev.images.filter((_, index) => index !== indexToRemove),
        }));
    };

    const handleReset = () => {
        const fromParams = getInitialFormFromParams(searchParams);
        setForm({
            ...INITIAL_FORM,
            ticketId: fromParams.ticketId ?? null,
            topic: fromParams.topic ?? null,
        });
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (imageInputRef.current) imageInputRef.current.value = '';
    };

    const handleCancel = () => router.back();

    const PAYLOAD_MAX_MB = 8;
    const handleSubmit = async () => {
        if (form.ticketId == null) {
            toastRef.current?.show({ severity: 'warn', summary: 'ແຈ້ງເຕືອນ', detail: 'ກະລຸນາເລືອກຫົວຂໍ້ຈາກຫນ້າ ແຈ້ງບັນຫາ', life: 4000 });
            return;
        }
        const totalFileSize =
            form.attachments.reduce((acc, f) => acc + f.size, 0) +
            form.images.reduce((acc, f) => acc + f.size, 0);
        if (totalFileSize > PAYLOAD_MAX_MB * 1024 * 1024) {
            toastRef.current?.show({
                severity: 'warn',
                summary: 'ແຈ້ງເຕືອນ',
                detail: `ຂະໜາດໄຟລ໌+ຮູບລວມບໍ່ເກີນ ${PAYLOAD_MAX_MB} MB (ປ້ອງກັນ error 413)`,
                life: 5000,
            });
            return;
        }

        setIsSubmitting(true);
        try {
            // FormData: Key hdFile = PDF 1 ไฟล์, Key hdImgs = append ซ้ำสำหรับหลายรูป
            // baseURL = .../helpdesk/api (หรือ proxy), path = helpdeskrequests → POST multipart/form-data
            // Authorization: ใส่โดย interceptor ใน axiosClientsHelpDesk (Bearer token)
            const formData = new FormData();
            formData.append('ticketId', String(form.ticketId));
            if (form.building?.code) formData.append('buildingId', form.building.code);
            if (form.level?.code) formData.append('floorId', form.level.code);
            if (form.route?.code) formData.append('turningId', form.route.code);
            formData.append('room', form.room ?? '');
            formData.append('numberSKT', form.assetNumber ?? '');
            formData.append('telephone', form.phoneNumber ?? '');
            formData.append('details', form.description ?? '');

            if (form.attachments.length > 0) {
                formData.append('hdFile', form.attachments[0]);
            }
            form.images.forEach((file) => {
                formData.append('hdImgs', file);
            });

            await axiosClientsHelpDesk.post(HELPDESK_REQUESTS_PATH, formData);

            toastRef.current?.show({
                severity: 'success',
                summary: 'ສຳເລັດ',
                detail: 'ບັນທຶກຄຳຮ້ອງຂໍສຳເລັດ',
                life: 3000,
            });

            const roleId = useUserProfileStore.getState().currentUser?.roleId ?? 0;
            const path =
                roleId === 1 || roleId === 2 ? '/uikit/table'
                    : roleId === 3 ? '/uikit/pageTechn'
                    : roleId === 4 ? '/uikit/pageUser'
                    : '/auth/login';
            setTimeout(() => router.push(path), 800);
        } catch (err: unknown) {
            const res = err && typeof err === 'object' && 'response' in err
                ? (err as { response?: { status?: number; data?: { message?: string } } }).response
                : undefined;
            const status = res?.status;
            const serverMsg = res?.data?.message;

            if (status === 413) {
                toastRef.current?.show({
                    severity: 'error',
                    summary: 'ເກີດຂໍ້ຜິດພາດ',
                    detail: ERROR_413_MESSAGE,
                    life: 6000,
                });
                return;
            }

            const detail = typeof serverMsg === 'string' ? serverMsg : 'ເກີດຂໍ້ຜິດພາດໃນການສົ່ງຄຳຮ້ອງຂໍ';
            toastRef.current?.show({
                severity: 'error',
                summary: 'ເກີດຂໍ້ຜິດພາດ',
                detail,
                life: 5000,
            });
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
        toastRef,
    };
};
