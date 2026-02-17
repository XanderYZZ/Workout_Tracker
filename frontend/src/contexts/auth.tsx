import {
    createContext,
    useState,
    useEffect,
    useContext,
    type ReactNode,
} from "react";
import { Notifications } from "../lib/notifications";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { apiClient, unauthenticatedClient } from "../lib/apiclient";

interface AuthProviderProps {
    children: ReactNode;
}

interface AuthContextType {
    user: User | null;
    accessToken: string | null;
    isLoading: boolean;
    signup: (formData: any) => Promise<void>;
    login: (formData: any) => Promise<void>;
    authenticate: (token: string, email: string) => Promise<void>;
    logout: () => Promise<void>;
    errors: Record<string, string>;
    setErrors: (errors: Record<string, string>) => void;
    setIsLoading: (loading: boolean) => void;
    isAuthenticated: () => boolean;
    checkPasswordStrength: (password: string) => {
        length: boolean;
        uppercase: boolean;
        lowercase: boolean;
        digit: boolean;
        special: boolean;
    };
    isPasswordStrong: (password: string) => boolean;
    initialResetPasswordRequest: (email: string) => Promise<void>;
    resetPassword: (
        email: string,
        token: string,
        password: string,
    ) => Promise<void>;
    isEmailInValidForm: (email: string) => boolean;
    validatePasswordInputs: (
        formData: any,
        newErrors: Record<string, string>,
    ) => void;
    isResetPasswordTokenValid: (token: string) => Promise<boolean>;
    isEmailConfirmationTokenValid: (token: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const passwordStrengthKeys = {
    length: false,
    uppercase: false,
    lowercase: false,
    digit: false,
    special: false,
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<User | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(
        localStorage.getItem("access_token"),
    );
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const isAuthenticated = () => Boolean(accessToken);

    const checkPasswordStrength = (password: string) => ({
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        digit: /\d/.test(password),
        special: /[^a-zA-Z0-9]/.test(password),
    });

    const isPasswordStrong = (password: string) => {
        const requirements = checkPasswordStrength(password);

        return Object.values(requirements).every(Boolean);
    };

    const isEmailInValidForm = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const validatePasswordInputs = (
        formData: any,
        newErrors: Record<string, string>,
    ) => {
        if (!formData.password) newErrors.password = "Password is required";
        else if (!isPasswordStrong(formData.password))
            newErrors.password = "Password does not meet strength requirements";

        if (!formData.confirmPassword)
            newErrors.confirmPassword = "Please confirm your password";
        else if (formData.password !== formData.confirmPassword)
            newErrors.confirmPassword = "Passwords do not match";
    };

    // Reset errors each time the current page changes.
    useEffect(() => {
        setErrors({});
    }, [location.pathname]);

    const parseJwt = (token: string): any => {
        try {
            return JSON.parse(atob(token.split(".")[1]));
        } catch (e) {
            return null;
        }
    };

    useEffect(() => {
        if (accessToken) {
            const decoded = parseJwt(accessToken);
            if (decoded) {
                setUser({
                    _id: decoded.sub,
                    email: decoded.email,
                    username: decoded.username,
                    exp: decoded.exp,
                });
            } else {
                setUser(null);
            }
            localStorage.setItem("access_token", accessToken);
        } else {
            setUser(null);
            localStorage.removeItem("access_token");
        }
    }, [accessToken]);

    const validateForm = (formData: any): boolean => {
        const newErrors: Record<string, string> = {};
        if (formData.email?.trim().length === 0)
            newErrors.email = "Email is required";
        if (formData.username?.trim().length === 0)
            newErrors.username = "Username is required";
        if (formData.email_or_username?.trim().length === 0)
            newErrors.email_or_username = "Email or username is required";
        if (formData.password?.trim().length === 0)
            newErrors.password = "Password is required";
        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    };

    const grabAccessTokenFromResponse = (response: any) => {
        const newAccessToken = response.data.access_token;
        setAccessToken(newAccessToken);
        Notifications.showSuccess("Login successful!");
        navigate("/workouts", { replace: true });
        Notifications.showSuccess(
            "Logged in successfully! Redirecting to workouts...",
        );
    };

    const login = async (formData: any) => {
        if (Object.keys(errors).length > 0 || !validateForm(formData)) return;
        setIsLoading(true);

        try {
            const email_or_username: string = formData["email_or_username"];
            const password: string = formData["password"];
            const request_data = { email_or_username, password };
            const response = await unauthenticatedClient.post(
                "/auth/login",
                request_data,
            );
            grabAccessTokenFromResponse(response);
        } catch (error: any) {
            console.error("Login error:", error);
            Notifications.showError(error);
        } finally {
            setIsLoading(false);
        }
    };

    const authenticate = async (verification_token: string, email: string) => {
        try {
            const request_data = { verification_token, email };
            const response = await unauthenticatedClient.post(
                "/auth/authenticate",
                request_data,
            );

            if (response.status === 200) {
                grabAccessTokenFromResponse(response);
            } else {
                Notifications.showError(
                    "Verification failed. Please try again.",
                );
            }
        } catch (error) {
            Notifications.showError(error);
        }
    };

    const initialResetPasswordRequest = async (email: string) => {
        try {
            const request_data = { email };
            const response = await unauthenticatedClient.post(
                "/auth/initial-reset-password",
                request_data,
            );

            if (response.status === 200) {
                Notifications.showSuccess(response.data?.message);
            } else {
                Notifications.showError(
                    "The email sending failed. Please try again.",
                );
            }
        } catch (error) {
            Notifications.showError(error);
        }
    };

    const isTokenRequestValid = async (type: string, token: string): Promise<boolean> => {
        try {
            const request_data = { type, token, };
            const response = await unauthenticatedClient.post("/auth/is-request-token-valid", request_data);

            return response.status === 200;
        } catch (error) {
            return false;
        }
    }

    const isResetPasswordTokenValid = (token: string) => isTokenRequestValid("reset-password", token);
    const isEmailConfirmationTokenValid = (token: string) => isTokenRequestValid("email-confirmation", token);

    const resetPassword = async (
        email: string,
        token: string,
        password: string,
    ) => {
        if (Object.keys(errors).length > 0) {
            return;
        }

        try {
            const request_data = { email, token, password };
            const response = await unauthenticatedClient.post(
                "/auth/reset-password",
                request_data,
            );

            if (response.status === 200) {
                grabAccessTokenFromResponse(response);
            } else {
                Notifications.showError(
                    "The password reset failed. Please try again.",
                );
            }
        } catch (error) {
            Notifications.showError(error);
        }
    };

    const signup = async (formData: any) => {
        if (Object.keys(errors).length > 0 || !validateForm(formData)) return;
        setIsLoading(true);

        try {
            const email: string = formData["email"];
            const username: string = formData["username"];
            const password: string = formData["password"];
            const request_data = { email, username, password };
            const response = await unauthenticatedClient.post(
                "/auth/signup",
                request_data,
            );

            if (response && response.data?.message) {
                Notifications.showSuccess(response.data?.message);
                // Redirect to a new page.
                navigate("/check-inbox", { replace: true });
            }
        } catch (error: any) {
            console.error("Signup error:", error);
            Notifications.showError(error);
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        try {
            await apiClient.post("/auth/logout");
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            setAccessToken(null);
            setUser(null);
            localStorage.removeItem("access_token");
            Notifications.showSuccess("Logged out");
            navigate("/", { replace: true });
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                accessToken,
                signup,
                login,
                logout,
                authenticate,
                isLoading,
                setErrors,
                setIsLoading,
                errors,
                isAuthenticated,
                resetPassword,
                initialResetPasswordRequest,
                isPasswordStrong,
                checkPasswordStrength,
                isEmailInValidForm,
                validatePasswordInputs,
                isResetPasswordTokenValid,
                isEmailConfirmationTokenValid,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return ctx;
};
