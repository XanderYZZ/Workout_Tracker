import type { FC } from "react";

interface DropdownProps {
    toggleDropdown: () => void;
    isVisible: boolean;
    selectedName: string | null;
    selections: string[];
    handleToggle: (selection: string) => void;
    defaultText: string | null;
}

export const Dropdown: FC<DropdownProps> = ({
    toggleDropdown,
    isVisible,
    selectedName,
    selections,
    handleToggle,
    defaultText,
}) => {
    const addSelection = (selection: string) => (
        <li key={selection}>
            <button
                onClick={() => handleToggle(selection)}
                className={`w-full px-4 py-2 text-left text-gray-900 hover:bg-gray-100 ${
                    selectedName === selection
                        ? "bg-gray-200 font-semibold"
                        : ""
                }`}
            >
                {selection}
            </button>
        </li>
    );

    return (
        <div className="relative w-full">
            <button
                onClick={toggleDropdown}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-left text-gray-900 shadow-sm"
            >
                {selectedName || defaultText || "Select an Option"}
                <span className="float-right">{isVisible ? "▲" : "▼"}</span>
            </button>

            {isVisible && (
                <ul className="absolute z-10 mt-2 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-lg">
                    {selections.map(addSelection)}
                </ul>
            )}
        </div>
    );
};

export default Dropdown;