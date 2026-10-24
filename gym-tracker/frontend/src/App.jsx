import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import MemberDashboard from "./pages/MemberDashboard.jsx";
import History from "./pages/History.jsx";
import Payment from "./pages/Payment.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import FrontDesk from "./pages/FrontDesk.jsx";
import PriceEdit from "./pages/PriceEdit.jsx";

import { auth, db } from "./lib/firebase.js";

function LoadingScreen() {
    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
            <div className="text-center">
                <div className="spinner-border text-danger mb-3" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <h5 className="fw-bold">Loading Gym Membership System...</h5>
            </div>
        </div>
    );
}

function PublicRoute({ user, role, children }) {
    if (!user) return children;

    if (role === "admin") {
        return <Navigate to="/admin" replace />;
    }

    return <Navigate to="/member" replace />;
}

function MemberRoute({ user, role, children }) {
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (role !== "member") {
        return <Navigate to="/admin" replace />;
    }

    return children;
}

function AdminRoute({ user, role, children }) {
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (role !== "admin") {
        return <Navigate to="/member" replace />;
    }

    return children;
}

export default function App() {
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(
            auth,
            async (currentUser) => {
                if (!currentUser) {
                    setUser(null);
                    setRole(null);
                    setLoading(false);
                    return;
                }

                setUser(currentUser);

                try {
                    const userDoc = await getDoc(
                        doc(db, "users", currentUser.uid)
                    );

                    if (userDoc.exists()) {
                        setRole(userDoc.data().role || "member");
                    } else {
                        setRole("member");
                    }
                } catch (error) {
                    console.error("Failed to get user role:", error);
                    setRole("member");
                }

                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            setUser(null);
            setRole(null);
            navigate("/", { replace: true });
        } catch (error) {
            console.error(error);
            alert("Logout failed: " + error.message);
        }
    };

    if (loading) {
        return <LoadingScreen />;
    }

    return (
        <Routes>
            <Route
                path="/"
                element={
                    <PublicRoute user={user} role={role}>
                        <Landing />
                    </PublicRoute>
                }
            />

            <Route
                path="/login"
                element={
                    <PublicRoute user={user} role={role}>
                        <Login />
                    </PublicRoute>
                }
            />

            <Route
                path="/signup"
                element={
                    <PublicRoute user={user} role={role}>
                        <Signup />
                    </PublicRoute>
                }
            />

            <Route
                path="/member"
                element={
                    <MemberRoute user={user} role={role}>
                        <MemberDashboard user={user} onLogout={handleLogout} />
                    </MemberRoute>
                }
            />

            <Route
                path="/payment"
                element={
                    <MemberRoute user={user} role={role}>
                        <Payment user={user} />
                    </MemberRoute>
                }
            />

            <Route
                path="/admin"
                element={
                    <AdminRoute user={user} role={role}>
                        <AdminDashboard user={user} onLogout={handleLogout} />
                    </AdminRoute>
                }
            />

            <Route
                path="/history"
                element={
                    <MemberRoute user={user} role={role}>
                        <History user={user} onLogout={handleLogout} />
                    </MemberRoute>
                }
            />

            <Route
                path="/frontdesk"
                element={
                    <AdminRoute user={user} role={role}>
                        <FrontDesk user={user} onLogout={handleLogout} />
                    </AdminRoute>
                }
            />

            <Route
                path="/priceedit"
                element={
                    <AdminRoute user={user} role={role}>
                        <PriceEdit user={user} onLogout={handleLogout} />
                    </AdminRoute>
                }
            />

            <Route
                path="*"
                element={<Navigate to="/" replace />}
            />
        </Routes>
    );
}
