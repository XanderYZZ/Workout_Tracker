import { createContext, useState, useEffect, useContext, type ReactNode } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useNavigate } from 'react-router-dom';

const base_url = import.meta.env.BACKEND_BASE_URL;

const isAuthenticatedDefault = () => {
  const token = localStorage.getItem("access_token");
  
  return !!token;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  setIsLoading: () => {},
  setErrors: () => {},
  signup: async () => {},
  login: async () => {},
  logout: async () => {},
  isLoading: false,
  errors: {},
  isAuthenticated: isAuthenticatedDefault,
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("access_token"));
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
    if (token) {
      const decoded = parseJwt(token);
      if (decoded) {
        setUser({
          _id: decoded.user_id,
          username: decoded.username,
          exp: decoded.exp,
        });
      } else {
        setUser(null);
      }
      localStorage.setItem("access_token", token);
    } else {
      setUser(null);
      localStorage.removeItem("access_token");
    }
  }, [token]);

  const validateForm = (formData: any): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.username?.trim()) newErrors.username = "Username is required";
    if (!formData.password) newErrors.password = "Password is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const login = async (formData: any) => {
    if (!validateForm(formData)) return;
    setIsLoading(true);

    try {
      const response = await axios.post(base_url + "/api/auth/login", formData);
      const newToken = response.data.access_token;
      const username = response.data.username;
      setToken(newToken);
      setUser({ username });
      toast.success("Login successful!");
      navigate('/papers');
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.response?.data?.error || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (formData: any) => {
    setIsLoading(true);

    try {
      const username = formData['username'];
      const password = formData['password'];
      const email = formData['email'];
      const result = await axios.post(base_url + "/api/auth/signup", {
        username,
        password,
        email,
      });
      const newToken = result.data.access_token;
      setToken(newToken);
      toast.success("Signup successful!");
      navigate('/papers');
    } catch (error: any) {
      console.error("Signup error:", error);
      toast.error(error.response?.data?.error || "Signup failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("access_token");
    toast("Logged out");
    navigate('/');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
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