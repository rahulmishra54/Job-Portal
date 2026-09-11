import store from "../redux/store.js";
import axios from "axios";
import { setAccessToken } from "../redux/authSlice.js";

export const configureApi = (api) => {
    api.defaults.withCredentials = true;
    api.interceptors.request.use((config) => {
        const accessToken = store.getState().auth.accessToken;

        if (accessToken) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${accessToken}`;
        }

        return config;
    });

    api.interceptors.response.use(undefined, async (error) => {
        const request = error.config;
        const url = request?.url || "";
        const shouldRefresh = error.response?.status === 401
            && request
            && !request._retry
            && !url.includes("/login")
            && !url.includes("/register")
            && !url.includes("/refresh")
            && !url.includes("/logout");

        if (!shouldRefresh) {
            return Promise.reject(error);
        }

        request._retry = true;

        try {
            const refreshResponse = await axios.get(
                `${import.meta.env.VITE_USER_API_END_POINT}/refresh`,
                { withCredentials: true }
            );
            const accessToken = refreshResponse.data.accessToken;
            store.dispatch(setAccessToken(accessToken));
            request.headers = request.headers || {};
            request.headers.Authorization = `Bearer ${accessToken}`;
            return api(request);
        } catch (refreshError) {
            store.dispatch(setAccessToken(null));
            return Promise.reject(refreshError);
        }
    });

    return api;
};
