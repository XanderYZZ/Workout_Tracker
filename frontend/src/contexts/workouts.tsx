import { createContext, useContext, type FC, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/apiclient';

interface WorkoutsProviderProps {
  children: ReactNode;
} 

const WorkoutsContext = createContext<Workout[]>([]);

export const WorkoutsProvider: FC<WorkoutsProviderProps> = ({ children }) => {
  const { data: workouts = [] } = useQuery<Workout[]>({
    queryKey: ['workouts'],
    queryFn: async () => {
      const res = await apiClient.get('/workouts/');
      return res.data as Workout[];
    },
  });

  return (
    <WorkoutsContext.Provider value={workouts}>
      {children}
    </WorkoutsContext.Provider>
  );
};

export const useWorkouts = () => useContext(WorkoutsContext);