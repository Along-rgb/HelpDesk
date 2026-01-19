import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';

type User = {
  user_id: number
  username: string
  fullname: string
  position_name: string
  department_id: number
  department_name: string
  division_id: number
  division_name: string
  location: number
  role: string
}

type Auth = {
  tokenType: string
  accessToken: string
}

type Store = {
    authData: Auth | null; // User data, initially null
    setAuthData: (data: Auth) => void; // Method to update auth data
    clearAuthData: () => void; // Method to clear auth data
};

export const authenStore = create<Store>()(
    devtools(
        persist(
            (set) => ({
                authData: null,
                setAuthData: (data) => {
                    set(() => ({ authData: data })); // Update auth data with new values
                },
                clearAuthData: () => {
                    set(() => ({
                        authData: null // Clear the state
                    }));
                }
            }),
            { name: 'authStore' } // Persist store with the name 'authStore'
        )
    )
);