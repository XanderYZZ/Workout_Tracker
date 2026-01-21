import type { FC } from "react";
import { useEffect, useState } from "react";
import { apiClient } from "../lib/apiclient";
import { Navbar } from "../components/navbar";
import { ExerciseDropdown } from "../components/exercise_dropdown";

const Reports: FC = () => {
    type STATUS_TYPE = "none" | "loading" | "error" | "success";
    type REPORT_TYPE_OPEN = "contains" | "volume" | "1rm";

    const [reportType, setReportType] = useState<REPORT_TYPE_OPEN>("contains");
    const [isVisible, setIsVisible] = useState(false);
    const [exercises, setExercises] = useState<string[]>([]);
    const [selectedExercise, setSelectedExercise] = useState("");
    const [status, setStatus] = useState<STATUS_TYPE>("none");
    const [workouts, setWorkouts] = useState<Workout[]>([]);
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");

    const setReportTypeToContains = () => setReportType("contains");
    const setReportTypeToVolume = () => setReportType("volume");
    const setReportTypeTo1RM = () => setReportType("1rm");

    const fetchAllExercises = async () => {
        try {
            const response = await apiClient.get("/reports/exercises");
            setExercises(response.data.exercises);
        } catch (error) {
            console.error("Error fetching exercises report:", error);
        }
    };

    const fetchWorkoutsWithSelectedExercise = async () => {
        if (!selectedExercise) {
            setWorkouts([]);
            setStatus("none");
            return;
        }

        try {
            setStatus("loading");
            const response = await apiClient.post("/reports/contains", {
                exercise: selectedExercise,
            });
            setWorkouts(response.data.workouts);
            setStatus("success");
        } catch (error) {
            console.error("Error fetching workouts report:", error);
            setWorkouts([]);
            setStatus("error");
        }
    };

    const handleToggle = (exercise: string) => {
        const isDeselecting = selectedExercise === exercise;
        setSelectedExercise(isDeselecting ? "" : exercise);
        setIsVisible(false);
    };

    const toggleDropdown = () => setIsVisible(v => !v);

    useEffect(() => {
        fetchAllExercises();
    }, []);

    useEffect(() => {
        fetchWorkoutsWithSelectedExercise();
    }, [selectedExercise]);

    useEffect(() => {
        // Reset state when report type changes.
        setSelectedExercise("");
        setWorkouts([]);
        setStatus("none");
        setIsVisible(false);
    }, [reportType]);

    const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setStartDate(e.target.value);
    };

    const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEndDate(e.target.value);
    };   

    const generateVolumeReport = () => {
        if (startDate == "" || endDate == "") { return; }

        apiClient.post("/reports/volume", {
            start_date: new Date(startDate).toISOString(),
            end_date: new Date(endDate).toISOString(),
            exercise: selectedExercise || null,
        }).then(response => {
            console.log("Volume Report Data:", response.data);
        }).catch(error => {
            console.error("Error generating volume report:", error);
        });
    };

    return (
        <div className="background-primary min-h-screen">
            <Navbar />
            {/* Selection for different types of reports */}
            <div className="pt-4 flex min-h-10 items-center justify-center">
                <button
                    onClick={setReportTypeToContains}
                    className={reportType == "contains" ? "mr-12 w-30 rounded-lg bg-blue-400 px-4 py-2 text-white" : "mr-12 w-30 rounded-lg bg-gray-400 px-4 py-2 text-white"}
                >
                    Contains
                </button>
                <button
                    onClick={setReportTypeToVolume}
                    className={reportType == "volume" ? "mr-12 w-30 rounded-lg bg-blue-400 px-4 py-2 text-white" : "mr-12 w-30 rounded-lg bg-gray-400 px-4 py-2 text-white"}
                >
                    Volume
                </button>
                <button
                    onClick={setReportTypeTo1RM}
                    className={reportType == "1rm" ? "mr-12 w-30 rounded-lg bg-blue-400 px-4 py-2 text-white" : "mr-12 w-30 rounded-lg bg-gray-400 px-4 py-2 text-white"}
                >
                    1RM
                </button>
            </div>

            {exercises.length === 0 ? (
                <div className="flex min-h-screen items-center justify-center">
                    <p className="text-lg text-gray-900">
                        No exercise data available for reports.
                    </p>
                </div>
            ) : (
                <>
                {/* Report: Contains */}
                {reportType === "contains" && (
                    <div className="flex justify-center pt-32">
                        <div className="w-full max-w-3xl px-4 flex flex-col items-center space-y-4">
                            {/* Heading */}
                            <h1 className="text-gray-900 text-lg text-center">
                                Select an exercise to show all workouts that contain it.
                            </h1>

                            {/* Selector */}
                            {ExerciseDropdown(
                                toggleDropdown,
                                () => isVisible,
                                () => selectedExercise || null,
                                () => exercises,
                                handleToggle
                            )}

                            {/* Report Panel */}
                            <div className="w-full rounded-xl bg-white p-6 shadow-md">
                                {status === "none" && (
                                    <p className="text-gray-600">
                                        Select an exercise to view related workouts.
                                    </p>
                                )}

                                {status === "loading" && (
                                    <p className="text-gray-600">
                                        Loading workouts…
                                    </p>
                                )}

                                {status === "error" && (
                                    <div className="space-y-4">
                                        <p className="text-red-600">
                                            Error fetching workouts.
                                        </p>
                                        <button
                                            onClick={fetchWorkoutsWithSelectedExercise}
                                            className="w-full rounded-lg bg-red-600 px-4 py-2 text-white"
                                        >
                                            Retry
                                        </button>
                                    </div>
                                )}

                                {status === "success" && (
                                    <div className="space-y-4">
                                        <h2 className="text-xl font-semibold text-gray-900">
                                            Workouts containing “{selectedExercise}”
                                        </h2>

                                        <ul className="space-y-4">
                                            {workouts.map(workout => (
                                                <li
                                                    key={workout.id}
                                                    className="rounded-lg border border-gray-200 p-4"
                                                >
                                                    <h3 className="font-semibold text-gray-900">
                                                        {workout.name}
                                                    </h3>

                                                    <p className="text-sm text-gray-600">
                                                        Scheduled:{" "}
                                                        {new Date(workout.scheduled_date).toLocaleDateString()}
                                                    </p>

                                                    {workout.exercises?.length > 0 && (
                                                        <div className="mt-3">
                                                            <p className="font-medium text-gray-900">
                                                                Exercises
                                                            </p>
                                                            <ul className="list-disc list-inside text-sm">
                                                                {workout.exercises.map((exercise, i) => (
                                                                    <li key={i} className="text-gray-600">
                                                                        {exercise.name} — {exercise.sets}×{exercise.reps} @ {exercise.weight} lbs
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}

                                                    {workout.comments && (
                                                        <p className="mt-2 text-sm text-gray-700">
                                                            Comments: {workout.comments}
                                                        </p>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Report: Volume */}
                {reportType === "volume" && (
                    <div className="flex justify-center pt-32">
                        <div className="w-full max-w-3xl px-4 flex flex-col items-center space-y-4">
                        <h1 className="text-gray-900 text-lg">Volume Report</h1>
                        {/* Start date */}
                        <div className="flex items-center space-x-8">
                            <label className="block text-gray-900 min-w-20 max-w-20">
                                Start Date:
                            </label>
                            <input onChange={handleStartDateChange} type="date" className="bg-gray-600 border border-gray-300 rounded-lg px-4 py-2 w-full max-w-xs" />
                        </div>
                        {/* End date */}
                        <div className="flex items-center space-x-8">
                            <label className="block text-gray-900 min-w-20 max-w-20">
                                End Date:
                            </label>
                            <input onChange={handleEndDateChange} type="date" className="bg-gray-600 border border-gray-300 rounded-lg px-4 py-2 w-full max-w-xs" />
                        </div>
                        <h1 className="text-gray-900 text-lg text-center">
                            Optionally select an exercise to only include it.
                        </h1>

                        {/* Selector */}
                        {ExerciseDropdown(
                            toggleDropdown,
                            () => isVisible,
                            () => selectedExercise || null,
                            () => exercises,
                            handleToggle
                        )}

                        <button onClick={generateVolumeReport} className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white">
                            Generate Report
                        </button>
                        </div>
                    </div>
                )}
            </>
            )}
        </div>
    );
};

export default Reports;