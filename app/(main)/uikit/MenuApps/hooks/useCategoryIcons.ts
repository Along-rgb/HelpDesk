import { useState, useRef, useCallback, useEffect } from 'react';
import { Toast } from 'primereact/toast';
import axiosClientsHelpDesk from '@/config/axiosClientsHelpDesk';
import { env } from '@/config/env';
import { IconItemData, CreateIconPayload } from '../types';
import { getCategoryIconProxyUrl, getLocalUploadIconUrl } from '../utils/iconUrl';

const ENDPOINT = 'categoryicons';
const LOCAL_UPLOAD_PATH = '/api/upload-category-icon';

/** FormData key สำหรับไฟล์ icon — ต้องตรงกับ Backend (ใช้ catIcon) */
const FORM_KEY_ICON = 'catIcon';

/** id สำหรับ item ที่อัปโหลดแบบ local (demo) — ใช้ลบจาก state ได้ */
function isLocalIconId(id: number): boolean {
    return id < 0;
}

/** Tab 2 ເພີ່ມໄອຄອນ: GET/DELETE /api/categoryicons, POST/PUT with FormData (catIcon = file). Demo: ใช้ local upload ได้ */
export function useCategoryIcons(triggerFetch: unknown, shouldFetch: boolean = true) {
    const toast = useRef<Toast>(null);
    const [items, setItems] = useState<IconItemData[]>([]);
    const [loading, setLoading] = useState(false);
    const useLocalUpload = env.useLocalCategoryIconUpload;

    const fetchData = useCallback(async () => {
        if (!ENDPOINT || !shouldFetch) return;
        setLoading(true);
        try {
            const response = await axiosClientsHelpDesk.get(ENDPOINT);
            const data = response.data;
            if (Array.isArray(data)) {
                setItems(data.map(normalizeIconItem));
            } else if (data?.data && Array.isArray(data.data)) {
                setItems(data.data.map(normalizeIconItem));
            } else {
                setItems([]);
            }
        } catch {
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [shouldFetch]);

    useEffect(() => {
        if (shouldFetch) {
            setLoading(true); // ໃຫ້ loading=true ກ່ອນ fetch ເພື່ອບໍ່ໃຫ້ແສງ "ບໍ່ພົບຂໍ້ມູນ" ຕອນເປີດໜ້າ/refresh
            fetchData();
        }
        // ບໍ່ລ້າງ items ເມື່ອ shouldFetch ເປັນ false — ເກັບ cache ເພື່ອບໍ່ໃຫ້ແສງ "ບໍ່ພົບຂໍ້ມູນ" ຕອນສະຫຼັບ tab
    }, [fetchData, triggerFetch, shouldFetch]);

    const saveData = useCallback(
        async (payload: CreateIconPayload, id?: number): Promise<boolean> => {
            try {
                if (!id && !payload.iconFile) {
                    toast.current?.show({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'ກະລຸນາເລືອກຮູບໄອຄອນ',
                        life: 4000,
                    });
                    return false;
                }

                if (useLocalUpload && payload.iconFile) {
                    const form = new FormData();
                    form.append(FORM_KEY_ICON, payload.iconFile);
                    const res = await fetch(LOCAL_UPLOAD_PATH, { method: 'POST', body: form });
                    if (!res.ok) {
                        const err = await res.json().catch(() => ({}));
                        throw new Error((err as { error?: string }).error ?? 'Upload failed');
                    }
                    const data = (await res.json()) as { catIcon: string };
                    const sortOrder = payload.sortOrder ?? 0;
                    const newItem: IconItemData = {
                        id: -Date.now(),
                        sortOrder,
                        catIcon: data.catIcon,
                        iconUrl: getLocalUploadIconUrl(data.catIcon),
                    };
                    if (id !== undefined && id !== null) {
                        setItems((prev) =>
                            prev.map((i) =>
                                i.id === id ? { ...i, catIcon: data.catIcon, iconUrl: getLocalUploadIconUrl(data.catIcon) } : i
                            )
                        );
                        toast.current?.show({
                            severity: 'success',
                            summary: 'Success',
                            detail: 'ແກ້ໄຂຂໍ້ມູນສຳເລັດ',
                        });
                    } else {
                        setItems((prev) => [...prev, newItem]);
                        toast.current?.show({
                            severity: 'success',
                            summary: 'Success',
                            detail: 'ເພີ່ມຂໍ້ມູນສຳເລັດ',
                        });
                    }
                    return true;
                }

                if (useLocalUpload && id !== undefined && id !== null && !payload.iconFile) {
                    setItems((prev) =>
                        prev.map((i) => (i.id === id ? { ...i, sortOrder: payload.sortOrder ?? i.sortOrder } : i))
                    );
                    toast.current?.show({
                        severity: 'success',
                        summary: 'Success',
                        detail: 'ແກ້ໄຂຂໍ້ມູນສຳເລັດ',
                    });
                    return true;
                }

                const form = new FormData();
                if (payload.iconFile) {
                    form.append(FORM_KEY_ICON, payload.iconFile);
                }
                if (id) {
                    await axiosClientsHelpDesk.put(`${ENDPOINT}/${id}`, form);
                    toast.current?.show({
                        severity: 'success',
                        summary: 'Success',
                        detail: 'ແກ້ໄຂຂໍ້ມູນສຳເລັດ',
                    });
                } else {
                    await axiosClientsHelpDesk.post(ENDPOINT, form);
                    toast.current?.show({
                        severity: 'success',
                        summary: 'Success',
                        detail: 'ເພີ່ມຂໍ້ມູນສຳເລັດ',
                    });
                }
                await fetchData();
                return true;
            } catch (error: unknown) {
                const msg =
                    error &&
                    typeof error === 'object' &&
                    'response' in error
                        ? (error as { response?: { data?: { message?: string } } }).response?.data
                              ?.message
                        : null;
                const detail =
                    msg && typeof msg === 'string' ? msg : (error instanceof Error ? error.message : 'ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກ');
                toast.current?.show({
                    severity: 'error',
                    summary: 'Error',
                    detail,
                    life: 4000,
                });
                return false;
            }
        },
        [fetchData, useLocalUpload]
    );

    const deleteData = useCallback(
        async (id: number) => {
            try {
                if (useLocalUpload && isLocalIconId(id)) {
                    setItems((prev) => prev.filter((i) => i.id !== id));
                    toast.current?.show({
                        severity: 'success',
                        summary: 'Success',
                        detail: 'ລຶບຂໍ້ມູນສຳເລັດ',
                    });
                    return;
                }
                await axiosClientsHelpDesk.delete(`${ENDPOINT}/${id}`);
                toast.current?.show({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'ລຶບຂໍ້ມູນສຳເລັດ',
                });
                await fetchData();
            } catch (error: unknown) {
                const msg =
                    error &&
                    typeof error === 'object' &&
                    'response' in error
                        ? (error as { response?: { data?: { message?: string } } }).response?.data
                              ?.message
                        : null;
                const detail =
                    msg && typeof msg === 'string' ? msg : 'ລຶບຂໍ້ມູນບໍ່ສຳເລັດ';
                toast.current?.show({
                    severity: 'error',
                    summary: 'Error',
                    detail,
                    life: 4000,
                });
            }
        },
        [fetchData, useLocalUpload]
    );

    return {
        toast,
        items,
        loading,
        saveData,
        deleteData: (item: IconItemData) => deleteData(item.id),
        fetchData,
    };
}

/** ปรับ response ให้เป็น IconItemData และแปลงชื่อไฟล์เป็น proxy URL สำหรับแสดงรูป */
function normalizeIconItem(row: { id: number; sortOrder?: number; iconUrl?: string; catIcon?: string; createdAt?: string }): IconItemData {
    const raw = row.iconUrl ?? row.catIcon ?? '';
    const iconUrl = getCategoryIconProxyUrl(raw);
    return {
        id: row.id,
        sortOrder: row.sortOrder ?? 0,
        iconUrl,
        catIcon: row.catIcon ?? '',
        createdAt: row.createdAt,
    };
}
