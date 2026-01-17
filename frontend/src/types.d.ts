interface User {
  _id?: string;
  email?: string;
  exp?: number;
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

interface Exercise {
  name: string;
  sets: number;
  reps: number;
  weight: number;
}

interface Workout {
  id: string;
  name: string;
  scheduled_date: string;
  exercises: Exercise[];
  comments: string;
  created_at?: string;
  updated_at?: string;
}

interface WorkoutFormData {
  name: string;
  scheduled_date: string;
  exercises: Exercise[];
  comments: string;
}

interface AuthProviderProps {
  children: ReactNode;
}