import { Link } from "react-router-dom";
import { useAuth } from '../contexts/auth'
import { useLocation } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import '../index.css'

export const Navbar = () => {
    const { user, logout } = useAuth();
    const { pathname } = useLocation();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };

        if (dropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [dropdownOpen]);

    return <>
        <header className="sticky top-0 z-20 bg-slate-950/80 backdrop-blur border-b border-white/10">
            <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                <span className="text-lg font-semibold tracking-tight">
                    Workout Tracker
                </span>

                <nav className="flex justify-end items-center gap-4">
                    {(user && Object.keys(user).length != 0) ? <>
                        {(pathname != "/") ? <>
                            <Link to="/">
                                <button
                                    className="text-white-900 bg-blue-400 hover:text-gray-200 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                >
                                    Home
                                </button>
                            </Link>
                        </> : <></>}
                        {(pathname != "/workouts") ? <>
                            <Link to="/workouts">
                                <button
                                    className="text-white-900 bg-blue-400 hover:text-gray-200 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                >
                                    Workouts
                                </button>
                            </Link>
                        </> : <></>}
                        {(pathname != "/reports") ? <>
                            <Link to="/reports">
                                <button
                                    className="text-white-900 bg-blue-400 hover:text-gray-200 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                >
                                    Reports
                                </button>
                            </Link>
                        </> : <></>}
                        <div className="relative" ref={dropdownRef}>
                            <div className="flex items-center gap-2">
                                <label className="px-3 text-center text-sm font-medium">{user.username}</label>
                                <button
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                    className="w-9 h-9 bg-blue-400 hover:bg-blue-500 text-white font-bold rounded-lg shadow-lg transition-colors flex items-center justify-center"
                                >
                                    <img
                                        style={{
                                            transform: `translateY(${dropdownOpen ? -2 : 2}px) rotate(${dropdownOpen ? 180 : 0}deg)`,
                                            transition: 'transform 300ms ease-in-out'
                                        }}
                                        className="w-6 h-6"
                                        src="/navbar/arrow.png"
                                        alt="Profile"
                                    ></img>
                                </button>
                            </div>

                            {/* Dropdown Menu */}
                            {dropdownOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-white/20 rounded-lg shadow-xl py-2">
                                    <Link to="/settings">
                                        <button
                                            onClick={() => setDropdownOpen(false)}
                                            className="w-full text-left px-4 py-2 hover:bg-blue-500/20 transition-colors text-white flex items-center gap-2"
                                        >
                                            <span>⚙️</span>
                                            <span>Settings</span>
                                        </button>
                                    </Link>
                                    <div>
                                        <button
                                            onClick={logout}
                                            className="w-full text-left px-4 py-2 hover:bg-blue-500/20 transition-colors text-white flex items-center gap-2"
                                        >
                                            <span>👤</span>
                                            <span>Logout</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>

                        // For if the user is not logged in.
                        : <><Link
                            to="/login"
                            className="text-white-900 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                        >
                            Login
                        </Link>
                            <Link to="/signup">
                                <label className="text-white-900 px-4 py-2 rounded-full bg-indigo-500 font-medium hover:bg-indigo-400 transition">
                                    Sign Up
                                </label>
                            </Link></>}
                </nav>
            </div>
        </header>
    </>
}