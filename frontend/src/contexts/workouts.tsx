import { createContext, useContext, type FC, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../lib/apiclient";
import { useMemo } from "react";

interface WorkoutsProviderProps {
    children: ReactNode;
}

const WorkoutsContext = createContext<Workout[]>([]);

export const WorkoutsProvider: FC<WorkoutsProviderProps> = ({ children }) => {
    const { data: workouts = [] } = useQuery<Workout[]>({
        queryKey: ["workouts"],
        queryFn: async () => {
            const res = await apiClient.get("/workouts/");
            return res.data as Workout[];
        },
    });

    const value = useMemo(() => workouts, [workouts]);

    return (
        <WorkoutsContext.Provider value={value}>
            {children}
        </WorkoutsContext.Provider>
    );
};

export const useWorkouts = () => useContext(WorkoutsContext);
