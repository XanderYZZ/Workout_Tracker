import type { FC } from "react";
import { DatesLibrary } from "../lib/dates";

interface StartAndEndDateSelectionProps { 
     handleStartDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
     handleEndDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
     getStartDate: () => string,
     getEndDate: () => string,
}

export const StartAndEndDateSelection: FC<StartAndEndDateSelectionProps> = ({
    handleStartDateChange,
    handleEndDateChange,
    getStartDate,
    getEndDate,
}) => {
    const createSelector = (dateType: "start" | "end") => {
        const prefix = dateType === "start" ? "Start Date:" : "End Date:";
        const getMinimumDate = () => {
            return (dateType === "end" ? (getStartDate() ? getStartDate() : "") : "");
        };
        const getMaximumDate = () => {
            return (dateType === "end" ? DatesLibrary.getLocalToday() : (getEndDate() ? getEndDate() : DatesLibrary.getLocalToday()));
        };

        return (
            <>
                <label className="block text-gray-900 min-w-20 max-w-20">
                    {prefix}
                </label>
                <input onChange={dateType == "start" ? handleStartDateChange : handleEndDateChange} type="date" min={getMinimumDate()} max={getMaximumDate()} className="bg-gray-600 border border-gray-300 rounded-lg px-4 py-2 w-full max-w-xs" />
            </>
        );
    };

    return (
        <div className="flex items-center space-x-8">
            {createSelector("start")}
            {createSelector("end")}
        </div>
    );
};

export default StartAndEndDateSelection;