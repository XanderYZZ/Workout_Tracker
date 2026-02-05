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
        <div>
            <h1>Email Verification</h1>
            <p>{status}</p>
        </div>
    );
};

export default VerifyEmailPage;