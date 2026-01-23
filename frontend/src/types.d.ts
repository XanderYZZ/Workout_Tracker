interface User {
  _id?: string;
  email?: string;
  exp?: number;
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