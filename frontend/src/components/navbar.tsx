import { Link } from "react-router-dom";
import { useAuth } from '../contexts/auth'
import { useLocation } from "react-router-dom";
import '../index.css'

export const Navbar = () => {
    const { user, logout } = useAuth();
    const { pathname } = useLocation();

    return <>
        <header className="sticky top-0 z-20 bg-slate-950/80 backdrop-blur border-b border-white/10">
            <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                <span className="text-lg font-semibold tracking-tight">
                    Workout Tracker
                </span>

                <nav className="flex items-center gap-4">
                    {(user && Object.keys(user).length != 0) ? <>
                    {(pathname != "/workouts") ? <>
                    <Link to="/workouts">
                        <button
                        className="text-white-900 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                        Workouts
                    </button> 
                    </Link>
                    </> : <></>}
                    <button
                        onClick={logout}
                        className="text-white-900 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                        Logout
                    </button> 
                    </>

                    // For if the user is not logged in.
                    : <><Link
                        to="/login"
                        className="text-white-900 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                        Login
                    </Link>
                    <Link to="/signup">
                    <a className="text-white-900 px-4 py-2 rounded-full bg-indigo-500 font-medium hover:bg-indigo-400 transition">
                        Sign Up
                    </a>
                    </Link></>}
                </nav>
            </div>
        </header>
    </>
}