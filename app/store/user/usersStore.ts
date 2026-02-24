import type { AxiosResponse } from 'axios';
import { create } from 'zustand';
import { initialState } from '@/config/constant-api';
import axiosClientsHelpDesk from '@/config/axiosClientsHelpDesk';
import { env } from '@/config/env';
import { isConfigured } from '@/config/env';
import type { LoginApiResponse } from '@/global/types/api';
import { Users } from '@/global/types';

/** Normalize login path: no leading slash, collapse duplicate "auth" (e.g. auth/auth/login → auth/login). */
function normalizeLoginPath(path: string): string {
  const p = path.replace(/^\/+/, '').trim();
  return p.replace(/auth\/auth\//g, 'auth/') || 'auth/login';
}

/** พารามิเตอร์สำหรับเรียก login (ตรงกับฟอร์ม Login) */
export interface LoginCredentials {
  username?: string;
  password?: string;
}

// create interface for the store
type UsersStore = {
    success: boolean;
    error: boolean;
    totalCount: number
    page: number
    pageSize: number
    totalPages: number
    loading: boolean;
    dataUser: Users.User[];
    userLogin: Users.UserLogin;
    loginUser: (userLogin: LoginCredentials) => Promise<AxiosResponse<LoginApiResponse>>;
    getUsersData: () => Promise<void>;
    getUserByUserId: (UserId: number) => Promise<void>;
    getUserById: (UserId: number) => any;
    addUser: (newUser: Users.User) => void;
    updateUser: (updatedUser: Users.User) => void;
    deleteUser: (UserId: number) => void;
};

// create the store
export const useUsersStore = create<UsersStore, []>((set, get) => ({
    ...initialState,
    dataUser: [],
    loading: false,
    loginUser: async (userLogin) => {
        if (!isConfigured('helpdeskApiUrl')) {
            throw new Error(
                'NEXT_PUBLIC_HELPDESK_API_BASE_URL is not set. Add it to .env.local (e.g. your backend URL ending with /helpdesk/api) and restart the dev server.'
            );
        }
        const loginPath = normalizeLoginPath(env.helpdeskAuthLoginPath);
        const u = userLogin?.username ?? '';
        const p = userLogin?.password ?? '';
        const payload = env.loginUsePascalCase
            ? { userName: u, password: p }
            : { username: u, password: p };
        const response = await axiosClientsHelpDesk.post<LoginApiResponse>(loginPath, payload);
        return response;
    },
    getUsersData: async () => {
        set({ ...initialState, loading: true });
        try {
            // baseURL already includes "/api"
            const response = await axiosClientsHelpDesk.get('users');
            set({ ...initialState, loading: false, success: true, dataUser: response.status === 200 ? response.data : [] });
        } catch {
            set({ ...initialState, loading: false, error: true });
        }
    },
    getUserByUserId: async (UserId) => {
        set({ ...initialState, loading: true });
        try {
            const response = await axiosClientsHelpDesk.get('/Users/byUsers/' + UserId);
            set({ ...initialState, success: true, dataUser: response.status === 200 ? response.data : [] });
        } catch {
            set({ ...initialState, error: true });
        }
    },
    getUserById: async (UserId) => {
        try {
            // Make API call to get center details by ID from the server
            const response = await axiosClientsHelpDesk.get(`/Users/byId/${UserId}`);
            // Check if the API call was successful (status code 200)
            if (response.status === 200) {
                return response.data.data;
            }
            return null;
        } catch {
            return null;
        }
    },
    addUser: async (newUser) => {
        try {
            // Make API call to add a new center on the server
            const response = await axiosClientsHelpDesk.post( '/Users/add', newUser);
            // Check if the API call was successful (status code 201)
            if (response.status === 200) {
                set((state) => ({ dataUser: [...state.dataUser, response.data] }));
            }
        } catch {
            // addUser failed — state unchanged
        }
    },
    updateUser: async (updatedUser) => {
        try {
            // Make API call to update the center on the server
            const response = await axiosClientsHelpDesk.put( `/Users/update`, updatedUser);
            // Check if the API call was successful (status code 200)
            if (response.status === 200) {
                set((state) => ({
                    dataUser: state.dataUser.map((center) =>
                        center.id === updatedUser.id ? updatedUser : center
                    ),
                }));
            }
        } catch {
            // updateUser failed — state unchanged
        }
    },
    deleteUser: async (UserId) => {
        try {
            // Make API call to delete the center on the server
            const response = await axiosClientsHelpDesk.delete( `/Users/del/${UserId}`);
            // Check if the API call was successful (status code 200)
            if (response.status === 200) {
                set((state) => ({
                    dataUser: state.dataUser.filter((center) => center.id !== UserId),
                }));
            }
        } catch {
            // deleteUser failed — state unchanged
        }
    }
}));