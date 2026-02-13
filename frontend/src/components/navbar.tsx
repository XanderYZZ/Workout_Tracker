import { Link } from "react-router-dom";
import { useAuth } from "../contexts/auth";
import { useLocation } from "react-router-dom";
import { useState, useRef, useEffect } from "react";

export const Navbar = () => {
    const { user, logout } = useAuth();
    const { pathname } = useLocation();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setDropdownOpen(false);
            }
        };

        if (dropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            return () =>
                document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [dropdownOpen]);

    const getNavButtonClass = (path: string) => {
        const isActive = pathname === path;
        const baseClass =
            "px-4 py-2 rounded-lg text-sm font-medium transition-all";
        const inactiveClass = "text-white hover:bg-white/10 active:bg-white/20";
        const activeClass =
            "text-blue-200 bg-white/10 border-b-2 border-blue-800 shadow-lg shadow-blue-400/20";

        return `${baseClass} ${isActive ? activeClass : inactiveClass}`;
    };

    return (
        <>
            <header className="sticky top-0 z-20 bg-slate-950/80 backdrop-blur border-b border-white/10">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <span className="text-lg font-semibold tracking-tight">
                        Workout Tracker
                    </span>

                    <nav className="flex justify-end items-center gap-2">
                        {user && Object.keys(user).length != 0 ? (
                            <>
                                <Link to="/">
                                    <button className={getNavButtonClass("/")}>
                                        Home
                                    </button>
                                </Link>
                                <Link to="/workouts">
                                    <button
                                        className={getNavButtonClass(
                                            "/workouts",
                                        )}
                                    >
                                        Workouts
                                    </button>
                                </Link>
                                <Link to="/reports">
                                    <button
                                        className={getNavButtonClass(
                                            "/reports",
                                        )}
                                    >
                                        Reports
                                    </button>
                                </Link>
                                <div className="relative" ref={dropdownRef}>
                                    <div className="flex items-center gap-2">
                                        <label className="px-3 text-center text-sm font-medium text-white">
                                            {user.username}
                                        </label>
                                        <button
                                            onClick={() =>
                                                setDropdownOpen(!dropdownOpen)
                                            }
                                            className="w-9 h-9 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all flex items-center justify-center border border-white/20"
                                        >
                                            <img
                                                style={{
                                                    transform: `translateY(${dropdownOpen ? -2 : 2}px) rotate(${dropdownOpen ? 180 : 0}deg)`,
                                                    transition:
                                                        "transform 300ms ease-in-out",
                                                }}
                                                className="w-5 h-5"
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
                                                    onClick={() =>
                                                        setDropdownOpen(false)
                                                    }
                                                    className="w-full text-left px-4 py-2 hover:bg-indigo-500/20 transition-colors text-white flex items-center gap-2"
                                                >
                                                    <span>⚙️</span>
                                                    <span>Settings</span>
                                                </button>
                                            </Link>
                                            <div>
                                                <button
                                                    onClick={logout}
                                                    className="w-full text-left px-4 py-2 hover:bg-indigo-500/20 transition-colors text-white flex items-center gap-2"
                                                >
                                                    <span>👤</span>
                                                    <span>Logout</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            // For if the user is not logged in.
                            <>
                                <Link
                                    to="/login"
                                    className="text-white px-4 py-2 rounded-lg text-sm font-medium transition-all hover:bg-white/10"
                                >
                                    Login
                                </Link>
                                <Link to="/signup">
                                    <button className="text-white px-4 py-2 rounded-lg bg-indigo-600 font-medium hover:bg-indigo-500 active:bg-indigo-700 transition-all">
                                        Sign Up
                                    </button>
                                </Link>
                            </>
                        )}
                    </nav>
                </div>
            </header>
        </>
    );
};
