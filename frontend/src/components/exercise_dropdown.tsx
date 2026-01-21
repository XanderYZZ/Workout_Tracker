export const ExerciseDropdown = (toggleDropdown : () => void, getVisible : () => boolean, getSelectedExercise : () => string | null, getExercises : () => string[], handleToggle : (exercise: string) => void) => {
    return (
        <div className="relative w-full">
            <button
                onClick={toggleDropdown}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-left text-gray-900 shadow-sm"
            >
                {getSelectedExercise() || "Select an Exercise"}
                <span className="float-right">
                    {getVisible() ? "▲" : "▼"}
                </span>
            </button>

            {getVisible() && (
                <ul className="absolute z-10 mt-2 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-lg">
                    {getExercises().map(exercise => (
                        <li key={exercise}>
                            <button
                                onClick={() => handleToggle(exercise)}
                                className={`w-full px-4 py-2 text-left text-gray-900 hover:bg-gray-100 ${
                                    getSelectedExercise() === exercise
                                        ? "bg-gray-200 font-semibold"
                                        : ""
                                }`}
                            >
                                {exercise}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}       