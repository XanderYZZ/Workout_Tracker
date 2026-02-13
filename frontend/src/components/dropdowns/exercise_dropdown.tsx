import type { FC, ComponentProps } from "react";
import { Dropdown } from "./dropdown";

type ExerciseDropdownProps = Omit<
    ComponentProps<typeof Dropdown>,
    "defaultText"
>;

export const ExerciseDropdown: FC<ExerciseDropdownProps> = (props) => {
    return (
        <Dropdown
            {...props}
            defaultText="Select an exercise"
        />
    );
};

export default ExerciseDropdown;