import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { apiClient } from "../lib/apiclient";
import { Calendar, Plus, Edit2, Trash2, X, Check, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
import Swal from 'sweetalert2';
import { Navbar } from "../components/navbar.tsx";

const Workouts: FC = () => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showCalendarPicker, setShowCalendarPicker] = useState(false);
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());

  const getDateToLocaleDateTime = () => {
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const hours = String(selectedDate.getHours()).padStart(2, '0');
    const minutes = String(selectedDate.getMinutes()).padStart(2, '0');
    const localDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;

    return localDateTime;
  }

  const [formData, setFormData] = useState<WorkoutFormData>({
    name: '',
    scheduled_date: new Date().toISOString().slice(0, 16),
    exercises: [],
    comments: ''
  });

  const handleError = (err: any) => {
    const errorMessage = err.response?.data?.detail || err.message || 'An error occurred';
    setError(errorMessage);
  }

  const fetchWorkouts = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/workouts/`);

      if (response.status !== 200) throw new Error('Failed to fetch workouts');

      const data = response.data;
      setWorkouts(data);
      setError(null);
    } catch (err : any) {
      handleError(err);
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

      if (response.status !== 201) throw new Error('Failed to create workout');

      await fetchWorkouts();
      resetForm();
      setIsCreating(false);
    } catch (err : any) {
      handleError(err);
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
    } catch (err : any) {
      handleError(err);
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
    } catch (err : any) {
      handleError(err);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      scheduled_date: getDateToLocaleDateTime(),
      exercises: [],
      comments: ''
    });
  };

  const startEdit = (workout: Workout) => {
    setFormData({
      name: workout.name,
      scheduled_date: getDateToLocaleDateTime(),
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  const formatDisplayDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysInMonth = (date: Date) => {
    /*
      A note for myself from the overview online:
      When JavaScript's Date constructor is given a day of 0, it interprets this as 
      "one day before the first day of the specified month." 
      Therefore, the day 0 of the next month refers to 
      the very last day of the current month.
    */
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const changeDayOrMonth = (is_day : boolean, offset: number) => {
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

  const goToPreviousMonth = () => {
    changeDayOrMonth(false, -1);
  };

  const goToNextMonth = () => {
    changeDayOrMonth(false, 1);
  };

  const selectDateFromCalendar = (day: number) => {
    const newDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day);
    setSelectedDate(newDate);
    setShowCalendarPicker(false);
  };

  const goToTodayInCalendar = () => {
    setCalendarDate(new Date());
  };

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
      <div className="min-w-[40vw] max-w-[70vw] mx-auto pt-6">
        {/* Header with Date Navigation */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Workouts</h1>
              <p className="text-gray-600 mt-1">Workouts scheduled: {workouts.length}</p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setIsCreating(true);
                setEditingId(null);
              }}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              New Workout
            </button>
          </div>

          {/* Date Navigation Section */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <button
                onClick={goToPreviousDay}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft size={24} />
              </button>

              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {selectedDate.getDate()}
                  </p>
                  <p className="text-sm text-gray-600">
                    {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short' })}
                  </p>
                </div>
                <button
                  onClick={() => setShowCalendarPicker(!showCalendarPicker)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Calendar size={20} />
                  Pick Date
                </button>
              </div>

              <button
                onClick={goToNextDay}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight size={24} />
              </button>
            </div>

            {/* Calendar Picker Modal */}
            {showCalendarPicker && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={goToPreviousMonth}
                      className="p-1 text-gray-600 hover:bg-gray-200 rounded"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </h3>
                    <button
                      onClick={goToNextMonth}
                      className="p-1 text-gray-600 hover:bg-gray-200 rounded"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>

                  {/* Days of week header */}
                  <div className="grid grid-cols-7 gap-2 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <div key={day} className="text-center text-sm font-medium text-gray-600">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar days */}
                  <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: getFirstDayOfMonth(calendarDate) }).map((_, i) => (
                      <div key={`empty-${i}`} className="aspect-square"></div>
                    ))}
                    {Array.from({ length: getDaysInMonth(calendarDate) }).map((_, i) => {
                      const day = i + 1;
                      const date = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day);
                      const isSelected =
                        selectedDate.getDate() === day &&
                        selectedDate.getMonth() === calendarDate.getMonth() &&
                        selectedDate.getFullYear() === calendarDate.getFullYear();
                      const isToday =
                        new Date().getDate() === day &&
                        new Date().getMonth() === calendarDate.getMonth() &&
                        new Date().getFullYear() === calendarDate.getFullYear();
                      const hasWorkouts = getWorkoutsForDate(date).length > 0;

                      return (
                        <button
                          key={day}
                          onClick={() => selectDateFromCalendar(day)}
                          className={`aspect-square rounded-lg font-medium text-sm flex items-center justify-center transition-colors ${isSelected
                            ? 'bg-blue-600 text-white'
                            : isToday
                              ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                              : hasWorkouts
                                ? 'bg-green-50 text-gray-900 border border-green-300'
                                : 'text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={goToTodayInCalendar}
                    className="mt-4 w-full py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                  >
                    Today
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Create/Edit Form */}
        {(isCreating || editingId) && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingId ? 'Edit Workout' : 'Create New Workout'}
              </h2>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setEditingId(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
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
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Exercises
                  </label>
                  <button
                    onClick={addExercise}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Plus size={16} />
                    Add Exercise
                  </button>
                </div>

                {formData.exercises.length > 0 && (
                  <div className="flex gap-2 mb-2">
                    <label className="text-sm font-medium text-gray-700 w-[16vw]">Name</label>
                    <label className="text-sm font-medium text-gray-700 w-[4vw]">Sets</label>
                    <label className="text-sm font-medium text-gray-700 w-[4vw]">Reps</label>
                    <label className="text-sm font-medium text-gray-700 w-[4vw]">Weight</label>
                    <div className="w-[40px]"></div>
                  </div>
                )}

                {formData.exercises.map((exercise, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={exercise.name}
                      onChange={(e) => updateExercise(index, 'name', e.target.value)}
                      placeholder="Exercise name"
                      className="text-gray-700 w-[16vw] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="number"
                      value={exercise.sets}
                      onChange={(e) => updateExercise(index, 'sets', e.target.value)}
                      placeholder="Sets"
                      className="text-gray-700 w-[4vw] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="number"
                      value={exercise.reps}
                      onChange={(e) => updateExercise(index, 'reps', e.target.value)}
                      placeholder="Reps"
                      className="text-gray-700 w-[4vw] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="number"
                      value={exercise.weight}
                      onChange={(e) => updateExercise(index, 'weight', e.target.value)}
                      placeholder="Weight"
                      className="text-gray-700 w-[6vw] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={() => removeExercise(index)}
                      className="text-red-600 hover:text-red-700 w-[40px] flex items-center justify-center"
                    >
                      <X size={20} />
                    </button>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Comments
                </label>
                <textarea
                  value={formData.comments}
                  onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                  rows={3}
                  className="text-gray-700 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Additional comments or instructions..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => editingId ? updateWorkout(editingId) : createWorkout()}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
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
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Workouts List */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Workouts for {formatDisplayDate(selectedDate)}
          </h2>
          <div className="space-y-4">
            {getWorkoutsForDate(selectedDate).length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No workouts today</h3>
                <p className="text-gray-600 mb-4">Create a new workout or select a different date!</p>
              </div>
            ) : (
              getWorkoutsForDate(selectedDate).map((workout) => (
                <div key={workout.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{workout.name}</h3>
                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                          <Calendar size={16} />
                          {formatDate(workout.scheduled_date)}
                        </div>
                        {workout.exercises && workout.exercises.length > 0 && (
                          <p className="text-sm text-gray-500 mt-1">
                            {workout.exercises.length} exercise{workout.exercises.length !== 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setExpandedId(expandedId === workout.id ? null : workout.id)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          {expandedId === workout.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>
                        <button
                          onClick={() => startEdit(workout)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 size={20} />
                        </button>
                        <button
                          onClick={() => deleteWorkout(workout.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>

                    {expandedId === workout.id && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        {workout.exercises && workout.exercises.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Exercises</h4>
                            <div className="space-y-2">
                              {workout.exercises.map((exercise, idx) => (
                                <div key={idx} className="bg-gray-50 rounded p-3 text-sm">
                                  <div className="font-medium text-gray-900">{exercise.name}</div>
                                  <div className="text-gray-600 mt-1">
                                    {exercise.sets} sets × {exercise.reps} reps
                                    {exercise.weight > 0 && ` @ ${exercise.weight} lbs`}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {workout.comments && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Comments</h4>
                            <p className="text-sm text-gray-600 bg-gray-50 rounded p-3">{workout.comments}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Workouts;