import type { FC } from "react";
import { useEffect, useState } from "react";
import { isEqual } from "lodash";
import { apiClient } from "../lib/apiclient";
import { Navbar } from "../components/navbar";
import { ExerciseDropdown } from "../components/exercise_dropdown";
import { ListedWorkout } from "../components/listed_workout";
import { CalendarPicker } from "../components/calendar_picker";
import { DatesLibrary } from "../lib/dates";
import { Notifications } from "../lib/notifications";
import { Graph, type GraphPoint, defaultGraphData } from "../components/graph";
import { useWorkouts } from '../contexts/workouts';

const Reports: FC = () => {
    type STATUS_TYPE = "none" | "loading" | "error" | "success";
    type REPORT_TYPE_OPEN = "contains" | "volume" | "1rm";

    const [reportType, setReportType] = useState<REPORT_TYPE_OPEN>("contains");
    const [dropdownVisible, setDropdownVisible] = useState(false);
    const [exercises, setExercises] = useState<string[]>([]);
    const [selectedExerciseName, setSelectedExerciseName] = useState("");
    const [status, setStatus] = useState<STATUS_TYPE>("none");
    const [containsWorkouts, setContainsWorkouts] = useState<Workout[]>([]);
    const [startDate, setStartDate] = useState<Date>(new Date());
    const [endDate, setEndDate] = useState<Date>(new Date());
    const [volumeReportTotal, setVolumeReportTotal] = useState<number | null>(null);
    const [volumeReportExercise, setVolumeReportExercise] = useState<string | null>(null);
    const [oneRepMaxExercise, setOneRepMaxExercise] = useState("");
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);
    const [graphData, setGraphData] = useState<GraphPoint[]>(defaultGraphData);

    const workouts = useWorkouts();

    const setReportTypeToContains = () => setReportType("contains");
    const setReportTypeToVolume = () => setReportType("volume");
    const setReportTypeTo1RM = () => setReportType("1rm");

    const fetchAllExercises = () => {
        const exerciseSet = new Set<string>();

        workouts.forEach(workout => {
            workout.exercises.forEach(exercise => {
                exerciseSet.add(exercise.name);
            });
        });

        setExercises(Array.from(exerciseSet));
    }

    const fetchWorkoutsWithSelectedExerciseName = () => {
        if (!selectedExerciseName) {
            setContainsWorkouts([]);
            setStatus("none");
            return;
        }

        const newContains = workouts.filter((workout) => workout.exercises.some(exerciseObj => exerciseObj.name == selectedExerciseName));
        setContainsWorkouts(newContains);
        setStatus("success");
    }

    const handleToggle = (exercise: string) => {
        const isDeselecting = selectedExerciseName === exercise;
        setSelectedExerciseName(isDeselecting ? "" : exercise);
        setDropdownVisible(false);
    };

    const toggleDropdown = () => {
        setDropdownVisible(!dropdownVisible);
    };

    useEffect(() => {
        fetchAllExercises();
    }, []);

    useEffect(() => {
        fetchWorkoutsWithSelectedExerciseName();
    }, [selectedExerciseName]);

    useEffect(() => {
        setSelectedExerciseName("");
        setContainsWorkouts([]);
        setStatus("none");
        setDropdownVisible(false);
        setStartDate(new Date());
        setEndDate(new Date());
        setVolumeReportTotal(null);
        setVolumeReportExercise(null);
        setGraphData(defaultGraphData);
    }, [reportType]);

    const handleDateSelect = (start_or_end: "start" | "end", date: Date) => {
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

    const areDatesValid = () => {
        return (startDate && endDate) && (startDate <= endDate);
    };

    const getWorkoutsInPeriod = () => {
        const inPeriod: Workout[] = [];

        for (let workout of workouts) {
            const scheduledDate = new Date(workout.scheduled_date);

            if (scheduledDate >= startDate && scheduledDate <= endDate) {
                if (!selectedExerciseName) {
                    inPeriod.push(workout);
                } else {
                    if (workout.exercises.some(exerciseObj => exerciseObj.name == selectedExerciseName)) {
                        inPeriod.push(workout);
                    }
                }
            }
        }

        return inPeriod;
    }

    const generateVolumeOr1RMReport = (isVolume: boolean) => {
        if (!areDatesValid()) {
            Notifications.showError("Please select a start and end date!");
            return;
        }

        if (!isVolume && (selectedExerciseName == null || selectedExerciseName == "")) {
            Notifications.showError("Please select an exercise for the 1RM report!");
            return;
        }

        // I left off here, continue tomorrow to finish this up to remove the calls to the backend. 
        // Ensure that dates are accounted for correctly, and that the general functioning of the reports is still correct after
        // converting it all to the frontend only. 
        const inPeriod = getWorkoutsInPeriod();
        const perDay = {};
        const total = 0; // For the volume reports.

        for (let entry of inPeriod) {
            console.log(entry);

            if (isVolume) {
                
            }
        }
        
        const endpoint: string = isVolume ? "/reports/volume" : "/reports/onerepmax";
        apiClient.post(endpoint, {
            start_date: DatesLibrary.convertDateToYMD(startDate),
            end_date: DatesLibrary.convertDateToYMD(endDate),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            exercise: selectedExerciseName || null,
        }).then(response => {
            if (isVolume) {
                setVolumeReportTotal(response.data.total_volume);
                setVolumeReportExercise(response.data.exercise || null);
            } else {
                setOneRepMaxExercise(response.data.exercise || "");
            }

            const per_day = response.data.per_day;

            // It is possible to not return anything.
            if (!per_day) {
                setGraphData(defaultGraphData);
                return;
            }

            const new_graph_data: GraphPoint[] = Object.entries(per_day).map(
                ([day, amt]) => ({
                    name: DatesLibrary.formatDateToLocaleDateString(day, true, true),
                    amount: amt as number,
                })
            );

            setGraphData(new_graph_data);
        });
    }

    const generateVolumeReport = () => {
        generateVolumeOr1RMReport(true);
    };

    const generate1RMReport = () => {
        generateVolumeOr1RMReport(false);
    };

    const createReportTypeButton = (reportTypeForButton: REPORT_TYPE_OPEN, text: string, setReportType: () => void) => {
        const isActive = reportType === reportTypeForButton;
        return (
            <button
                onClick={setReportType}
                className={`px-6 py-3 font-semibold text-sm transition-all duration-300 border-b-2 ${isActive
                    ? "text-blue-600 border-blue-600 bg-blue-50"
                    : "text-gray-600 border-transparent hover:text-gray-900 hover:bg-gray-50"
                    }`}
            >
                {text}
            </button>
        );
    };

    // This could be extracted as a component later on if I want to have it in other pages, but only the reports need it for now.
    const createDateRange = () => {
        return (
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
        );
    };

    const createExerciseDropdown = () => {
        return (
            <ExerciseDropdown
                toggleDropdown={toggleDropdown}
                isVisible={dropdownVisible}
                selectedExerciseName={selectedExerciseName}
                exercises={exercises}
                handleToggle={handleToggle}
            />
        );
    };

    return (
        <div className="background-primary min-h-screen">
            <Navbar />
            {/* Selection for different types of reports */}
            <div className="border-b border-gray-200 bg-white shadow-sm">
                <div className="flex justify-center">
                    <div className="flex space-x-8">
                        {createReportTypeButton("contains", "Contains", setReportTypeToContains)}
                        {createReportTypeButton("volume", "Volume", setReportTypeToVolume)}
                        {createReportTypeButton("1rm", "1RM", setReportTypeTo1RM)}
                    </div>
                </div>
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
                                <h1 className="text-white-900 text-lg text-center">
                                    Select an exercise to show all workouts that contain it.
                                </h1>

                                <ExerciseDropdown
                                    toggleDropdown={toggleDropdown}
                                    isVisible={dropdownVisible}
                                    selectedExerciseName={selectedExerciseName}
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
                                                onClick={fetchWorkoutsWithSelectedExerciseName}
                                                className="w-full rounded-lg bg-red-600 px-4 py-2 text-white"
                                            >
                                                Retry
                                            </button>
                                        </div>
                                    )}

                                    {status === "success" && (
                                        <div className="space-y-4">
                                            <h2 className="text-xl font-semibold text-gray-900">
                                                Workouts containing “{selectedExerciseName}”
                                            </h2>

                                            <ul className="space-y-4">
                                                {containsWorkouts.map(workout => (
                                                    <ListedWorkout
                                                        workout={workout}
                                                        expandedId={expandedId}
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
                                <h1 className="text-white-900 text-lg">Volume Report</h1>

                                {createDateRange()}
                                {createExerciseDropdown()}

                                <button onClick={generateVolumeReport} className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white">
                                    Generate Report
                                </button>
                                {volumeReportTotal !== null && !isEqual(graphData, defaultGraphData) && (
                                    <Graph headerText={`Total volume ${volumeReportExercise ? `for ${volumeReportExercise}` : "for all exercises"}: ${volumeReportTotal.toLocaleString()}`} graphData={graphData} />
                                )}
                            </div>
                        </div>
                    )}

                    {/* Report: 1RM */}
                    {reportType === "1rm" && (
                        <div className="flex justify-center pt-32">
                            <div className="w-full max-w-3xl px-4 flex flex-col items-center space-y-4 transform -translate-y-[40px]">
                                <h1 className="text-white-900 text-lg">1RM Report</h1>

                                {createDateRange()}
                                {createExerciseDropdown()}

                                <button onClick={generate1RMReport} className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white">
                                    Generate Report
                                </button>
                                {oneRepMaxExercise !== "" && !isEqual(graphData, defaultGraphData) && (
                                    <Graph headerText={`1RM over time for ${oneRepMaxExercise}:`} graphData={graphData} />
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