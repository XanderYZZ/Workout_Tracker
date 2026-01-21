import type { FC } from "react";

export const ExerciseDropdown: FC<ExerciseDropdownProps> = ({
    toggleDropdown,
    isVisible,
    selectedExercise,
    exercises,
    handleToggle
}) => {
    const addExercise = (exercise: string) => (
        <li key={exercise}>
            <button
                onClick={() => handleToggle(exercise)}
                className={`w-full px-4 py-2 text-left text-gray-900 hover:bg-gray-100 ${
                    selectedExercise === exercise ? "bg-gray-200 font-semibold" : ""
                }`}
            >
                {exercise}
            </button>
        </li>
    );

    return (
        <div className="relative w-full">
            <button
                onClick={toggleDropdown}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-left text-gray-900 shadow-sm"
            >
                {selectedExercise || "Select an Exercise"}
                <span className="float-right">{isVisible ? "▲" : "▼"}</span>
            </button>

            {isVisible && (
                <ul className="absolute z-10 mt-2 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-lg">
                    {exercises.map(addExercise)}
                </ul>
            )}
        </div>
    );
};

export default ExerciseDropdown;