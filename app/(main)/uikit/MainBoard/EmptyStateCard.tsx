import React from 'react';

interface EmptyStateCardProps {
    title: string;
    headerIcon: string;       // เปลี่ยนชื่อให้ชัดเจนว่าเป็น Icon ตรงหัวข้อ
    headerColorClass: string; 
    
    imageSrc?: string;        // รับ path ของไฟล์รูปภาพ (SVG/PNG)
    message?: string;
    
    action?: React.ReactNode;
    showLink?: boolean;
    children?: React.ReactNode;
}

export const EmptyStateCard: React.FC<EmptyStateCardProps> = ({ 
    title, 
    headerIcon, 
    headerColorClass,
    imageSrc, 
    message, 
    action, 
    showLink = false,
    children
}) => {
    return (
        <div className={`card h-full p-0 border-top-3 ${headerColorClass} shadow-2 surface-card border-round`}>
            
            {/* Header Section */}
            <div className="flex justify-content-between align-items-center p-3 border-bottom-1 surface-border">
                <div className="flex align-items-center gap-2">
                    <i className={`${headerIcon} text-xl`}></i>
                    <h5 className="m-0 text-900 font-medium">{title}</h5>
                </div>
                {showLink && <span className="text-primary cursor-pointer hover:underline text-sm">ສະແດງທັງໝົດ</span>}
            </div>

            {/* Content Section */}
            <div className="p-3 h-full">
                {children ? (
                    children 
                ) : (
                    <div className="flex flex-column align-items-center justify-content-center py-5 text-center h-15rem">
                        
                        {/* Image Section (SVG) */}
                        {imageSrc ? (
                            <div className="mb-3">
                                <img 
                                    src={imageSrc} 
                                    alt={title} 
                                    style={{ width: '100px', height: 'auto' }} // กำหนดขนาดรูปภาพตรงนี้
                                />
                            </div>
                        ) : (
                            // Fallback กรณีลืมใส่รูป (แสดงเป็นกล่องเปล่าๆ หรือ icon เดิมก็ได้)
                            <div className="border-circle surface-100 p-4 mb-3 flex align-items-center justify-content-center" style={{ width: '80px', height: '80px' }}>
                                <i className="pi pi-image text-4xl text-500"></i>
                            </div>
                        )}

                        {message && <span className="text-500 mb-3">{message}</span>}
                        {action}
                    </div>
                )}
            </div>
        </div>
    );
};