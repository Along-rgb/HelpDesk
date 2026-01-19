"use client";
import React from "react";
import { Dropdown, DropdownChangeEvent } from "primereact/dropdown";
import { Tag } from "primereact/tag";
import { PRIORITY_OPTIONS, PRIORITY_MAP } from "./constants";

interface Props {
    priority: string;
    onChange: (value: string) => void;
}

export const PrioritySelector = ({ priority, onChange }: Props) => {

    const getTagStyle = (value: string) => {
        const baseStyle: React.CSSProperties = {
            fontSize: '0.75rem',
            padding: '0.15rem 0.5rem',
            width: 'auto',
            display: 'inline-block'
        };
        if (value === 'ບໍ່ລະບຸ') {
            return { ...baseStyle, backgroundColor: '#6c757d', color: '#ffffff' };
        }
        return baseStyle;
    };

    const valueTemplate = (option: any) => {
        const currentValue = option ? option.value : priority;
        const currentLabel = option ? option.label : priority;
        return <Tag value={currentLabel} severity={PRIORITY_MAP[currentValue] as any} style={getTagStyle(currentValue)} />;
    };

    const itemTemplate = (option: any) => {
        return <Tag value={option.label} severity={PRIORITY_MAP[option.value] as any} style={getTagStyle(option.value)} />;
    };

    return (
        // stopPropagation: ປ້ອງກັນການເຮັດວຽກຂອງ Checkbox ໃຫ້ ທຳງານກໍຕໍ່ເມື່ອ ກົດ checkbox ເທົ່ານັ້ນ ຫຼື Row Click
        <div onClick={(e) => e.stopPropagation()}>
            <Dropdown
                value={priority}
                options={PRIORITY_OPTIONS}
                onChange={(e: DropdownChangeEvent) => onChange(e.value)}
                itemTemplate={itemTemplate}
                valueTemplate={valueTemplate}
                placeholder="Select Priority"
                style={{ width: 'auto', border: 'none', background: 'transparent', padding: 0 }}
                pt={{
                    root: { style: { display: 'inline-flex', alignItems: 'center' } },
                    input: { style: { padding: 0, display: 'flex' } },
                    trigger: { style: { display: 'none' } }
                }}
            />
        </div>
    );
};