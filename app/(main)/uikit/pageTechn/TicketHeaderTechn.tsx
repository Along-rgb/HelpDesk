"use client";
import React from "react";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { STATUS_ICON_MAP, STATUS_ICON_FALLBACK } from "../table/constants";

type StatusOption = { label: string; value: string };

interface TicketHeaderTechnProps {
    statusFilter: StatusOption | null;
    setStatusFilter: (value: StatusOption | null) => void;
    statusOptions: StatusOption[];
    globalFilter: string;
    onGlobalFilterChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    isSelectionEmpty?: boolean;
    onAcceptSelf?: () => void;
    onNewTicket: () => void;
    onNewService: () => void;
}

export const TicketHeaderTechn = ({
    statusFilter,
    setStatusFilter,
    statusOptions,
    globalFilter,
    onGlobalFilterChange,
    isSelectionEmpty = true,
    onAcceptSelf,
    onNewTicket,
    onNewService
}: TicketHeaderTechnProps) => {
    const getStatusIcon = (option: StatusOption | null) =>
        option
            ? STATUS_ICON_MAP[option.value] ?? STATUS_ICON_MAP[option.value?.trim() ?? ""] ?? STATUS_ICON_MAP[option.label] ?? STATUS_ICON_MAP[option.label?.trim() ?? ""] ?? STATUS_ICON_FALLBACK
            : STATUS_ICON_FALLBACK;

    const renderStatusOption = (option: StatusOption | null) => {
        if (!option) return <span>ເລືອກສະຖານະ</span>;
        const iconClass = getStatusIcon(option);
        return (
            <div className="flex align-items-center gap-2">
                <i className={iconClass} />
                <span>{option.label}</span>
            </div>
        );
    };

    return (
        <div className="flex flex-column md:flex-row justify-content-between gap-3 mb-4">
            <div className="flex flex-wrap gap-2 align-items-center">
                <Dropdown
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.value)}
                    options={statusOptions}
                    optionLabel="label"
                    placeholder="ເລືອກສະຖານະ"
                    className="p-inputtext-sm w-full md:w-12rem"
                    showClear
                    itemTemplate={renderStatusOption}
                    valueTemplate={renderStatusOption}
                />
                <Button
                    label="ຮັບວຽກເອງ"
                    icon="pi pi-check"
                    severity="secondary"
                    size="small"
                    disabled={isSelectionEmpty}
                    onClick={onAcceptSelf}
                />
            </div>
            <div className="flex flex-wrap gap-2 align-items-center justify-content-end">
                <span className="p-input-icon-left w-full md:w-auto">
                    <i className="pi pi-search" />
                    <InputText
                        value={globalFilter}
                        onChange={onGlobalFilterChange}
                        placeholder="ຄົ້ນຫາລວມ.."
                        className="p-inputtext-sm w-full md:w-15rem"
                    />
                </span>
                <Button label="ແຈ້ງບັນຫາໃໝ່" icon="pi pi-send" severity="danger" size="small" onClick={onNewTicket} />
                <Button label="ຂໍບໍລິການໃໝ່" icon="pi pi-shopping-cart" severity="success" size="small" onClick={onNewService} />
            </div>
        </div>
    );
};
