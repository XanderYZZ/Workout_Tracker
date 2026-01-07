interface User {
  _id?: string;
  username?: string;
  exp?: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  signup: (formData: any) => Promise<void>;
  login: (formData: any) => Promise<void>;
  logout: () => Promise<void>;
  errors: Record<string, string>;
  setErrors: (errors: Record<string, string>) => void;
  setIsLoading: (loading: boolean) => void;
  isAuthenticated: () => boolean;
}