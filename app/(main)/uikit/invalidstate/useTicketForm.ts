// invalidstate/useTicketForm.ts
import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TicketForm, MasterData, City } from './types';
import { ticketService } from '../../../services/ticketService';
import { CATEGORY_MAP } from './ticketData'; 

const INITIAL_FORM: TicketForm = {
    category: null,
    assetNumber: "",
    topic: null,
    building: null,
    level: null,
    roomNumber: null,
    description: "",
    attachments: [], 
    images: [], 
};

export const useTicketForm = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null); 

    const getInitialCategory = (): City | null => {
        const code = searchParams.get('category');
        if (code && CATEGORY_MAP[code]) {
            return { name: CATEGORY_MAP[code], code };
        }
        return null;
    };

    const [form, setForm] = useState<TicketForm>({
        ...INITIAL_FORM,
        category: getInitialCategory()
    });
    
    const [masterData, setMasterData] = useState<MasterData | null>(null);
    const [availableTopics, setAvailableTopics] = useState<City[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false); 
    const [isCategoryLocked, setIsCategoryLocked] = useState(!!getInitialCategory());

    useEffect(() => {
        let isMounted = true; 
        const initData = async () => {
            try {
                const categoryCode = searchParams.get('category');
                const masterDataPromise = ticketService.getMasterData();
                const topicsPromise = categoryCode 
                    ? ticketService.getTopicsByCategory(categoryCode) 
                    : Promise.resolve([]);

                const [data, topics] = await Promise.all([masterDataPromise, topicsPromise]);
                if (!isMounted) return;

                setMasterData(data);
                if (topics && topics.length > 0) setAvailableTopics(topics);

                if (categoryCode && data.categories) {
                    const realCategoryObj = data.categories.find(c => c.code === categoryCode);
                    if (realCategoryObj) setForm(prev => ({ ...prev, category: realCategoryObj }));
                }
            } catch (error) {
                console.error("Failed to load data", error);
            }
        };
        initData();
        return () => { isMounted = false; };
    }, [searchParams]); 

    const updateField = (field: keyof TicketForm, value: any) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleCategoryChange = async (category: City | null) => {
        if (isCategoryLocked) return;
        setForm(prev => ({ ...prev, category, topic: null })); 
        if (category && category.code) {
            const topics = await ticketService.getTopicsByCategory(category.code);
            setAvailableTopics(topics);
        }
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
        if (isCategoryLocked) {
             setForm(prev => ({ ...INITIAL_FORM, category: prev.category }));
        } else {
            setForm(INITIAL_FORM);
            setAvailableTopics([]);
        }
        if (fileInputRef.current) fileInputRef.current.value = "";
        if (imageInputRef.current) imageInputRef.current.value = "";
    };

    const handleCancel = () => router.back();

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const result = await ticketService.createTicket(form);
            if (result.success) {
                alert(result.message); 
                router.push("/uikit/table"); 
            } else {
                alert("Error: " + result.message);
            }
        } catch (error) {
            alert("เกิดข้อผิดพลาดในการเชื่อมต่อระบบ");
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        form, masterData, availableTopics, isSubmitting, isCategoryLocked,
        updateField, handleCategoryChange, handleBuildingChange, handleLevelChange,
        handleFileSelect, handleRemoveFile, handleImageSelect, handleRemoveImage, 
        handleSubmit, handleReset, handleCancel, fileInputRef, imageInputRef      
    };
};