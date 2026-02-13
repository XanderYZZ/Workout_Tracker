import type { FC } from "react";
import { useNavigate } from "react-router-dom";

export const BackButton: FC = ({}) => {
    const navigate = useNavigate();
    const handleGoBack = () => {
        navigate(-1);
    };

    return (
        <button className="w-8 h-8" onClick={handleGoBack}>
            <img className="rotate-90" src="/navbar/arrow.png"></img>
        </button>
    );
};
