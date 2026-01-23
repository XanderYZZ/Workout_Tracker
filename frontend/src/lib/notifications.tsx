import { toast } from "react-hot-toast";

const DEFAULT_ERROR_MESSAGE = 'An error occurred';

export const Notifications = {
    showError: (error: any) => {
        let errorMessage = 
        error.response?.data?.detail 
        || error.message 
        || (typeof(error) == "string" && error) 
        || DEFAULT_ERROR_MESSAGE;

        if (typeof(errorMessage) !== "string") {
            errorMessage = DEFAULT_ERROR_MESSAGE;
        }

        toast.error(errorMessage);
    },
};