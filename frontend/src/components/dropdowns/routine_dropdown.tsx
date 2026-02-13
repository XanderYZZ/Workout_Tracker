import type { FC, ComponentProps } from "react";
import { Dropdown } from "./dropdown";

type RoutineDropdownProps = Omit<
    ComponentProps<typeof Dropdown>,
    "defaultText"
>;

export const RoutineDropdown: FC<RoutineDropdownProps> = (props) => {
    return (
        <Dropdown
            {...props}
            defaultText="Select a routine"
        />
    );
};

export default RoutineDropdown;