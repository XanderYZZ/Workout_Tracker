import { ChevronLeft, ChevronRight } from "lucide-react";

export const CalendarPicker = (goToPreviousMonth : () => void, goToNextMonth : () => void, goToTodayInCalendar : () => void, calendarDate : Date, selectedDate : Date, getFirstDayOfMonth : (date: Date) => number, getDaysInMonth : (date: Date) => number, selectDateFromCalendar : (day: number) => void, getWorkoutsForDate : (date: Date) => any[]) => {
    return (
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
    )
}