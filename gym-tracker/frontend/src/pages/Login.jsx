import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

import { auth, db } from "../lib/firebase.js";

export default function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const goToDashboard = async (user) => {
        const userDoc = await getDoc(doc(db, "users", user.uid));

        if (!userDoc.exists()) {
            await setDoc(doc(db, "users", user.uid), {
                name: user.displayName || "Gym Member",
                uid: user.uid,
                email: user.email,
                role: "member"
            });
            navigate("/member");
            return;
        }

        navigate(userDoc.data().role === "admin" ? "/admin" : "/member");
    };

    const handleLogin = async (e) => {
        e.preventDefault();

        if (!email || !password) {
            alert("Please enter your email and password.");
            return;
        }

        try {
            setLoading(true);
            const result = await signInWithEmailAndPassword(auth, email, password);
            await goToDashboard(result.user);
        } catch (error) {
            console.error(error);
            alert("Login failed: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            setLoading(true);
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            await goToDashboard(result.user);
        } catch (error) {
            console.error(error);
            alert("Google login failed: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page bg-dark min-vh-100 d-flex align-items-center py-5">
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-sm-10 col-md-7 col-lg-5 col-xl-4">
                        <div className="card bg-black text-white border-secondary shadow-lg">
                            <div className="card-body p-4 p-md-5">
                                <Link to="/" className="text-decoration-none text-white fw-bold">
                                    ← Momentum Gym
                                </Link>
                                <h1 className="h2 fw-bold mt-4">Welcome back</h1>
                                <p className="text-secondary">Login to your membership account.</p>

                                <form onSubmit={handleLogin} className="mt-4">
                                    <div className="mb-3">
                                        <label className="form-label">Email</label>
                                        <input
                                            className="form-control form-control-lg"
                                            type="email"
                                            placeholder="Enter your email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="form-label">Password</label>
                                        <input
                                            className="form-control form-control-lg"
                                            type="password"
                                            placeholder="Enter your password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                    </div>

                                    <button className="btn btn-danger btn-lg w-100" type="submit" disabled={loading}>
                                        {loading ? "Logging in..." : "Login"}
                                    </button>
                                </form>

                                <div className="d-flex align-items-center gap-2 my-4">
                                    <hr className="flex-grow-1 border-secondary" />
                                    <span className="small text-secondary">OR</span>
                                    <hr className="flex-grow-1 border-secondary" />
                                </div>

                                <button
                                    type="button"
                                    className="btn btn-outline-light w-100"
                                    onClick={handleGoogleLogin}
                                    disabled={loading}
                                >
                                    Continue with Google
                                </button>

                                <p className="text-center text-secondary mt-4 mb-0">
                                    Don't have an account?{" "}
                                    <Link to="/signup" className="text-danger fw-bold text-decoration-none">
                                        Create one
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
