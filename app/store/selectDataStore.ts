'use client';

import { create } from 'zustand';
import axiosClientsHelpDesk from '@/config/axiosClientsHelpDesk';
import type { CategorySelectItem } from '@/app/(main)/uikit/GroupProblem/types/selectCategory';
import type { TicketSelectItem } from '@/app/(main)/uikit/ticket/types/selectTicket';
import type { CategoryIconSelectItem } from '@/app/(main)/uikit/MenuApps/types';

const STALE_MS = 5 * 60 * 1000;

interface SelectDataState {
    categories: CategorySelectItem[];
    categoriesFetchedAt: number;
    categoriesLoading: boolean;
    categoriesError: string | null;

    ticketsByCategory: Record<number, TicketSelectItem[]>;
    ticketsFetchedAt: Record<number, number>;
    ticketsLoading: Record<number, boolean>;
    ticketsError: Record<number, string | null>;

    categoryIcons: CategoryIconSelectItem[];
    iconsFetchedAt: number;
    iconsLoading: boolean;

    ticketCountByCategory: Record<number, number>;
    countsFetchedAt: number;
    countsLoading: boolean;

    fetchCategories: (force?: boolean) => Promise<CategorySelectItem[]>;
    fetchTickets: (categoryId: number, force?: boolean) => Promise<TicketSelectItem[]>;
    fetchCategoryIcons: (force?: boolean) => Promise<CategoryIconSelectItem[]>;
    fetchTicketCounts: (categoryIds: number[], force?: boolean) => Promise<Record<number, number>>;
}

function normalizeCategoryResponse(data: unknown): CategorySelectItem[] {
    if (Array.isArray(data)) {
        return data.map((item: Record<string, unknown>) => ({
            id: Number(item.id),
            title: String(item.title ?? item.name ?? ''),
            description: String(item.description ?? ''),
            catIconId: item.catIconId != null ? Number(item.catIconId) : undefined,
            catIcon: typeof item.catIcon === 'string' ? item.catIcon : undefined,
        }));
    }
    if (data && typeof data === 'object' && 'data' in data && Array.isArray((data as { data: unknown }).data)) {
        return normalizeCategoryResponse((data as { data: unknown[] }).data);
    }
    return [];
}

function normalizeTicketResponse(data: unknown): TicketSelectItem[] {
    if (Array.isArray(data)) {
        return data.map((item: Record<string, unknown>) => ({
            id: Number(item.id),
            title: String(item.title ?? ''),
            description: String(item.description ?? ''),
            categoryId: item.categoryId != null ? Number(item.categoryId) : undefined,
        }));
    }
    if (data && typeof data === 'object' && 'data' in data && Array.isArray((data as { data: unknown }).data)) {
        return normalizeTicketResponse((data as { data: unknown[] }).data);
    }
    return [];
}

function normalizeIconResponse(data: unknown): CategoryIconSelectItem[] {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object' && 'data' in data && Array.isArray((data as { data: unknown }).data)) {
        return (data as { data: CategoryIconSelectItem[] }).data;
    }
    return [];
}

function normalizeCount(data: unknown): number {
    if (Array.isArray(data)) return data.length;
    if (data && typeof data === 'object' && 'data' in data && Array.isArray((data as { data: unknown }).data)) {
        return (data as { data: unknown[] }).data.length;
    }
    return 0;
}

export const useSelectDataStore = create<SelectDataState>((set, get) => ({
    categories: [],
    categoriesFetchedAt: 0,
    categoriesLoading: false,
    categoriesError: null,

    ticketsByCategory: {},
    ticketsFetchedAt: {},
    ticketsLoading: {},
    ticketsError: {},

    categoryIcons: [],
    iconsFetchedAt: 0,
    iconsLoading: false,

    ticketCountByCategory: {},
    countsFetchedAt: 0,
    countsLoading: false,

    async fetchCategories(force = false) {
        const state = get();
        if (!force && state.categories.length > 0 && Date.now() - state.categoriesFetchedAt < STALE_MS) {
            return state.categories;
        }
        if (state.categoriesLoading) return state.categories;
        set({ categoriesLoading: true, categoriesError: null });
        try {
            const res = await axiosClientsHelpDesk.get('categorys/selectcategory');
            const list = normalizeCategoryResponse(res.data);
            set({ categories: list, categoriesFetchedAt: Date.now(), categoriesLoading: false });
            return list;
        } catch (err: unknown) {
            const msg = err && typeof err === 'object' && 'response' in err
                ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
                : null;
            const errorMsg = typeof msg === 'string' ? msg : 'ເກີດຂໍ້ຜິດພາດໃນການໂຫຼດຂໍ້ມູນ';
            set({ categoriesError: errorMsg, categoriesLoading: false });
            return [];
        }
    },

    async fetchTickets(categoryId, force = false) {
        const state = get();
        const cached = state.ticketsByCategory[categoryId];
        const fetchedAt = state.ticketsFetchedAt[categoryId] ?? 0;
        if (!force && cached && cached.length > 0 && Date.now() - fetchedAt < STALE_MS) {
            return cached;
        }
        if (state.ticketsLoading[categoryId]) return cached ?? [];
        set((s) => ({
            ticketsLoading: { ...s.ticketsLoading, [categoryId]: true },
            ticketsError: { ...s.ticketsError, [categoryId]: null },
        }));
        try {
            const res = await axiosClientsHelpDesk.get('tickets/selectticket', { params: { categoryId } });
            const list = normalizeTicketResponse(res.data);
            set((s) => ({
                ticketsByCategory: { ...s.ticketsByCategory, [categoryId]: list },
                ticketsFetchedAt: { ...s.ticketsFetchedAt, [categoryId]: Date.now() },
                ticketsLoading: { ...s.ticketsLoading, [categoryId]: false },
            }));
            return list;
        } catch (err: unknown) {
            const msg = err && typeof err === 'object' && 'response' in err
                ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
                : null;
            const errorMsg = typeof msg === 'string' ? msg : 'ເກີດຂໍ້ຜິດພາດໃນການໂຫຼດລາຍການຫົວຂໍ້';
            set((s) => ({
                ticketsByCategory: { ...s.ticketsByCategory, [categoryId]: [] },
                ticketsLoading: { ...s.ticketsLoading, [categoryId]: false },
                ticketsError: { ...s.ticketsError, [categoryId]: errorMsg },
            }));
            return [];
        }
    },

    async fetchCategoryIcons(force = false) {
        const state = get();
        if (!force && state.categoryIcons.length > 0 && Date.now() - state.iconsFetchedAt < STALE_MS) {
            return state.categoryIcons;
        }
        if (state.iconsLoading) return state.categoryIcons;
        set({ iconsLoading: true });
        try {
            const res = await axiosClientsHelpDesk.get('categoryicons/selectcategoryicon');
            const list = normalizeIconResponse(res.data);
            set({ categoryIcons: list, iconsFetchedAt: Date.now(), iconsLoading: false });
            return list;
        } catch {
            set({ iconsLoading: false });
            return [];
        }
    },

    async fetchTicketCounts(categoryIds, force = false) {
        const state = get();
        if (!force && Object.keys(state.ticketCountByCategory).length > 0 && Date.now() - state.countsFetchedAt < STALE_MS) {
            return state.ticketCountByCategory;
        }
        if (state.countsLoading) return state.ticketCountByCategory;
        if (categoryIds.length === 0) return {};
        set({ countsLoading: true });
        try {
            const results = await Promise.all(
                categoryIds.map(async (id) => {
                    try {
                        const res = await axiosClientsHelpDesk.get('tickets/selectticket', { params: { categoryId: id } });
                        return { id, count: normalizeCount(res.data) };
                    } catch {
                        return { id, count: 0 };
                    }
                })
            );
            const map: Record<number, number> = {};
            results.forEach(({ id, count }) => { map[id] = count; });
            set({ ticketCountByCategory: map, countsFetchedAt: Date.now(), countsLoading: false });
            return map;
        } catch {
            set({ countsLoading: false });
            return {};
        }
    },
}));
