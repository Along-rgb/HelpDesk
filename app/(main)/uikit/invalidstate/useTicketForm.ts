import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TicketForm, MasterData, City } from './types';
import { ticketService } from '../../../services/ticketService';
// *** Import ข้อมูลกลางมาใช้ ***
import { CATEGORY_MAP } from './ticketData'; 

const INITIAL_FORM: TicketForm = {
    category: null,
    topic: null,
    building: null,
    level: null,
    roomNumber: null,
    description: "",
    attachment: null,
};

export const useTicketForm = () => {
    // Hooks
    const router = useRouter();
    const searchParams = useSearchParams();
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // 1. Logic ดึงค่าจาก URL มาแสดงผลทันที (Clean Code: ใช้ Map จากไฟล์กลาง)
    const getInitialCategory = (): City | null => {
        const code = searchParams.get('category');
        // ตรวจสอบว่ามี Code นี้ในระบบหรือไม่
        if (code && CATEGORY_MAP[code]) {
            return { name: CATEGORY_MAP[code], code };
        }
        return null;
    };

    const initialCategory = getInitialCategory();

    // 2. State Definitions
    const [form, setForm] = useState<TicketForm>({
        ...INITIAL_FORM,
        category: initialCategory // ใส่ค่าหมวดหมู่ทันทีถ้ามี
    });
    
    const [masterData, setMasterData] = useState<MasterData | null>(null);
    const [availableTopics, setAvailableTopics] = useState<City[]>([]);
    
    // Loading & UI States
    const [isLoading, setIsLoading] = useState(false); 
    const [isSubmitting, setIsSubmitting] = useState(false); 
    const [isCategoryLocked, setIsCategoryLocked] = useState(!!initialCategory);

    // 3. Data Loading Logic (Parallel Fetching)
    useEffect(() => {
        let isMounted = true; 

        const initData = async () => {
            try {
                const categoryCode = searchParams.get('category');
                
                // โหลดข้อมูลพร้อมกัน (Parallel) เพื่อ Performance ที่ดีขึ้น
                const masterDataPromise = ticketService.getMasterData();
                const topicsPromise = categoryCode 
                    ? ticketService.getTopicsByCategory(categoryCode) 
                    : Promise.resolve([]);

                const [data, topics] = await Promise.all([masterDataPromise, topicsPromise]);
                
                if (!isMounted) return;

                setMasterData(data);

                if (topics && topics.length > 0) {
                    setAvailableTopics(topics);
                }

                // Update ข้อมูล Category จาก Database (เพื่อความมั่นใจ 100%)
                if (categoryCode && data.categories) {
                    const realCategoryObj = data.categories.find(c => c.code === categoryCode);
                    if (realCategoryObj) {
                        setForm(prev => ({ ...prev, category: realCategoryObj }));
                    }
                }

            } catch (error) {
                console.error("Failed to load data", error);
            }
        };

        initData();

        return () => { isMounted = false; };
    }, [searchParams]); 

    // 4. Helper Functions (State Updaters)
    const updateField = (field: keyof TicketForm, value: any) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    // 5. Event Handlers
    const handleCategoryChange = async (category: City | null) => {
        if (isCategoryLocked) return;

        setForm(prev => ({ ...prev, category, topic: null })); 
        setAvailableTopics([]);

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

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setForm(prev => ({ ...prev, attachment: file }));
    };

    // Handler: สำหรับปุ่ม "ປ້ອນໃໝ່" (Clear Form)
    const handleReset = () => {
        if (isCategoryLocked) {
             // ถ้า Lock Category ให้ Reset ค่าอื่น แต่คง Category ไว้
             setForm(prev => ({
                 ...INITIAL_FORM,
                 category: prev.category 
             }));
        } else {
            // ถ้าไม่ Lock ก็ Reset ทั้งหมด
            setForm(INITIAL_FORM);
            setAvailableTopics([]);
        }
        
        // Clear File Input UI
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // Handler: สำหรับปุ่ม "ຍົກເລີກ" (Back to Previous Page)
    const handleCancel = () => {
        router.back();
    };

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
            console.error("Submit Error:", error);
            alert("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່ລະບົບ");
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        form,
        masterData,
        availableTopics,
        isLoading, 
        isSubmitting,
        isCategoryLocked,
        updateField,
        handleCategoryChange,
        handleBuildingChange,
        handleLevelChange,
        handleFileSelect,
        handleSubmit,
        handleReset,
        handleCancel, // <--- Export Function ใหม่
        fileInputRef
    };
};