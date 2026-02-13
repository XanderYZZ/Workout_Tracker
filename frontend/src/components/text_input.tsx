import type { FC } from "react";

interface InputProps {
    id: string;
    name: string;
    display_name: string;
    type?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    error?: string;
}

export const TextInput: FC<InputProps> = ({
    id,
    name,
    display_name,
    type = "text",
    value,
    onChange,
    placeholder,
    error,
}) => {
    return (
        <div>
            <label
                htmlFor={id}
                className="block text-sm font-medium text-white-700 mb-1"
            >
                {display_name}
            </label>
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
            <input
                id={id}
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className={`mb-2 text-white-900 w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${error ? "border-red-300 bg-red-50" : "border-gray-300"}`}
            />
        </div>
    );
};

interface PasswordInputProps extends InputProps {
    requirements?: { [key: string]: boolean };
}

export const PasswordInput: FC<PasswordInputProps> = ({
    requirements,
    ...props
}) => (
    <div>
        <TextInput {...props} type="password" />
        {props.value && requirements && (
            <div className="mt-2 space-y-1 text-xs">
                {Object.entries(requirements).map(([key, met]) => (
                    <div
                        key={key}
                        className={`flex items-center ${met ? "text-green-600" : "text-white-500"}`}
                    >
                        <span className="mr-2">
                            {met ? "✓" : "○"} {key}
                        </span>
                    </div>
                ))}
            </div>
        )}
    </div>
);
