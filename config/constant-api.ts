export interface ApiState {
    loading: boolean;
    success: boolean;
    error: boolean;
    errorData: string | null;
}

export const initialState: ApiState = {
    loading: false,
    success: false,
    error: false,
    errorData: null,
  };