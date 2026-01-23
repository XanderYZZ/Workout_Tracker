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

interface StartAndEndDateSelectionProps { 
     handleStartDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
     handleEndDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
     getStartDate: () => string,
     getEndDate: () => string,
}

interface ExerciseDropdownProps {
    toggleDropdown: () => void;
    isVisible: boolean;
    selectedExercise: string | null;
    exercises: string[];
    handleToggle: (exercise: string) => void;
}

interface CalendarPickerProps {
    goToPreviousMonth: () => void;
    goToNextMonth: () => void;
    goToTodayInCalendar: () => void;
    calendarDate: Date;
    selectedDate: Date;
    selectDateFromCalendar: (day: number) => void;
    getWorkoutsForDate: (date: Date) => any[];
}

interface ListedWorkoutProps {
    workout: Workout;
    setExpandedId: (id: string | null) => void;
    getExpandedId: () => string | null;
    startEdit?: (workout: Workout) => void;
    deleteWorkout?: (id: string) => void;
}