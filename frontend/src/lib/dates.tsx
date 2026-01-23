export const DatesLibrary = {
    getDateToLocaleDateTime: (selectedDate: Date): string => {
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        const hours = String(selectedDate.getHours()).padStart(2, '0');
        const minutes = String(selectedDate.getMinutes()).padStart(2, '0');
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

    formatDateToLocaleDateString: (dateInput: string): string => {
        return new Date(dateInput).toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    getFirstDayOfMonth: (date: Date): number => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    },

    formatDisplayDate: (date: Date): string => {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
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
    }
};