import type { FC } from 'react'

const ErrorPage: FC = () => {
    return (
        <div className="background-primary min-h-screen flex flex-col items-center justify-center">
            <h1 className="text-6xl font-bold text-white mb-4">404</h1>
            <p className="text-xl text-white mb-8">Oops! We ran into an issue.</p>
            <a href="/" className="px-6 py-3 rounded-full bg-indigo-500 text-white font-medium hover:bg-indigo-400 transition">
                Go to Home
            </a>
        </div>
    )
};

export default ErrorPage;