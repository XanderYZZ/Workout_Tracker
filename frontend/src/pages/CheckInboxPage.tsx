import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

const CheckInboxPage = () => {
    const navigate = useNavigate();
    const { user, accessToken } = useAuth();

    useEffect(() => {
        if (user || accessToken) {
            navigate('/workouts', { replace: true });
        }
    }, [user, accessToken, navigate]);

    return (
        <div className="background-primary flex items-center justify-center">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-white-900 mb-2">Check your email inbox</h2>
                    <p className="text-white-800">A link has been sent to your email inbox</p>
                </div>
            </div>
        </div>
    );
};

export default CheckInboxPage;