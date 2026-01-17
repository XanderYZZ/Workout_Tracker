import { createContext, useState, useEffect, useContext, type ReactNode } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useNavigate } from 'react-router-dom';

const base_url = import.meta.env.VITE_BACKEND_BASE_URL;

const isAuthenticatedDefault = () => {
  const accessToken = localStorage.getItem("accessToken");

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
  const [accessToken, setAccessToken] = useState<string | null>(localStorage.getItem("accessToken"));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const isAuthenticated = () => {
    const token = localStorage.getItem("accessToken");
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
          exp: decoded.exp,
        });
      } else {
        setUser(null);
      }
      localStorage.setItem("accessToken", accessToken);
    } else {
      setUser(null);
      localStorage.removeItem("accessToken");
    }
  }, [accessToken]);

  const validateForm = (formData: any): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.email?.trim()) newErrors.email = "Email is required";
    if (!formData.password) newErrors.password = "Password is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const login = async (formData: any) => {
    if (!validateForm(formData)) return;
    setIsLoading(true);

    try {
      const response = await axios.post(base_url + "/login", formData, {
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
    setIsLoading(true);

    try {
      const password = formData['password'];
      const email = formData['email'];
      const result = await axios.post(base_url + "/signup", {
        email,
        password,
      }, {
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
        await axios.post(base_url + "/logout", {}, {
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
      localStorage.removeItem("accessToken");
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