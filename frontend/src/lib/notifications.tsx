import { toast } from "react-hot-toast";

const DEFAULT_ERROR_MESSAGE = "An error occurred";

export const Notifications = {
    showSuccess: (message: string) => {
        toast.success(message);
    },

    showError: (error: any) => {
        const detail = error?.response?.data?.detail;
        let errorMessage = DEFAULT_ERROR_MESSAGE;

        if (typeof detail === "string") {
            errorMessage = detail;
        } else if (Array.isArray(detail) && detail[0]?.msg) {
            errorMessage = detail[0].msg;
        } else if (typeof error?.message === "string") {
            errorMessage = error.message;
        } else if (typeof error === "string") {
            errorMessage = error;
        }

        // I don't want to display error messages about tokens.
        if (errorMessage.toLowerCase().includes("token")) {
            return;
        }

        toast.error(errorMessage);
    },
};
