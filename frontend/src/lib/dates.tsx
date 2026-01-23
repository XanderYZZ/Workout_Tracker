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

    getLocalToday: (): string => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
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
};