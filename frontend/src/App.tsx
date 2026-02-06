import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
} from "react-router-dom";
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './lib/auth'
import Home from './pages/Home';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Workouts from './pages/Workouts';
import Reports from './pages/Reports';
import ErrorPage from './pages/ErrorPage';
import Settings from './pages/Settings';
import VerifyEmailPage from "./pages/VerifyEmailPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import CheckInboxPage from "./pages/CheckInboxPage";
import ProtectedRoute from './lib/protected_route';
import { SpeedInsights } from '@vercel/speed-insights/react';

function Layout() {
  return (
    <AuthProvider>
      <Outlet />
      <Toaster toastOptions={{
          duration: 4500, 
        }} />
    </AuthProvider>
  )
}

function App() {
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
          element: <ResetPasswordPage />
        },
        {
          path: "/check-inbox",
          element: <CheckInboxPage /> 
        },
        {
          path: "/login",
          element: <Login />,
        },
        {
          path: "/workouts",
          element: (
            <ProtectedRoute>
              <Workouts />
            </ProtectedRoute>
          ),
        },
        {
          path: "/reports",
          element: (
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          ),
        },
        {
          path: "/settings",
          element: (
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          )
        },
        { path: "*", element: <ErrorPage /> },
      ],
    },
  ]);

  return (
    <>
      <RouterProvider router={router} />
      <SpeedInsights />
    </>
  );
}

export default App