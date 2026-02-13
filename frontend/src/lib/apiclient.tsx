import axios, {
    type AxiosInstance,
    type InternalAxiosRequestConfig,
} from "axios";
import { Notifications } from "./notifications";

const API_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;

// Unauthenticated client for auth endpoints (signup, login, etc)
export const unauthenticatedClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
});

// Authenticated client for protected endpoints
export const apiClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
});

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function onRefreshed(token: string) {
    refreshSubscribers.forEach((callback) => callback(token));
    refreshSubscribers = [];
}

function addRefreshSubscriber(callback: (token: string) => void) {
    refreshSubscribers.push(callback);
}

apiClient.interceptors.request.use((config) => {
    const access_token = localStorage.getItem("access_token");

    if (access_token) {
        config.headers["Authorization"] = `Bearer ${access_token}`;
    }

    return config;
});

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
            retry?: boolean;
        };
        Notifications.showError(error);

        if (error.response?.status === 401 && !originalRequest.retry) {
            originalRequest.retry = true;

            if (isRefreshing) {
                return new Promise((resolve) => {
                    addRefreshSubscriber((token: string) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        resolve(apiClient(originalRequest));
                    });
                });
            }

            isRefreshing = true;

            try {
                const refreshResponse = await unauthenticatedClient.post(
                    "/auth/refresh",
                    {},
                );

                const { access_token } = refreshResponse.data;
                localStorage.setItem("access_token", access_token);

                isRefreshing = false;
                onRefreshed(access_token);
                originalRequest.headers.Authorization = `Bearer ${access_token}`;

                return apiClient(originalRequest);
            } catch (refreshError) {
                isRefreshing = false;
                refreshSubscribers = [];

                localStorage.removeItem("access_token");
                window.location.href = "/login";

                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    },
);
