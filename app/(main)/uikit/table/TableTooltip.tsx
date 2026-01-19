// ไฟล์นี้จะทำหน้าที่จัดการเรื่องการ Refresh Tooltip โดยเฉพาะ หน้าหลักไม่ต้องรู้เรื่อง version หรือ useEffect อีกต่อไป
"use client";
import React, { useState, useEffect } from "react";
import { Tooltip } from "primereact/tooltip";

interface Props {
    target: string;
    dependencies: any[]; // ข้อมูลที่เปลี่ยนแล้วจะให้ Tooltip รีเซ็ต
}

export const TableTooltip = ({ target, dependencies }: Props) => {
    const [version, setVersion] = useState(0);

    useEffect(() => {
        setVersion(prev => prev + 1);
    }, dependencies); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <Tooltip 
            key={version}
            target={target} 
            className="custom-red-tooltip" 
            showDelay={200} 
            hideDelay={100} 
            autoZIndex={true} 
            mouseTrack={false} 
            mouseTrackLeft={10}
        />
    );
};