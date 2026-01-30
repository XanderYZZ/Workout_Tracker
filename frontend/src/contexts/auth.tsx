import { createContext, useState, useEffect, useContext, type ReactNode } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useNavigate } from 'react-router-dom';

interface AuthProviderProps {
  children: ReactNode;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  signup: (formData: any) => Promise<void>;
  login: (formData: any) => Promise<void>;
  logout: () => Promise<void>;
  errors: Record<string, string>;
  setErrors: (errors: Record<string, string>) => void;
  setIsLoading: (loading: boolean) => void;
  isAuthenticated: () => boolean;
}

const base_url = import.meta.env.VITE_BACKEND_BASE_URL;

const isAuthenticatedDefault = () => {
  const accessToken = localStorage.getItem("access_token");

  return !!accessToken;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  accessToken: null,
  setIsLoading: () => { },
  setErrors: () => { },
  signup: async () => { },
  login: async () => { },
  logout: async () => { },
  isLoading: false,
  errors: {},
  isAuthenticated: isAuthenticatedDefault,
});

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(localStorage.getItem("access_token"));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const isAuthenticated = () => {
    const token = localStorage.getItem("access_token");
    return !!token;
  };

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
    console.log(formData);
    if (formData.email?.trim().length === 0) newErrors.email = "Email is required";
    if (formData.username?.trim().length === 0) newErrors.username = "Username is required";
    if (formData.email_or_username?.trim().length === 0) newErrors.email_or_username = "Email or username is required";
    if (formData.password?.trim().length === 0) newErrors.password = "Password is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const login = async (formData: any) => {
    if (!validateForm(formData)) return;
    setIsLoading(true);

    try {
      const email_or_username: string = formData["email_or_username"];
      const password: string = formData["password"];
      const request_data = {email_or_username, password};
      console.log(request_data);
      const response = await axios.post(base_url + "/auth/login", request_data, {
        withCredentials: true,  // Enable cookies
      });
      const newAccessToken = response.data.access_token;

      setAccessToken(newAccessToken);

      toast.success("Login successful!");
      navigate('/workouts');
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.response?.data?.detail || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (formData: any) => {
    if (!validateForm(formData)) return;
    setIsLoading(true);

    try {
      const email: string = formData["email"];
      const username: string = formData["username"];
      const password: string = formData["password"];
      const request_data = {email, username, password};
      const result = await axios.post(base_url + "/auth/signup", request_data, {
        withCredentials: true,  // Enable cookies
      });
      const newAccessToken = result.data.access_token;

      setAccessToken(newAccessToken);

      toast.success("Signup successful!");
      navigate('/workouts');
    } catch (error: any) {
      console.error("Signup error:", error);
      toast.error(error.response?.data?.detail || "Signup failed");
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (accessToken) {
        await axios.post(base_url + "/auth/logout", {}, {
          headers: {
            "Authorization": `Bearer ${accessToken}`
          },
          withCredentials: true  // Enable cookies for logout
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setAccessToken(null);
      setUser(null);
      localStorage.removeItem("access_token");
      toast.success("Logged out");
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
        isLoading,
        setErrors,
        setIsLoading,
        errors,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export const createAuthAxios = (token: string | null) => {
  const authAxios = axios.create({
    baseURL: base_url + "/api/",
  });

  authAxios.interceptors.request.use((config) => {
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  return authAxios;
};