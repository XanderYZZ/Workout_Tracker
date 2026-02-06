import { createContext, useState, useEffect, useContext, type ReactNode } from "react";
import { Notifications } from "./notifications";
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { apiClient, unauthenticatedClient } from "./apiclient";

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
  resetPassword: (email: string, token: string, password: string) => Promise<void>;
  isEmailInValidForm: (email: string) => boolean;
  validatePasswordInputs: (formData: any, newErrors: Record<string, string>) => void;
}

export const passwordStrengthKeys = {
  length: false, uppercase: false, lowercase: false, digit: false, special: false
};

const isAuthenticatedDefault = () => {
  const accessToken = localStorage.getItem("access_token");

  return accessToken !== null;
};

const checkPasswordStrengthDefault = (password: string) => ({
  length: password.length >= 8,
  uppercase: /[A-Z]/.test(password),
  lowercase: /[a-z]/.test(password),
  digit: /\d/.test(password),
  special: /[^a-zA-Z0-9]/.test(password)
})

const isPasswordStrongDefault = (password: string) => {
  const requirements = checkPasswordStrengthDefault(password);

  return Object.values(requirements).every(Boolean);
}

const isEmailInValidFormDefault = (email: string) => {
  return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  accessToken: null,
  setIsLoading: () => { },
  setErrors: () => { },
  signup: async () => { },
  login: async () => { },
  logout: async () => { },
  authenticate: async () => { },
  resetPassword: async () => { },
  initialResetPasswordRequest: async () => { },
  isLoading: false,
  errors: {},
  isAuthenticated: isAuthenticatedDefault,
  checkPasswordStrength: checkPasswordStrengthDefault,
  isPasswordStrong: isPasswordStrongDefault,
  isEmailInValidForm: isEmailInValidFormDefault,
  validatePasswordInputs: (formData: any, newErrors: Record<string, string>) => { },
});

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(localStorage.getItem("access_token"));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthenticated = isAuthenticatedDefault;
  const checkPasswordStrength = checkPasswordStrengthDefault;
  const isPasswordStrong = isPasswordStrongDefault;
  const isEmailInValidForm = isEmailInValidFormDefault;

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
    if (formData.email?.trim().length === 0) newErrors.email = "Email is required";
    if (formData.username?.trim().length === 0) newErrors.username = "Username is required";
    if (formData.email_or_username?.trim().length === 0) newErrors.email_or_username = "Email or username is required";
    if (formData.password?.trim().length === 0) newErrors.password = "Password is required";
    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordInputs = (formData: any, newErrors: Record<string, string>) => {
    if (!formData.password) newErrors.password = 'Password is required';
      else if (!isPasswordStrong(formData.password))
          newErrors.password = 'Password does not meet strength requirements';

      if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
      else if (formData.password !== formData.confirmPassword)
          newErrors.confirmPassword = 'Passwords do not match';
  }

  const login = async (formData: any) => {
    if (!validateForm(formData)) return;
    setIsLoading(true);

    try {
      const email_or_username: string = formData["email_or_username"];
      const password: string = formData["password"];
      const request_data = { email_or_username, password };
      const response = await unauthenticatedClient.post("/auth/login", request_data);
      console.log(response);
      const newAccessToken = response.data.access_token;

      setAccessToken(newAccessToken);

      Notifications.showSuccess("Login successful!");
      navigate('/workouts');
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
      const response = await unauthenticatedClient.post("/auth/authenticate", request_data);

      if (response.status === 200) {
        Notifications.showSuccess("Email verified successfully! Redirecting to workouts...");
        const newAccessToken = response.data.access_token;
        setAccessToken(newAccessToken);
        navigate('/workouts', { replace: true });
      } else {
        Notifications.showError("Verification failed. Please try again.");
      }
    } catch (error) {
      Notifications.showError(error);
    }
  };

  const initialResetPasswordRequest = async(email: string) => {
    try {
      const request_data = { email };
      const response = await unauthenticatedClient.post("/auth/initial-reset-password", request_data);

      if (response.status === 200) {
        Notifications.showSuccess(response.data?.message);
      } else {
        Notifications.showError("The email sending failed. Please try again.");
      }
    } catch (error) {
      Notifications.showError(error);
    }
  }

  const resetPassword = async(email: string, token: string, password: string) => {
    try {
      const request_data = { email, token, password };
      const response = await unauthenticatedClient.post("/auth/reset-password", request_data);

      if (response.status === 200) {
        Notifications.showSuccess("You reset your password!");
        navigate('/login', { replace: true });
      } else {
        Notifications.showError("The email sending failed. Please try again.");
      }
    } catch (error) {
      Notifications.showError(error);
    }
  }

  const signup = async (formData: any) => {
    if (!validateForm(formData)) return;
    setIsLoading(true);

    try {
      const email: string = formData["email"];
      const username: string = formData["username"];
      const password: string = formData["password"];
      const request_data = { email, username, password };
      const response = await unauthenticatedClient.post("/auth/signup", request_data);

      if (response && response.data?.message) {
        Notifications.showSuccess(response.data?.message);
        // Redirect to a new page.
        navigate('/check-inbox');
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
      navigate('/');
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);