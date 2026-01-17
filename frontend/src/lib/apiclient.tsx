import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'

const API_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;

export const apiClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,  // Enable cookie sending
});

apiClient.interceptors.request.use((config) => {
    const accessToken = localStorage.getItem("accessToken");

    if (accessToken) {
        config.headers["Authorization"] = `Bearer ${accessToken}`;
    }

    return config;
});

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { retry?: boolean };

        if (error.response?.status === 401 && !originalRequest.retry) {
            originalRequest.retry = true;

            try {
                // Refresh token is now in HTTP-only cookie, no need to manually get it
                const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
                    withCredentials: true,
                });

                const { access_token } = refreshResponse.data;

                localStorage.setItem("accessToken", access_token);

                originalRequest.headers.Authorization = `Bearer ${access_token}`;

                return apiClient(originalRequest);
            } catch (refreshError) {
                localStorage.removeItem("accessToken");
                window.location.href = "/login";

                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);