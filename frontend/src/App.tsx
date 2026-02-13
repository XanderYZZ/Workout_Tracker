import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./contexts/auth";
import { WorkoutsProvider } from "./contexts/workouts";
import Home from "./pages/Home";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Workouts from "./pages/Workouts";
import Routines from "./pages/Routines";
import Reports from "./pages/Reports";
import ErrorPage from "./pages/ErrorPage";
import Settings from "./pages/Settings";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import CheckInboxPage from "./pages/CheckInboxPage";
import ProtectedRoute from "./lib/protected_route";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

function Layout() {
    return (
        <AuthProvider>
            <Outlet />
            <Toaster
                toastOptions={{
                    duration: 4500,
                }}
            />
        </AuthProvider>
    );
}

function App() {
    const queryClient = new QueryClient();

    const router = createBrowserRouter([
        {
            path: "/",
            element: <Layout />,
            errorElement: <ErrorPage />,
            children: [
                {
                    index: true,
                    element: <Home />,
                },
                {
                    path: "/signup",
                    element: <Signup />,
                },
                {
                    path: "/authenticate",
                    element: <VerifyEmailPage />,
                },
                {
                    path: "/reset-password",
                    element: <ResetPasswordPage />,
                },
                {
                    path: "/check-inbox",
                    element: <CheckInboxPage />,
                },
                {
                    path: "/login",
                    element: <Login />,
                },
                {
                    path: "/routines",
                    element: (
                        <ProtectedRoute>
                            <Routines />
                        </ProtectedRoute>
                    ),
                },
                // Only workouts and reports need the WorkoutsProvider, so we wrap them individually in the router.
                // Otherwise, it would cause unnecessary rendering of the workouts context for pages that don't need it, like settings.
                {
                    path: "/workouts",
                    element: (
                        <ProtectedRoute>
                            <WorkoutsProvider>
                                <Workouts />
                            </WorkoutsProvider>
                        </ProtectedRoute>
                    ),
                },
                {
                    path: "/reports",
                    element: (
                        <ProtectedRoute>
                            <WorkoutsProvider>
                                <Reports />
                            </WorkoutsProvider>
                        </ProtectedRoute>
                    ),
                },
                {
                    path: "/settings",
                    element: (
                        <ProtectedRoute>
                            <Settings />
                        </ProtectedRoute>
                    ),
                },
                { path: "*", element: <ErrorPage /> },
            ],
        },
    ]);

    return (
        <>
            <QueryClientProvider client={queryClient}>
                <RouterProvider router={router} />
            </QueryClientProvider>
            <SpeedInsights />
        </>
    );
}

export default App;
