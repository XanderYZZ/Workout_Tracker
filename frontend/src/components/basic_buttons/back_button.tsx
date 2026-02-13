import type { FC, ReactNode, ButtonHTMLAttributes } from "react";
import { useNavigate } from "react-router-dom";

interface BackButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children?: ReactNode; 
}

export const BackButton: FC<BackButtonProps> = ({ children, className, onClick, ...rest }) => {
    const navigate = useNavigate();

    const handleGoBack = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (onClick) {
            onClick(e); 
        }
        if (!e.defaultPrevented) {
            navigate(-1); 
        }
    };

    return (
        <button
            className={className ?? "w-8 h-8"} 
            onClick={handleGoBack}
            {...rest}
        >
            {children ?? <img className="rotate-90 w-4 h-4" src="/navbar/arrow.png" alt="Back" />}
        </button>
    );
};