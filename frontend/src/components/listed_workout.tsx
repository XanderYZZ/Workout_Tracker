import type { FC } from "react";
import { DatesLibrary } from "../lib/dates";
import { Calendar, Edit2, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Card } from "./card.tsx";

interface ListedWorkoutProps {
    workout: Workout;
    setExpandedId: (id: string | null) => void;
    expandedId: string | null;
    startEdit?: (workout: Workout) => void;
    deleteWorkout?: (id: string) => void;
}

export const ListedWorkout: FC<ListedWorkoutProps> = ({
    workout,
    expandedId,
    setExpandedId,
    startEdit,
    deleteWorkout,
}) => {
    const getTotalWorkoutVolume = (): number => {
        let totalVolume = 0;

        for (let exercise of workout.exercises) {
            totalVolume += exercise.sets * exercise.reps * exercise.weight;
        }

        return totalVolume;
    };

    return (
        <>
            <Card key={workout.id}>
                <div className="p-4">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-white">
                                {workout.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1 text-sm text-white">
                                <Calendar size={16} />
                                {DatesLibrary.formatDateToLocaleDateString(
                                    workout.scheduled_date,
                                )}
                            </div>
                            {workout.exercises &&
                                workout.exercises.length > 0 && (
                                    <p className="text-sm text-white mt-1">
                                        {workout.exercises.length} exercise
                                        {workout.exercises.length !== 1
                                            ? "s"
                                            : ""}
                                    </p>
                                )}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() =>
                                    setExpandedId(
                                        expandedId === workout.id
                                            ? null
                                            : workout.id,
                                    )
                                }
                                className="p-2 text-white hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                {expandedId === workout.id ? (
                                    <ChevronUp size={20} />
                                ) : (
                                    <ChevronDown size={20} />
                                )}
                            </button>
                            {startEdit && deleteWorkout && (
                                <>
                                    <button
                                        onClick={() => startEdit(workout)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                        <Edit2 size={20} />
                                    </button>
                                    <button
                                        onClick={() =>
                                            deleteWorkout(workout.id)
                                        }
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {expandedId === workout.id && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="bg-gray-50 rounded p-3 text-sm mb-2">
                                <div className="font-medium text-gray-900 mb-0">
                                    <p>
                                        Total Volume:{" "}
                                        {getTotalWorkoutVolume().toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            {workout.exercises &&
                                workout.exercises.length > 0 && (
                                    <div className="mb-4">
                                        <h4 className="text-sm font-medium text-white mb-2">
                                            Exercises
                                        </h4>
                                        <div className="space-y-2">
                                            {workout.exercises.map(
                                                (exercise, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="bg-gray-50 rounded p-3 text-sm"
                                                    >
                                                        <div className="font-medium text-gray-900">
                                                            {exercise.name}
                                                        </div>
                                                        <div className="text-gray-600 mt-1">
                                                            {exercise.sets} sets
                                                            × {exercise.reps}{" "}
                                                            reps
                                                            {` @ ${exercise.weight.toLocaleString()} lbs`}
                                                        </div>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                )}
                            {workout.comments && (
                                <div>
                                    <h4 className="text-sm font-medium text-white mb-2">
                                        Comments
                                    </h4>
                                    <p className="break-words whitespace-normal text-sm text-gray-600 bg-gray-50 rounded p-5">
                                        {workout.comments}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </Card>
        </>
    );
};

export default ListedWorkout;
