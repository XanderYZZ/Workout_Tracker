import type { FC } from "react";
import { Link } from "react-router-dom";

export const BackToHomeButton: FC = ({}) => {
    return (
        <div className="text-center">
            <Link
                to="/"
                className="text-white-400 hover:text-blue-200 text-sm font-medium transition-colors"
            >
                ← Back to home
            </Link>
        </div>
    );
};
