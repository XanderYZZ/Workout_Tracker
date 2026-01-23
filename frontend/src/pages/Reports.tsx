import type { FC } from "react";
import { useEffect, useState } from "react";
import { apiClient } from "../lib/apiclient";
import { Navbar } from "../components/navbar";
import { ExerciseDropdown } from "../components/exercise_dropdown";
import { Notifications } from '../lib/notifications';
import { ListedWorkout } from "../components/listed_workout";
import { CalendarPicker } from "../components/calendar_picker";
import { DatesLibrary } from "../lib/dates";

const Reports: FC = () => {
    type STATUS_TYPE = "none" | "loading" | "error" | "success";
    type REPORT_TYPE_OPEN = "contains" | "volume" | "1rm";

    const [reportType, setReportType] = useState<REPORT_TYPE_OPEN>("contains");
    const [dropdownVisible, setDropdownVisible] = useState<boolean>(false);
    const [exercises, setExercises] = useState<string[]>([]);
    const [selectedExercise, setSelectedExercise] = useState("");
    const [status, setStatus] = useState<STATUS_TYPE>("none");
    const [workouts, setWorkouts] = useState<Workout[]>([]);
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [volumeReportTotal, setVolumeReportTotal] = useState<number | null>(null);
    const [volumeReportExercise, setVolumeReportExercise] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);

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
            Notifications.showError(error);
            setWorkouts([]);
            setStatus("error");
        }
    };

    const handleToggle = (exercise: string) => {
        const isDeselecting = selectedExercise === exercise;
        setSelectedExercise(isDeselecting ? "" : exercise);
        setDropdownVisible(false);
    };

    const toggleDropdown = () => {
        setDropdownVisible(!dropdownVisible);
    };

    useEffect(() => {
        fetchAllExercises();
    }, []);

    useEffect(() => {
        fetchWorkoutsWithSelectedExercise();
    }, [selectedExercise]);

    useEffect(() => {
        setSelectedExercise("");
        setWorkouts([]);
        setStatus("none");
        setDropdownVisible(false);
        setStartDate(null);
        setEndDate(null);
        setVolumeReportTotal(null);
        setVolumeReportExercise(null);
    }, [reportType]);

    const handleDateSelect = (start_or_end : "start" | "end", date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const day = date.getDate();
        const localDate = new Date(year, month, day);
        const setMethod = (start_or_end == "start" && setStartDate) || setEndDate;
        setMethod(localDate);
    }

    const handleStartDateSelect = (date: Date) => {
        handleDateSelect("start", date);
    };

    const handleEndDateSelect = (date: Date) => {
        handleDateSelect("end", date);
    };

    const createDatePickerSection = (
        label: string,
        date: Date | null,
        isOpen: boolean,
        setIsOpen: (value: boolean) => void,
        onSelect: (date: Date) => void
    ) => (
        <div className="bg-white rounded-lg shadow-md p-4">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
            >
                {date ? `${label}: ${date.toLocaleDateString()}` : `Select ${label}`}
            </button>
            <CalendarPicker
                selectedDate={date || new Date()}
                onSelectDate={onSelect}
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
            />
        </div>
    );

    const generateVolumeReport = () => {
        if (!startDate || !endDate) {
            Notifications.showError("Please select both start and end dates");
            return;
        }

        if (startDate > endDate) {
            Notifications.showError("Start date must be before end date");
            return;
        }

        apiClient.post("/reports/volume", {
            start_date: DatesLibrary.convertDateToYMD(startDate),
            end_date: DatesLibrary.convertDateToYMD(endDate),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            exercise: selectedExercise || null,
        }).then(response => {
            setVolumeReportTotal(response.data.total_volume);
            setVolumeReportExercise(response.data.exercise || null);
        }).catch(error => {
            Notifications.showError(error);
        });
    };

    const createReportTypeButton = (reportTypeForButton: REPORT_TYPE_OPEN, text: string, setReportType: () => void) => {
        return (
            <button
                onClick={setReportType}
                className={reportType == reportTypeForButton ? "mr-12 w-30 rounded-lg bg-blue-400 px-4 py-2 text-white" : "mr-12 w-30 rounded-lg bg-gray-400 px-4 py-2 text-white"}
            >
                {text}
            </button>
        );
    };

    return (
        <div className="background-primary min-h-screen">
            <Navbar />
            {/* Selection for different types of reports */}
            <div className="pt-4 flex min-h-10 items-center justify-center">
                {createReportTypeButton("contains", "Contains", setReportTypeToContains)}
                {createReportTypeButton("volume", "Volume", setReportTypeToVolume)}
                {createReportTypeButton("1rm", "1RM", setReportTypeTo1RM)}
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
                            <div className="w-full max-w-3xl px-4 flex flex-col items-center space-y-4 transform -translate-y-[40px]">
                                <h1 className="text-gray-900 text-lg text-center">
                                    Select an exercise to show all workouts that contain it.
                                </h1>

                                <ExerciseDropdown
                                    toggleDropdown={toggleDropdown}
                                    isVisible={dropdownVisible}
                                    selectedExercise={selectedExercise}
                                    exercises={exercises}
                                    handleToggle={handleToggle}
                                />

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
                                                    <ListedWorkout
                                                        workout={workout}
                                                        getExpandedId={() => expandedId}
                                                        setExpandedId={setExpandedId}
                                                    />
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
                            <div className="w-full max-w-3xl px-4 flex flex-col items-center space-y-4 transform -translate-y-[40px]">
                                <h1 className="text-gray-900 text-lg">Volume Report</h1>

                                <div className="w-full space-y-4">
                                    {createDatePickerSection(
                                        "Start Date",
                                        startDate,
                                        showStartDatePicker,
                                        setShowStartDatePicker,
                                        handleStartDateSelect
                                    )}
                                    {createDatePickerSection(
                                        "End Date",
                                        endDate,
                                        showEndDatePicker,
                                        setShowEndDatePicker,
                                        handleEndDateSelect
                                    )}
                                </div>

                                <ExerciseDropdown
                                    toggleDropdown={toggleDropdown}
                                    isVisible={dropdownVisible}
                                    selectedExercise={selectedExercise}
                                    exercises={exercises}
                                    handleToggle={handleToggle}
                                />

                                <button onClick={generateVolumeReport} className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white">
                                    Generate Report
                                </button>
                                {volumeReportTotal !== null && (
                                    <div className="mt-8 w-100 px-4 flex flex-col items-center space-y-4">
                                        <h2 className="text-xl font-semibold text-gray-600">
                                            Total volume {volumeReportExercise ? `for ${volumeReportExercise}` : "for all exercises"}: {volumeReportTotal.toLocaleString()} lbs
                                        </h2>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Reports;