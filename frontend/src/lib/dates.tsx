export const DatesLibrary = {
    getDateToLocaleDateTime: (selectedDate: Date): string => {
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
        const day = String(selectedDate.getDate()).padStart(2, "0");
        const hours = String(selectedDate.getHours()).padStart(2, "0");
        const minutes = String(selectedDate.getMinutes()).padStart(2, "0");
        const localDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;

        return localDateTime;
    },

    convertDateToYMD: (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    },

    getLocalToday: (): string => {
        return DatesLibrary.convertDateToYMD(new Date());
    },

    isInvalidDateString: (dateInput: string): boolean => {
        const dateObj = new Date(dateInput);

        return isNaN(dateObj.getTime());
    },

    formatDateToLocaleDateString: (
        dateInput: string,
        noHoursAndMinutes: boolean = false,
        noWeekday: boolean = false,
    ): string => {
        let dateFormatOptions: Intl.DateTimeFormatOptions = {
            year: "numeric",
            month: "short",
            day: "numeric",
        };

        if (!noHoursAndMinutes) {
            dateFormatOptions.hour = "2-digit";
            dateFormatOptions.minute = "2-digit";
        }

        if (!noWeekday) {
            dateFormatOptions.weekday = "short";
        }

        return new Date(dateInput).toLocaleDateString(
            "en-US",
            dateFormatOptions,
        );
    },

    getFirstDayOfMonth: (date: Date): number => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    },

    formatDisplayDate: (date: Date): string => {
        return date.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    },

    /*
      A note for myself from the overview online:
      When JavaScript's Date constructor is given a day of 0, it interprets this as 
      "one day before the first day of the specified month." 
      Therefore, the day 0 of the next month refers to 
      the very last day of the current month.
    */
    getDaysInMonth: (date: Date): number => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    },

    // Returns an ISO 8601 string with the local UTC offset (e.g. "2026-03-18T23:00:00-05:00")
    // instead of converting to UTC like toISOString() does. This preserves the local date
    // so the server can determine the correct local day for duplicate checks.
    toLocalISOString: (date: Date): string => {
        const offsetMinutes = -date.getTimezoneOffset();
        const sign = offsetMinutes >= 0 ? "+" : "-";
        const absOffset = Math.abs(offsetMinutes);
        const offsetHours = String(Math.floor(absOffset / 60)).padStart(2, "0");
        const offsetMins = String(absOffset % 60).padStart(2, "0");

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        const seconds = String(date.getSeconds()).padStart(2, "0");

        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${sign}${offsetHours}:${offsetMins}`;
    },
};
