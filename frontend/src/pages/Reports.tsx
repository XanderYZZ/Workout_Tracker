import type { FC } from "react";
import { useEffect, useState } from "react";
import { isEqual } from "lodash";
import { apiClient } from "../lib/apiclient";
import { Navbar } from "../components/navbar";
import { ExerciseDropdown } from "../components/exercise_dropdown";
import { ListedWorkout } from "../components/listed_workout";
import { CalendarPicker } from "../components/calendar_picker";
import { DatesLibrary } from "../lib/dates";
import { Line, LineChart, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { Notifications } from "../lib/notifications";

type CustomTickProps = {
    x?: number;
    y?: number;
    payload?: {
        value: string;
    };
};

const CustomXAxisTick: FC<CustomTickProps> = ({ x = 0, y = 0, payload }) => {
    if (!payload) return null;

    return (
        <text
            x={x}
            y={y}
            fill="#ffffff"
            textAnchor="end"
            transform={`rotate(-55, ${x}, ${y})`}
            dy={10}
        >
            {payload.value}
        </text>
    );
};

const Reports: FC = () => {
    type STATUS_TYPE = "none" | "loading" | "error" | "success";
    type REPORT_TYPE_OPEN = "contains" | "volume" | "1rm";
    type GRAPH_POINT = {
        name: string;
        amount: number;
    };
    const defaultGraphData: [GRAPH_POINT] = [{ name: "", amount: 0 },];

    const [reportType, setReportType] = useState<REPORT_TYPE_OPEN>("contains");
    const [dropdownVisible, setDropdownVisible] = useState(false);
    const [exercises, setExercises] = useState<string[]>([]);
    const [selectedExercise, setSelectedExercise] = useState("");
    const [status, setStatus] = useState<STATUS_TYPE>("none");
    const [workouts, setWorkouts] = useState<Workout[]>([]);
    const [startDate, setStartDate] = useState<Date>(new Date());
    const [endDate, setEndDate] = useState<Date>(new Date());
    const [volumeReportTotal, setVolumeReportTotal] = useState<number | null>(null);
    const [volumeReportExercise, setVolumeReportExercise] = useState<string | null>(null);
    const [oneRepMaxExercise, setOneRepMaxExercise] = useState("");
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);
    const [graphData, setGraphData] = useState<GRAPH_POINT[]>(defaultGraphData);

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

    const generateVolumeOr1RMReport = (isVolume: boolean) => {
        if (!areDatesValid()) {
            Notifications.showError("Please select a start and end date!");
            return;
        }

        if (!isVolume && (selectedExercise == null || selectedExercise == "")) {
            Notifications.showError("Please select an exercise for the 1RM report!");
            return;
        }

        const endpoint: string = isVolume ? "/reports/volume" : "/reports/onerepmax";
        apiClient.post(endpoint, {
            start_date: DatesLibrary.convertDateToYMD(startDate),
            end_date: DatesLibrary.convertDateToYMD(endDate),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            exercise: selectedExercise || null,
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

            const new_graph_data: GRAPH_POINT[] = Object.entries(per_day).map(
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

    const calculateChartHeight = (dataLength: number) => {
        // Base height: 320px, add 15px for each data point to accommodate rotated labels
        return Math.max(320, 320 + (dataLength - 1) * 15);
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
                selectedExercise={selectedExercise}
                exercises={exercises}
                handleToggle={handleToggle}
            />
        );
    };

    const createGraph = () => {
        return (
            <ResponsiveContainer
                width="100%"
                height={calculateChartHeight(graphData.length)}
            >
                <LineChart
                    data={graphData}
                    margin={{ top: 20, right: 20, left: 0, bottom: 80 }}
                >
                    <XAxis
                        dataKey="name"
                        interval={0}
                        height={60}
                        tick={<CustomXAxisTick />}
                    />

                    <YAxis
                        width={60}
                        tick={{
                            fill: "#ffffff",
                        }}
                    />

                    <Line
                        type="monotone"
                        dataKey="amount"
                        stroke="#ffffff"
                        strokeWidth={2}
                        dot={{ fill: "#ffffff" }}
                    />
                </LineChart>
            </ResponsiveContainer>
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

                                {createDateRange()}
                                {createExerciseDropdown()}

                                <button onClick={generateVolumeReport} className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white">
                                    Generate Report
                                </button>
                                {volumeReportTotal !== null && !isEqual(graphData, defaultGraphData) && (
                                    <div className="mt-8 w-100 px-4 flex flex-col items-center space-y-4">
                                        <h2 className="text-xl font-semibold text-white-600">
                                            Total volume {volumeReportExercise ? `for ${volumeReportExercise}` : "for all exercises"}: {volumeReportTotal.toLocaleString()} lbs
                                        </h2>
                                        {createGraph()}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Report: 1RM */}
                    {reportType === "1rm" && (
                        <div className="flex justify-center pt-32">
                            <div className="w-full max-w-3xl px-4 flex flex-col items-center space-y-4 transform -translate-y-[40px]">
                                <h1 className="text-gray-900 text-lg">1RM Report</h1>

                                {createDateRange()}
                                {createExerciseDropdown()}

                                <button onClick={generate1RMReport} className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white">
                                    Generate Report
                                </button>
                                {oneRepMaxExercise !== "" && !isEqual(graphData, defaultGraphData) && (
                                    <div className="mt-8 w-100 px-4 flex flex-col items-center space-y-4">
                                        <h2 className="text-xl font-semibold text-white-600">
                                            {`1RM over time for ${oneRepMaxExercise}:`}
                                        </h2>
                                        {createGraph()}
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