import type { FC } from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Form } from "../components/form"
import { useAuth, passwordStrengthKeys } from '../lib/auth';
import { TextInput, PasswordInput } from '../components/text_input';
import { Notifications } from "../lib/notifications"

const Signup: FC = () => {
    const { validatePasswordInputs, signup, isLoading, errors, setErrors, setIsLoading, checkPasswordStrength, isEmailInValidForm } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        username: '',
        password: '',
        confirmPassword: ''
    });
    const [passwordRequirements, setPasswordRequirements] = useState({...passwordStrengthKeys});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'password') setPasswordRequirements(checkPasswordStrength(value));
        if (errors[name]) setErrors({ ...errors, [name]: '' });
    };

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!isEmailInValidForm(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (!formData.username) newErrors.username = 'Username is required';

        validatePasswordInputs(formData, newErrors);
        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsLoading(true);
        try {
            signup(formData);
        } catch (err) {
            Notifications.showError('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="background-primary flex items-center justify-center">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Create your account</h2>
                    <p className="text-gray-800">Join Workout Tracker and start tracking your workouts</p>
                </div>

                <Form onSubmit={handleSubmit}>
                    <TextInput
                        id="email"
                        name="email"
                        display_name="Email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter your email"
                        error={errors.email}
                    />

                    <TextInput
                        id="username"
                        name="username"
                        display_name="Username"
                        value={formData.username}
                        onChange={handleChange}
                        placeholder="Enter your username"
                        error={errors.username}
                    />

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
                    />

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-sm font-medium text-white transition-colors ${isLoading
                            ? 'bg-blue-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
                            }`}
                    >
                        {isLoading ? 'Creating account...' : 'Create account'}
                    </button>

                    <div className="text-center mt-4">
                        <p className="text-sm text-gray-200">
                            Already have an account?{' '}
                            <Link to="/login" className="font-medium text-blue-200 hover:text-indigo-500 transition-colors">
                                Sign in here
                            </Link>
                        </p>
                    </div>
                </Form>
            </div>
        </div>
    );
};

export default Signup;