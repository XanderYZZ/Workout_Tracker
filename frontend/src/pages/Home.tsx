import type { FC } from 'react'
import { Link } from "react-router-dom";
import { useAuth } from '../contexts/auth'
import '../index.css'

const Home: FC = () => {
    const { user, logout } = useAuth();

    return (
        <div className="background-primary">
            <header className="sticky top-0 z-20 bg-slate-950/80 backdrop-blur border-b border-white/10">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <span className="text-lg font-semibold tracking-tight">
                        Workout Tracker
                    </span>

                    <nav className="flex items-center gap-4">
                        {(Object.keys(user).length != 0) ? <button
                            onClick={logout}
                            className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                        >
                            Logout
                        </button> : <><Link
                            to="/login"
                            className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                        >
                            Login
                        </Link>
                        <Link to="/signup">
                        <a className="px-4 py-2 rounded-full bg-indigo-500 text-white font-medium hover:bg-indigo-400 transition">
                            Sign Up
                        </a>
                        </Link></>}
                    </nav>
                </div>
            </header>

            <main>
                <section className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/30 via-purple-600/20 to-pink-600/20 blur-3xl" />

                    <div className="relative max-w-6xl mx-auto px-6 py-32 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                        <div>
                            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-none tracking-tight">
                                Train smarter.
                                <br />
                                <span className="text-indigo-400">Progress faster.</span>
                            </h1>

                            <p className="mt-8 text-lg text-slate-300 max-w-md">
                                Log workouts, visualize progress, and build consistency with a fast, no-nonsense tracking system.
                            </p>

                            <div className="mt-10 flex gap-4">
                                <Link to="/signup">
                                <a className="px-6 py-3 rounded-full bg-indigo-500 text-white font-medium hover:bg-indigo-400 transition">
                                    Get started free
                                </a>
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="bg-slate-900 border-t border-white/10">
                    <div className="max-w-6xl mx-auto px-6 py-24 grid grid-cols-1 sm:grid-cols-3 gap-8">
                        {[
                            ['Log workouts', 'Fast input for sets, reps, and weights.'],
                            ['See progress', 'Visualize strength gains over time.'],
                            ['Reuse routines', 'Templates that speed up training.'],
                        ].map(([title, desc]) => (
                            <div
                                key={title}
                                className="rounded-xl bg-slate-800/60 border border-white/10 p-6 hover:bg-slate-800 transition"
                            >
                                <h3 className="font-semibold text-white">{title}</h3>
                                <p className="mt-2 text-sm text-slate-400">{desc}</p>
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    )
}

export default Home