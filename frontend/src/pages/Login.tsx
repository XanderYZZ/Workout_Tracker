import type { FC } from 'react'
import { useState } from "react";
import { Form } from "../components/form"
import { useAuth } from '../lib/auth'
import { PasswordInput, TextInput } from '../components/text_input';
import { Link } from 'react-router-dom';

const Login: FC = () => {
    const { login, isLoading, errors } = useAuth();

    const [formData, setFormData] = useState({
        email_or_username: '',
        password: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e: any) => {
        e.preventDefault();
        login(formData);
    }

    return (
        <div className="background-primary flex items-center justify-center">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                        Welcome back
                    </h2>
                    <p className="text-gray-900">
                        Sign in to your Workout Tracker account to continue
                    </p>
                </div>

                <Form onSubmit={handleSubmit}>
                    <TextInput
                        id="email_or_username"
                        name="email_or_username"
                        display_name="Email or Username"
                        value={formData.email_or_username}
                        onChange={handleChange}
                        placeholder="Enter your email or username"
                        error={errors.email_or_username}
                    />

                    <PasswordInput
                        id="password"
                        name="password"
                        display_name="Password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter your password"
                        error={errors.password}
                    />

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-sm font-medium text-white transition-colors ${isLoading
                            ? 'bg-indigo-400 cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
                            }`}
                    >
                        {isLoading ? (
                            <div className="flex items-center">
                                <svg
                                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                </svg>
                                Signing in...
                            </div>
                        ) : (
                            'Sign in'
                        )}
                    </button>

                    <div className="text-center mt-4">
                        <p className="text-sm text-gray-200">
                            Forgot your password?{' '}
                            <Link to="/reset-password" className="font-medium text-blue-200 hover:text-indigo-500 transition-colors">
                                Reset your password
                            </Link>
                        </p>
                    </div>
                </Form>
            </div>
        </div>
    );
}

export default Login;