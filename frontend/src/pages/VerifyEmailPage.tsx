import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/auth";

const VerifyEmailPage = () => {
    const { authenticate } = useAuth();
    const [status, setStatus] = useState("Verifying...");
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const token = searchParams.get("token");
        const email = searchParams.get("email");

        if (!token || !email) {
            setStatus("Invalid verification link.");
            return;
        }

        authenticate(token, email);
    }, [searchParams, navigate]);

    return (
        <div className="background-primary flex items-center justify-center">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-white-900 mb-2">Email Verification</h2>
                    <p>{status}</p>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmailPage;