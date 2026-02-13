import type { FC, HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
}

export const Card: FC<CardProps> = ({ children, ...props }) => {
    return (
        <div {...props}>
            <div className="*:p-4 bg-[#2A2A3D] rounded-lg shadow-md overflow-hidden">
                {children}
            </div>
        </div>
    );
};

export default Card;
