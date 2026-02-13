import type { FC } from "react";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DatesLibrary } from "../lib/dates";

interface CalendarPickerProps {
    selectedDate: Date;
    onSelectDate: (date: Date) => void;
    showIndicator?: (date: Date) => boolean;
    isOpen: boolean;
    onClose: () => void;
    getWorkoutsForDate?: (date: Date) => any[];
}

export const CalendarPicker: FC<CalendarPickerProps> = ({
    selectedDate,
    onSelectDate,
    showIndicator,
    isOpen,
    onClose,
    getWorkoutsForDate,
}) => {
    const [calendarDate, setCalendarDate] = useState<Date>(
        new Date(selectedDate),
    );

    if (!isOpen) return null;

    const handlePreviousMonth = () => {
        const newDate = new Date(calendarDate);
        newDate.setMonth(newDate.getMonth() - 1);
        setCalendarDate(newDate);
    };

    const handleNextMonth = () => {
        const newDate = new Date(calendarDate);
        newDate.setMonth(newDate.getMonth() + 1);
        setCalendarDate(newDate);
    };

    const handleSelectDay = (day: number) => {
        const newDate = new Date(
            calendarDate.getFullYear(),
            calendarDate.getMonth(),
            day,
        );
        onSelectDate(newDate);
        onClose();
    };

    const handleToday = () => {
        const today = new Date();
        setCalendarDate(new Date(today));
        onSelectDate(today);
        onClose();
    };

    const isDateSelected = (day: number) => {
        return (
            selectedDate.getDate() === day &&
            selectedDate.getMonth() === calendarDate.getMonth() &&
            selectedDate.getFullYear() === calendarDate.getFullYear()
        );
    };

    const isToday = (day: number) => {
        const today = new Date();
        return (
            today.getDate() === day &&
            today.getMonth() === calendarDate.getMonth() &&
            today.getFullYear() === calendarDate.getFullYear()
        );
    };

    return (
        <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={handleToday}
                        className="flex-1 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-400 transition-colors text-sm font-medium"
                    >
                        Today
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-400 transition-colors text-sm font-medium"
                    >
                        Close
                    </button>
                </div>

                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={handlePreviousMonth}
                        className="p-1 text-gray-600 hover:bg-gray-200 rounded"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <h3 className="text-lg font-semibold text-gray-900">
                        {calendarDate.toLocaleDateString("en-US", {
                            month: "long",
                            year: "numeric",
                        })}
                    </h3>
                    <button
                        onClick={handleNextMonth}
                        className="p-1 text-gray-600 hover:bg-gray-200 rounded"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>

                <div className="grid grid-cols-7 gap-2 mb-2">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                        (day) => (
                            <div
                                key={day}
                                className="text-center text-sm font-medium text-gray-600"
                            >
                                {day}
                            </div>
                        ),
                    )}
                </div>

                <div className="grid grid-cols-7 gap-2 mb-4">
                    {Array.from({
                        length: DatesLibrary.getFirstDayOfMonth(calendarDate),
                    }).map((_, i) => (
                        <div key={`empty-${i}`} className="aspect-square"></div>
                    ))}
                    {Array.from({
                        length: DatesLibrary.getDaysInMonth(calendarDate),
                    }).map((_, i) => {
                        const day = i + 1;
                        const date = new Date(
                            calendarDate.getFullYear(),
                            calendarDate.getMonth(),
                            day,
                        );
                        const selected = isDateSelected(day);
                        const today = isToday(day);
                        const hasIndicator = showIndicator
                            ? showIndicator(date)
                            : getWorkoutsForDate
                              ? getWorkoutsForDate(date).length > 0
                              : false;

                        return (
                            <button
                                key={day}
                                onClick={() => handleSelectDay(day)}
                                className={`aspect-square rounded-lg font-medium text-sm flex items-center justify-center transition-colors ${
                                    selected
                                        ? "bg-blue-600 text-white"
                                        : today
                                          ? "bg-blue-100 text-blue-700 border-2 border-blue-300"
                                          : hasIndicator
                                            ? "bg-green-50 text-gray-900 border border-green-300"
                                            : "text-gray-700 hover:bg-gray-200"
                                }`}
                            >
                                {day}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default CalendarPicker;
