import {create} from 'zustand';
import { initialState } from '@/config/constant-api';
import axiosClientsHelpDesk from '@/config/axiosClientsHelpDesk';
import { Users } from '@/global/types';


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
    loginUser: (userLogin: any) => Promise<void>;
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
        try {
            const response = await axiosClientsHelpDesk.post('/auth/signin', userLogin);
            return response;
        } catch (error) {
            console.log(error);
            throw error;
        }
    },
    getUsersData: async () => {
        set({ ...initialState, loading: true });
        try {
            const response = await axiosClientsHelpDesk.get('/api/users');
            console.log("api-data",response )
            set({ ...initialState, loading: false, success: true, dataUser: response.status === 200 ? response.data : [] });
        } catch (error) {
            console.error('Error fetching data:', error);
            set({ ...initialState, loading: false, error: true });
        }
    },
    getUserByUserId: async (UserId) => {
        set({ ...initialState, loading: true });
        try {
            const response = await axiosClientsHelpDesk.get('/Users/byUsers/' + UserId);
            set({ ...initialState, success: true, dataUser: response.status === 200 ? response.data : [] });
        } catch (error) {
            console.error('Error fetching data by province ID:', error);
            set({ ...initialState, error: true });
        }
    },
    getUserById: async (UserId) => {
        try {
            // Make API call to get center details by ID from the server
            const response = await axiosClientsHelpDesk.get(`/Users/byId/${UserId}`);
            // Check if the API call was successful (status code 200)
            if (response.status === 200) {
                // Return the retrieved news details
                return response.data.data;
            } else {
                console.error('Failed to fetch news details. Status:', response.status);
                return null;
            }
        } catch (error) {
            console.error('Error fetching news details:', error);
            return null;
        }
    },
    addUser: async (newUser) => {
        try {
            // Make API call to add a new center on the server
            const response = await axiosClientsHelpDesk.post( '/Users/add', newUser);
            // Check if the API call was successful (status code 201)
            if (response.status === 200) {
                // Update the local state with the new center
                set((state) => ({ dataUser: [...state.dataUser, response.data] }));
            } else {
                console.error('Failed to add center. Status:', response.status);
            }
        } catch (error) {
            console.error('Error adding center:', error);
        }
    },
    updateUser: async (updatedUser) => {
        try {
            // Make API call to update the center on the server
            const response = await axiosClientsHelpDesk.put( `/Users/update`, updatedUser);
            // Check if the API call was successful (status code 200)
            if (response.status === 200) {
                // Update the local state with the updated center
                set((state) => ({
                    dataUser: state.dataUser.map((center) =>
                        center.id === updatedUser.id ? updatedUser : center
                    ),
                }));
            } else {
                console.error('Failed to update center. Status:', response.status);
            }
        } catch (error) {
            console.error('Error updating center:', error);
        }
    },
    deleteUser: async (UserId) => {
        try {
            // Make API call to delete the center on the server
            const response = await axiosClientsHelpDesk.delete( `/Users/del/${UserId}`);
            // Check if the API call was successful (status code 200)
            if (response.status === 200) {
                // Update the local state by removing the deleted center
                set((state) => ({
                    dataUser: state.dataUser.filter((center) => center.id !== UserId),
                }));
            } else {
                console.error('Failed to delete center. Status:', response.status);
            }
        } catch (error) {
            console.error('Error deleting center:', error);
        }
    }
}));