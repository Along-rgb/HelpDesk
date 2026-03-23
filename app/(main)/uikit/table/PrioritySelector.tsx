"use client";
import React from "react";
import { Dropdown, DropdownChangeEvent } from "primereact/dropdown";
import { Tag } from "primereact/tag";
import { PRIORITY_MAP } from "./constants";

export type PriorityOption = { id: number; name: string };

interface Props {
    priority: string;
    /** รายการจาก API GET /api/prioritys */
    options: PriorityOption[];
    onChange: (option: PriorityOption) => void;
    /** ปิดการเลือกเมื่อ status ไม่ใช่ ລໍຖ້າຮັບເລື່ອງ/ລໍຖ້າຮັບວຽກ */
    disabled?: boolean;
}

export const PrioritySelector = ({ priority, options, onChange, disabled }: Props) => {
    const getTagStyle = (value: string) => {
        const baseStyle: React.CSSProperties = {
            fontSize: "0.95rem",
            padding: "0.15rem 0.5rem",
            width: "auto",
            display: "inline-block",
        };
        if (value === "ບໍ່ລະບຸ" || value === "ທຳມະດາ" || !value) {
            return { ...baseStyle, backgroundColor: "#6c757d", color: "#ffffff" };
        }
        return baseStyle;
    };

    const dropdownOptions = options.map((p) => ({ label: p.name, value: p }));

    const valueTemplate = (selected: PriorityOption | null) => {
        const currentLabel = selected?.name ?? priority;
        const currentValue = selected?.name ?? priority;
        return (
            <Tag
                value={currentLabel}
                severity={(PRIORITY_MAP[currentValue] ?? null) as any}
                style={getTagStyle(currentValue)}
            />
        );
    };

    const itemTemplate = (option: { label: string; value: PriorityOption }) => (
        <Tag
            value={option.value.name}
            severity={(PRIORITY_MAP[option.value.name] ?? null) as any}
            style={getTagStyle(option.value.name)}
        />
    );

    const handleChange = (e: DropdownChangeEvent) => {
        const selected = e.value as PriorityOption | undefined;
        if (selected && typeof selected.id === "number" && selected.name) onChange(selected);
    };

    if (options.length === 0 || disabled) {
        return (
            <Tag
                value={priority}
                severity={(PRIORITY_MAP[priority] ?? null) as any}
                style={getTagStyle(priority)}
            />
        );
    }

    return (
        <div onClick={(e) => e.stopPropagation()}>
            <Dropdown
                value={options.find((o) => o.name === priority) ?? null}
                options={dropdownOptions}
                optionLabel="label"
                optionValue="value"
                valueTemplate={valueTemplate}
                itemTemplate={itemTemplate}
                onChange={handleChange}
                placeholder="ເລືອກຄວາມສຳຄັນ"
                style={{ width: "auto", border: "none", background: "transparent", padding: 0 }}
                pt={{
                    root: { style: { display: "inline-flex", alignItems: "center" } },
                    input: { style: { padding: 0, display: "flex", border: "none", background: "transparent", cursor: "pointer" } },
                    trigger: { style: { display: "none" } },
                }}
            />
        </div>
    );
};