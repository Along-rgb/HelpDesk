/** Shared CSS and Tooltip config used by ReportTable and RepairHistoryPage */

export const REPORT_TABLE_CSS = `
    .custom-large-table .p-datatable-thead > tr > th {
        font-size: 13px !important;
        font-weight: bold;
        padding: 0.5rem 0.4rem !important;
        white-space: nowrap;
        position: sticky;
        top: 0;
        z-index: 2;
        background: #f8f9fa;
    }
    .custom-large-table .p-datatable-tbody > tr > td {
        font-size: 13px !important;
        padding: 0.4rem 0.4rem !important;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .custom-large-table .p-rowgroup-header { background-color: #f8f9fa !important; }

    .white-tooltip .p-tooltip-text {
        background-color: #ffffff !important;
        color: #495057 !important;
        box-shadow: 0 4px 15px rgba(0,0,0,0.15) !important;
        border: 1px solid #e9ecef;
        padding: 10px 15px;
        border-radius: 6px;
        font-size: 14px;
        white-space: pre-wrap;
        max-width: 400px;
    }
    .white-tooltip.p-tooltip-bottom .p-tooltip-arrow {
        border-bottom-color: #d32f2f !important;
    }

    .p-paginator {
        display: flex;
        justify-content: center !important;
        align-items: center;
        flex-wrap: wrap;
        gap: 1.5rem;
        padding: 0.5rem 1rem;
    }
    .p-paginator-current {
        background: transparent;
        color: #495057;
        font-weight: bold;
        margin: 0 !important;
        padding: 0 !important;
    }
    .p-paginator-rpp-options {
        margin: 0 !important;
    }
    @media (max-width: 768px) {
        .p-paginator {
            flex-direction: column;
            gap: 10px;
        }
    }
`;

export const WHITE_TOOLTIP_PROPS = {
    className: 'white-tooltip' as const,
    mouseTrack: false,
    autoZIndex: true,
    baseZIndex: 10000,
    showDelay: 300,
} as const;
