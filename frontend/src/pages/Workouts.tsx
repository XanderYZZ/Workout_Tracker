import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { apiClient } from "../lib/apiclient";
import { Calendar, Plus, X, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import Swal from 'sweetalert2';
import { Navbar } from "../components/navbar.tsx";
import { CalendarPicker } from '../components/calendar_picker';
import { DatesLibrary } from '../lib/dates';
import { Notifications } from '../lib/notifications';
import { ListedWorkout } from '../components/listed_workout';

interface WorkoutFormData {
  name: string;
  scheduled_date: string;
  exercises: Exercise[];
  comments: string;
}

const Workouts: FC = () => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showCalendarPicker, setShowCalendarPicker] = useState(false);

  const [formData, setFormData] = useState<WorkoutFormData>({
    name: '',
    scheduled_date: new Date().toISOString().slice(0, 16),
    exercises: [],
    comments: ''
  });

  const fetchWorkouts = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/workouts/`);

      if (response.status !== 200) {
        Notifications.showError('Failed to fetch workouts');
        return;
      };

      const data = response.data;
      setWorkouts(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkouts();
  }, []); // I only run this once upon the initial load.

  const createWorkout = async () => {
    try {
      const response = await apiClient.post(`/workouts/`, {
        name: formData.name,
        scheduled_date: new Date(formData.scheduled_date).toISOString(),
        exercises: formData.exercises,
        comments: formData.comments
      });

      if (response.status !== 201) {
        Notifications.showError("Failed to create workout");
        return;
      }

      await fetchWorkouts();
      resetForm();
      setIsCreating(false);
    } catch (err: any) {
      Notifications.showError(err);
    }
  };

  const updateWorkout = async (workoutId: string) => {
    try {
      const response = await apiClient.put(`/workouts/${workoutId}`, {
        name: formData.name,
        scheduled_date: new Date(formData.scheduled_date).toISOString(),
        exercises: formData.exercises,
        comments: formData.comments
      });

      if (response.status !== 200) throw new Error('Failed to update workout');

      await fetchWorkouts();
      resetForm();
      setEditingId(null);
    } catch (err: any) {
      Notifications.showError(err);
    }
  };

  const deleteWorkout = async (workoutId: string) => {
    const result = await Swal.fire({
      title: "Are you sure you want to delete this workout?",
      text: "This cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes",
      cancelButtonText: "No",
      confirmButtonColor: "#499c59ff",
      cancelButtonColor: "#cc3e41ff",
      background: '#323234ff',
      color: '#f8fafc',
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      const response = await apiClient.delete(`/workouts/${workoutId}`);

      if (response.status !== 204) throw new Error('Failed to delete workout');

      await fetchWorkouts();
    } catch (err: any) {
      Notifications.showError(err);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      scheduled_date: DatesLibrary.getDateToLocaleDateTime(selectedDate),
      exercises: [],
      comments: ''
    });
  };

  const startEdit = (workout: Workout) => {
    setFormData({
      name: workout.name,
      scheduled_date: DatesLibrary.getDateToLocaleDateTime(selectedDate),
      exercises: workout.exercises || [],
      comments: workout.comments || ''
    });
    setEditingId(workout.id);
    setIsCreating(false);
  };

  const addExercise = () => {
    setFormData({
      ...formData,
      exercises: [...formData.exercises, { name: '', sets: 0, reps: 0, weight: 0 }]
    });
  };

  const updateExercise = (index: number, field: keyof Exercise, value: string | number) => {
    const newExercises = [...formData.exercises];
    if (field === 'name') {
      newExercises[index][field] = value as string;
    } else {
      newExercises[index][field] = Number(value);
    }
    setFormData({ ...formData, exercises: newExercises });
  };

  const removeExercise = (index: number) => {
    setFormData({
      ...formData,
      exercises: formData.exercises.filter((_, i) => i !== index)
    });
  };

  const getWorkoutsForDate = (date: Date) => {
    return workouts.filter((workout) => {
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

  const createUpdateExerciseField = (exercise: Exercise, index: number, attribute: string, input_type: string) => {
    return (
      <input
        type={input_type}
        value={exercise[attribute as keyof Exercise] as string}
        onChange={(e) => updateExercise(index, attribute as keyof Exercise, e.target.value)}
        placeholder={attribute.charAt(0).toUpperCase() + attribute.slice(1)}
        className="text-gray-700 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
      />
    );
  }

  if (loading && workouts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading workouts...</div>
      </div>
    );
  }

  return (
    <div className="background-primary">
      <Navbar></Navbar>
      <div className="w-full px-4 sm:px-6 lg:px-8 mx-auto pt-6 max-w-7xl">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Workouts</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">Total workouts scheduled ever: {workouts.length}</p>
              <p className="text-sm sm:text-base text-gray-600 mt-1">Total workouts scheduled for this date: {getWorkoutsForDate(selectedDate).length}</p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setIsCreating(true);
                setEditingId(null);
              }}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto justify-center sm:justify-start"
            >
              <Plus size={20} />
              New Workout
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
            <div className="flex items-center justify-between gap-2 sm:gap-4">
              <button
                onClick={goToPreviousDay}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              >
                <ChevronLeft size={20} className="sm:w-6 sm:h-6" />
              </button>

              <div className="flex items-center gap-2 sm:gap-4 flex-1 sm:flex-none justify-center">
                <div className="text-center">
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {selectedDate.getDate()}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">
                    {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short' })}
                  </p>
                </div>
                <button
                  onClick={() => setShowCalendarPicker(!showCalendarPicker)}
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-xs sm:text-sm"
                >
                  <Calendar size={16} className="sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Pick Date</span>
                  <span className="sm:hidden">Pick</span>
                </button>
              </div>

              <button
                onClick={goToNextDay}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              >
                <ChevronRight size={20} className="sm:w-6 sm:h-6" />
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
        {(isCreating || editingId) && (
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
            <div className="flex items-center justify-between mb-4 gap-2">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                {editingId ? 'Edit Workout' : 'Create New Workout'}
              </h2>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setEditingId(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600 flex-shrink-0"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Workout Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="text-gray-700 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Upper Body Strength"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scheduled Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                  className="text-gray-700 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <label className="text-sm font-medium text-gray-700">Exercises</label>
                  <button
                    onClick={addExercise}
                    className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Plus size={16} />
                    Add Exercise
                  </button>
                </div>

                {formData.exercises.length > 0 && (
                  <div className="grid grid-cols-12 gap-2 sm:gap-3 mb-2">
                    <div className="col-span-4">
                      <p className="text-xs sm:text-sm font-medium text-gray-700">Name</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs sm:text-sm font-medium text-gray-700">Sets</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs sm:text-sm font-medium text-gray-700">Reps</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs sm:text-sm font-medium text-gray-700">Weight</p>
                    </div>
                    <div className="col-span-1"></div>
                  </div>
                )}

                {formData.exercises.map((exercise, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 sm:gap-3 mb-2 items-end">
                    <div className="col-span-4">
                      {createUpdateExerciseField(exercise, index, 'name', 'text')}
                    </div>
                    <div className="col-span-2">
                      {createUpdateExerciseField(exercise, index, 'sets', 'number')}
                    </div>
                    <div className="col-span-2">
                      {createUpdateExerciseField(exercise, index, 'reps', 'number')}
                    </div>
                    <div className="col-span-2">
                      {createUpdateExerciseField(exercise, index, 'weight', 'number')}
                    </div>
                    <div className="col-span-2 flex items-center justify-center h-full">
                      <button
                        onClick={() => removeExercise(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-100 bg-red-50 p-2 rounded-lg transition-colors flex items-center justify-center w-full h-full"
                      >Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Comments
                </label>
                <textarea
                  maxLength={150}
                  value={formData.comments}
                  onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                  rows={3}
                  className="text-gray-700 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Additional comments or instructions..."
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
                <button
                  onClick={() => editingId ? updateWorkout(editingId) : createWorkout()}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <Check size={20} />
                  {editingId ? 'Update Workout' : 'Create Workout'}
                </button>
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setEditingId(null);
                    resetForm();
                  }}
                  className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 sm:mt-8">
          <h2 className="text-lg sm:text-xl font-semibold text-white-600 mb-4">
            Workouts for {DatesLibrary.formatDisplayDate(selectedDate)}
          </h2>
          <div className="space-y-4">
            {getWorkoutsForDate(selectedDate).length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 sm:p-12 text-center">
                <Calendar size={40} className="sm:w-12 sm:h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No workouts today</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4">Create a new workout or select a different date!</p>
              </div>
            ) : (
              getWorkoutsForDate(selectedDate).map((workout) => (
                <ListedWorkout
                  key={workout.id}
                  workout={workout}
                  getExpandedId={() => expandedId}
                  setExpandedId={setExpandedId}
                  startEdit={startEdit}
                  deleteWorkout={deleteWorkout}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Workouts;