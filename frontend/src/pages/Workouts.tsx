import type { FC } from "react";
import { useState } from "react";
import {
    Calendar,
    Plus,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { Navbar } from "../components/navbar.tsx";
import { CalendarPicker } from "../components/dates/calendar_picker.tsx";
import { DatesLibrary } from "../lib/dates";
import { ListedWorkout } from "../components/workouts/listed_workout.tsx";
import { useWorkouts } from "../contexts/workouts";
import { useNavigate } from "react-router";
import { Card } from "../components/card.tsx";
import { CreateAndEdit, useDeleteItem } from "../components/workouts/create_and_edit.tsx";

const Workouts: FC = () => {
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [showCalendarPicker, setShowCalendarPicker] = useState(false);

    const workouts = useWorkouts();
    const navigate = useNavigate();
    const deleteWorkoutOrRoutine = useDeleteItem("workouts");

    const [formData, setFormData] = useState<WorkoutFormData | RoutineFormData>(
        {
            name: "",
            scheduled_date: new Date().toISOString().slice(0, 16),
            exercises: [],
            comments: "",
        },
    );

    const resetForm = () => {
        setFormData({
            name: "",
            scheduled_date: DatesLibrary.getDateToLocaleDateTime(selectedDate),
            exercises: [],
            comments: "",
        });
    };

    const startEdit = (workout: Workout | Routine) => {
        setFormData({
            name: workout.name,
            scheduled_date: DatesLibrary.getDateToLocaleDateTime(selectedDate),
            exercises: workout.exercises
                ? workout.exercises.map((e) => ({ ...e }))
                : [],
            comments: workout.comments || "",
        });
        setEditingId(workout.id);
        setIsCreating(false);
    };

    const getWorkoutsForDate = (date: Date) => {
        return workouts.filter((workout: Workout) => {
            const workoutDate = new Date(workout.scheduled_date);

            return (
                workoutDate.getFullYear() === date.getFullYear() &&
                workoutDate.getMonth() === date.getMonth() &&
                workoutDate.getDate() === date.getDate()
            );
        });
    };

    const changeDayOrMonth = (is_day: boolean, offset: number) => {
        const newDate = new Date(selectedDate);

        if (is_day) {
            newDate.setDate(newDate.getDate() + offset);
        } else {
            newDate.setMonth(newDate.getMonth() + offset);
        }

        setSelectedDate(newDate);
    };

    const goToPreviousDay = () => {
        changeDayOrMonth(true, -1);
    };

    const goToNextDay = () => {
        changeDayOrMonth(true, 1);
    };

    if (!workouts) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-gray-600">Loading workouts...</div>
            </div>
        );
    }

    return (
        <div className="background-primary">
            <Navbar />
            <div className="w-full px-4 sm:px-6 lg:px-8 mx-auto pt-6 max-w-7xl">
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                                My Workouts
                            </h1>
                            <p className="text-sm sm:text-base text-gray-600 mt-1">
                                Total workouts scheduled ever: {workouts.length}
                            </p>
                            <p className="text-sm sm:text-base text-gray-600 mt-1">
                                Total workouts scheduled for this date:{" "}
                                {getWorkoutsForDate(selectedDate).length}
                            </p>
                        </div>
                        <div className="mt-16 flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
                            <button
                                onClick={() => {
                                    navigate("/routines");
                                }}
                                className="flex items-center gap-2 bg-[#2A2A3D] text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors w-full sm:w-auto justify-center sm:justify-start"
                            >
                                Routines
                            </button>
                            <button
                                onClick={() => {
                                    resetForm();
                                    setIsCreating(true);
                                    setEditingId(null);
                                }}
                                className="flex items-center gap-2 bg-[#2A2A3D] text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors w-full sm:w-auto justify-center sm:justify-start"
                            >
                                <Plus size={20} />
                                New Workout
                            </button>
                        </div>
                    </div>

                    <div className="bg-[#2A2A3D] rounded-lg shadow-md p-3 sm:p-4">
                        <div className="flex items-center justify-between gap-2 sm:gap-4">
                            <button
                                onClick={goToPreviousDay}
                                className="p-2 text-white hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                            >
                                <ChevronLeft
                                    size={20}
                                    className="sm:w-6 sm:h-6"
                                />
                            </button>

                            <div className="flex items-center gap-2 sm:gap-4 flex-1 sm:flex-none justify-center">
                                <div className="text-center">
                                    <p className="text-xl sm:text-2xl font-bold text-white-200">
                                        {selectedDate.getDate()}
                                    </p>
                                    <p className="text-xs sm:text-sm text-white-900">
                                        {selectedDate.toLocaleDateString(
                                            "en-US",
                                            {
                                                weekday: "short",
                                                month: "short",
                                            },
                                        )}
                                    </p>
                                </div>
                                <button
                                    onClick={() =>
                                        setShowCalendarPicker(
                                            !showCalendarPicker,
                                        )
                                    }
                                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-xs sm:text-sm"
                                >
                                    <Calendar
                                        size={16}
                                        className="sm:w-5 sm:h-5"
                                    />
                                    <span className="hidden sm:inline">
                                        Pick Date
                                    </span>
                                    <span className="sm:hidden">Pick</span>
                                </button>
                            </div>

                            <button
                                onClick={goToNextDay}
                                className="p-2 text-white hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                            >
                                <ChevronRight
                                    size={20}
                                    className="sm:w-6 sm:h-6"
                                />
                            </button>
                        </div>

                        <CalendarPicker
                            selectedDate={selectedDate}
                            onSelectDate={setSelectedDate}
                            isOpen={showCalendarPicker}
                            onClose={() => setShowCalendarPicker(false)}
                            getWorkoutsForDate={getWorkoutsForDate}
                        />
                    </div>
                </div>

                {/* Create/Edit Form */}
                <CreateAndEdit
                    editType={"workouts"}
                    isCreating={isCreating}
                    setIsCreating={setIsCreating}
                    setEditingId={setEditingId}
                    resetForm={resetForm}
                    editingId={editingId}
                    formData={formData}
                    setFormData={setFormData}
                />

                <div className="mt-6 sm:mt-8">
                    <h2 className="text-lg sm:text-xl font-semibold text-white-600 mb-4">
                        Workouts for{" "}
                        {DatesLibrary.formatDisplayDate(selectedDate)}
                    </h2>
                    <div className="space-y-4">
                        {getWorkoutsForDate(selectedDate).length === 0 ? (
                            <Card className="text-center">
                                <Calendar
                                    size={40}
                                    className="mt-4 sm:w-12 sm:h-12 mx-auto text-white mb-4"
                                />
                                <h3 className="text-base sm:text-lg font-medium text-white mb-2">
                                    No workouts today
                                </h3>
                                <p className="text-sm sm:text-base text-white mb-4">
                                    Create a new workout or select a different
                                    date!
                                </p>
                            </Card>
                        ) : (
                            getWorkoutsForDate(selectedDate).map(
                                (workout: Workout) => (
                                    <ListedWorkout
                                        key={workout.id}
                                        workout={workout}
                                        expandedId={expandedId}
                                        setExpandedId={setExpandedId}
                                        startEdit={startEdit}
                                        deleteWorkout={deleteWorkoutOrRoutine}
                                    />
                                ),
                            )
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Workouts;
