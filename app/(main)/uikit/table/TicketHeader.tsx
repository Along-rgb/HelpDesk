"use client";
import React from "react";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { MultiSelect } from "primereact/multiselect";
import { STATUS_ICON_MAP, STATUS_ICON_FALLBACK } from "./constants";
import type { StatusOption, AssigneeOption } from "./types";

interface TicketHeaderProps {
    statusFilter: string | StatusOption | null;
    setStatusFilter: (value: string | StatusOption | null) => void;
    statusOptions: StatusOption[];
    assignOptions: AssigneeOption[];
    assignmentSectionTitle: string;
    assignFilter: AssigneeOption[] | null;
    setAssignFilter: (value: AssigneeOption[] | null) => void;
    globalFilter: string;
    onGlobalFilterChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    isSelectionEmpty: boolean;
    onBulkAssign: () => void;
    showReceiveSelfButton?: boolean;
    receiveSelfDisabled?: boolean;
    onReceiveTaskSelf?: () => void;
}

export const TicketHeader = ({
    statusFilter, setStatusFilter, statusOptions, assignOptions, assignmentSectionTitle, assignFilter, setAssignFilter,
    globalFilter, onGlobalFilterChange, isSelectionEmpty, onBulkAssign,
    showReceiveSelfButton, receiveSelfDisabled, onReceiveTaskSelf,
}: TicketHeaderProps) => {

    const getStatusIcon = (option: StatusOption) =>
        STATUS_ICON_MAP[option.label]
        ?? STATUS_ICON_MAP[option.label?.trim() ?? '']
        ?? STATUS_ICON_MAP[option.value]
        ?? STATUS_ICON_FALLBACK;

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

    const panelFooterTemplate = () => (
        <div className="py-2 px-3 border-top-1 surface-border">
            <Button
                label="ມອບວຽກ" className="w-full" size="small" style={{ fontSize: '0.85rem', padding: '0.5rem' }}
                disabled={!assignFilter || assignFilter.length === 0}
                onClick={onBulkAssign}
            />
        </div>
    );

    return (
        <div className="flex flex-column md:flex-row justify-content-between gap-3 mb-4">
            {/* LEFT */}
            <div className="flex flex-wrap gap-2 align-items-center">
                <Dropdown
                    value={statusFilter} onChange={(e) => setStatusFilter(e.value)}
                    options={statusOptions} optionLabel="label" placeholder="ເລືອກສະຖານະ"
                    className="p-inputtext-sm w-full md:w-12rem" showClear
                    itemTemplate={renderStatusOption} valueTemplate={renderStatusOption}
                />
                <MultiSelect
                    value={assignFilter} onChange={(e) => setAssignFilter(e.value)}
                    options={assignOptions} optionLabel="label"
                    placeholder="ມອບໝາຍວຽກ" className="p-inputtext-sm w-full md:w-15rem"
                    filter showSelectAll={false}
                    panelHeaderTemplate={assignmentSectionTitle ? () => <div className="font-semibold p-2 text-center text-primary">{assignmentSectionTitle}</div> : undefined}
                    panelFooterTemplate={panelFooterTemplate} display="chip"
                    disabled={isSelectionEmpty}
                    itemTemplate={(option: AssigneeOption) => <div className="text-sm flex align-items-center gap-2">{option.label}</div>}
                />
                {showReceiveSelfButton && (
                    <Button
                        label="ຮັບວຽກເອງ"
                        icon="pi pi-check"
                        severity="secondary"
                        size="small"
                        disabled={receiveSelfDisabled ?? true}
                        onClick={onReceiveTaskSelf}
                    />
                )}
            </div>

            {/* RIGHT */}
            <div className="flex flex-wrap gap-2 align-items-center justify-content-end">
                <span className="p-input-icon-left w-full md:w-auto">
                    <i className="pi pi-search" />
                    <InputText value={globalFilter} onChange={onGlobalFilterChange} placeholder="ຄົ້ນຫາລວມ.." className="p-inputtext-sm w-full md:w-15rem" />
                </span>
            </div>
        </div>
    );
};