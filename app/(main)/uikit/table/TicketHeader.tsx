"use client";
import React from "react";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { MultiSelect } from "primereact/multiselect";
import { STATUS_OPTIONS, ASSIGNMENT_GROUPS } from "./constants";

interface TicketHeaderProps {
    statusFilter: any;
    setStatusFilter: (value: any) => void;
    assignFilter: any;
    setAssignFilter: (value: any) => void;
    globalFilter: string;
    onGlobalFilterChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    isSelectionEmpty: boolean;
    onNewTicket: () => void;
    onNewService: () => void;
    onBulkAssign: () => void;
}

export const TicketHeader = ({
    statusFilter, setStatusFilter, assignFilter, setAssignFilter,
    globalFilter, onGlobalFilterChange, isSelectionEmpty, onNewTicket,onNewService, onBulkAssign
}: TicketHeaderProps) => {

    // ✅ ยุบรวม Function render
    const renderStatusOption = (option: any) => {
        if (!option) return <span>ເລືອກສະຖານະ</span>;
        return (
            <div className="flex align-items-center gap-2">
                <i className={option.icon}></i>
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
                    options={STATUS_OPTIONS} optionLabel="label" placeholder="ເລືອກສະຖານະ"
                    className="p-inputtext-sm w-full md:w-12rem" showClear
                    itemTemplate={renderStatusOption} valueTemplate={renderStatusOption}
                />
                <MultiSelect
                    value={assignFilter} onChange={(e) => setAssignFilter(e.value)}
                    options={ASSIGNMENT_GROUPS} optionLabel="firstname" optionGroupLabel="label"
                    optionGroupChildren="items" optionGroupTemplate={(opt) => <div className="font-bold text-primary">{opt.label}</div>}
                    placeholder="ມອບໝາຍວຽກ" className="p-inputtext-sm w-full md:w-15rem"
                    filter showSelectAll={false} panelFooterTemplate={panelFooterTemplate} display="chip"
                    disabled={isSelectionEmpty}
                    itemTemplate={(option) => <div className="text-sm flex align-items-center gap-2">{option.label}</div>}
                />
                <Button label="ຮັບວຽກເອງ" icon="pi pi-check" severity="secondary" size="small" disabled={isSelectionEmpty} />
            </div>

            {/* RIGHT */}
            <div className="flex flex-wrap gap-2 align-items-center justify-content-end">
                <span className="p-input-icon-left w-full md:w-auto">
                    <i className="pi pi-search" />
                    <InputText value={globalFilter} onChange={onGlobalFilterChange} placeholder="ຄົ້ນຫາລວມ.." className="p-inputtext-sm w-full md:w-15rem" />
                </span>
                <Button label="ແຈ້ງບັນຫາໃໝ່" icon="pi pi-send" severity="danger" size="small" onClick={onNewTicket} />
                <Button label="ຂໍບໍລິການໃໝ່" icon="pi pi-shopping-cart" severity="success" size="small" onClick={onNewService} />
            </div>
        </div>
    );
};