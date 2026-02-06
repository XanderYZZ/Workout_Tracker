import { useState, useEffect } from "react"
import { Form } from "../components/form"
import { TextInput } from "../components/text_input"
import { useAuth, passwordStrengthKeys } from "../lib/auth"
import { Notifications } from "../lib/notifications"
import { useSearchParams, useNavigate } from "react-router-dom";
import { PasswordInput } from "../components/text_input"

const ResetPasswordPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [ isLoading, setIsLoading ] = useState<boolean>(false);
    const [ isInEmailState, setIsInEmailState ] = useState<boolean>(false);
    const { validatePasswordInputs, resetPassword, errors, setErrors, checkPasswordStrength, initialResetPasswordRequest, isEmailInValidForm } = useAuth();
    const [ token, setToken ] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [passwordRequirements, setPasswordRequirements] = useState({...passwordStrengthKeys});

    useEffect(() => {
        const token = searchParams.get("token");
        const email = searchParams.get("email");

        if (!token || !email) {
            setIsInEmailState(true);
            return;
        }
        
        setFormData({email: email, password: '', confirmPassword: ''})
        setToken(token);
        setIsInEmailState(false);
    }, [searchParams, navigate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'password') setPasswordRequirements(checkPasswordStrength(value));
        if (errors[name]) setErrors({ ...errors, [name]: '' });
    };

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};

        if (isInEmailState) {
            if (!formData.email.trim()) newErrors.email = 'Email is required';
            else if (!isEmailInValidForm(formData.email))
                newErrors.email = 'Please enter a valid email address';
        } else {
            validatePasswordInputs(formData, newErrors);
        }

        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        setIsLoading(true);

        try {
            if (isInEmailState || !token) {
                initialResetPasswordRequest(formData.email);    
            } else {
                resetPassword(formData.email, token || "", formData.password);
            }
        } catch (err) {
            Notifications.showError(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <div className="background-primary flex items-center justify-center">
                <div className="max-w-md w-full space-y-8">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-white-900 mb-2">Reset Password</h2>
                        {isInEmailState ? 
                        <p className="text-white-800">
                            Enter your email to receive a password reset link
                        </p>
                        : <p className="text-white-800">
                            Enter your new password
                        </p>
                        }
                    </div>

                    <Form onSubmit={handleSubmit}>
                        {isInEmailState ? 
                        <TextInput
                            id="email"
                            name="email"
                            display_name="Email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Enter your email"
                        />
                        : <>
                        <PasswordInput
                            id="password"
                            name="password"
                            display_name="Password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Create a password"
                            requirements={passwordRequirements}
                            error={errors.password}
                        />
    
                        <PasswordInput
                            id="confirmPassword"
                            name="confirmPassword"
                            display_name="Confirm Password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Confirm your password"
                            error={errors.confirmPassword}
                        /></>
                        }

                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-sm font-medium text-white transition-colors ${isLoading
                                ? 'bg-blue-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
                                }`}
                        >
                            {isLoading ? 'Waiting for server response...' : 'Confirm'}
                        </button>
                    </Form>
                </div>
            </div>
        </div>
    );
}

export default ResetPasswordPage;