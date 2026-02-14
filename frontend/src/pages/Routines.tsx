import { useState, type FC } from "react";
import { Navbar } from "../components/navbar";
import { useRoutines } from "../contexts/routines";
import ListedRoutine from "../components/workouts/listed_routine";
import { Plus } from "lucide-react";
import { BackButton } from "../components/basic_buttons/back_button";
import {
    CreateAndEdit,
    useDeleteItem,
} from "../components/workouts/create_and_edit.tsx";

const Routines: FC = () => {
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const routines = useRoutines();
    const deleteWorkoutOrRoutine = useDeleteItem("routines");
    const defaultFormData = {
        name: "",
        exercises: [],
        comments: "",
    };

    const [formData, setFormData] = useState<WorkoutFormData | RoutineFormData>(
        defaultFormData,
    );

    const startEdit = (routine: Workout | Routine) => {
        setFormData({
            name: routine.name,
            exercises: routine.exercises
                ? routine.exercises.map((e) => ({ ...e }))
                : [],
            comments: routine.comments || "",
        });
        setEditingId(routine.id);
        setIsCreating(false);
    };

    return (
        <>
            <div className="background-primary">
                <Navbar />
                <div className="w-full px-4 sm:px-6 lg:px-8 mx-auto pt-6 max-w-7xl">
                    <div className="mb-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                                    My Routines (Work in Progress)
                                </h1>
                            </div>

                            <div className="mt-16 flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
                                <BackButton className="flex items-center gap-2 bg-[#2A2A3D] text-white px-3 py-3 rounded-lg hover:bg-gray-600 transition-colors justify-center sm:justify-start" />
                                <button
                                    onClick={() => {
                                        setFormData(defaultFormData);
                                        setIsCreating(true);
                                        setEditingId(null);
                                    }}
                                    className="flex items-center gap-2 bg-[#2A2A3D] text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors w-full sm:w-auto justify-center sm:justify-start"
                                >
                                    <Plus size={20} />
                                    New Routine
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Create/Edit Form */}
                    <CreateAndEdit
                        editType={"routines"}
                        isCreating={isCreating}
                        setIsCreating={setIsCreating}
                        setEditingId={setEditingId}
                        editingId={editingId}
                        formData={formData}
                        setFormData={setFormData}
                        defaultFormData={defaultFormData}
                    />

                    <div className="mt-6 sm:mt-8">
                        <div className="space-y-4">
                            <ul className="space-y-4">
                                {routines.map((routine) => (
                                    <ListedRoutine
                                        routine={routine}
                                        expandedId={expandedId}
                                        setExpandedId={setExpandedId}
                                        deleteRoutine={deleteWorkoutOrRoutine}
                                        startEdit={startEdit}
                                    />
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Routines;
