import type { FC } from "react";
import { BackToHomeButton } from "../components/basic_buttons/back_to_home";

const InvalidToken: FC = () => {
    return (
        <>
            <div className="background-primary flex items-center justify-center">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                        Your token expired
                    </h2>
                    <p className="text-gray-900">
                        Please send a new request
                    </p>
                </div>
                <BackToHomeButton/>
            </div>
        </div>
        </>
    );
};

export default InvalidToken;