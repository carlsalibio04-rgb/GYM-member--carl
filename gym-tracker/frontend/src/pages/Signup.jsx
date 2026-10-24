import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

import { auth, db } from "../lib/firebase.js";

export default function Signup() {
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSignup = async (e) => {
        e.preventDefault();

        if (!name || !email || !password || !confirmPassword) {
            alert("Please complete all fields.");
            return;
        }

        if (password !== confirmPassword) {
            alert("Passwords do not match.");
            return;
        }

        if (password.length < 6) {
            alert("Password must be at least 6 characters.");
            return;
        }

        try {
            setLoading(true);

            const userCredential = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

            const user = userCredential.user;

            await setDoc(doc(db, "users", user.uid), {
                name,
                uid: user.uid,
                email: user.email,
                role: "member"
            });

            alert("Account created successfully!");
            navigate("/member", { replace: true });
        } catch (error) {
            console.error("SIGNUP ERROR:", error);
            alert(
                "Sign up failed!\n\n" +
                error.code +
                "\n\n" +
                error.message
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page bg-dark min-vh-100 d-flex align-items-center py-5">
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-sm-10 col-md-8 col-lg-6 col-xl-5">
                        <div className="card bg-black text-white border-secondary shadow-lg">
                            <div className="card-body p-4 p-md-5">
                                <Link to="/" className="text-decoration-none text-white fw-bold">
                                    ← Momentum Gym
                                </Link>
                                <h1 className="h2 fw-bold mt-4">Create account</h1>
                                <p className="text-secondary">Create your gym membership account.</p>

                                <form onSubmit={handleSignup} className="mt-4">
                                    <div className="mb-3">
                                        <label className="form-label">Full Name</label>
                                        <input
                                            className="form-control form-control-lg"
                                            type="text"
                                            placeholder="Enter your full name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                        />
                                    </div>

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

                                    <div className="mb-3">
                                        <label className="form-label">Password</label>
                                        <input
                                            className="form-control form-control-lg"
                                            type="password"
                                            placeholder="Create a password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="form-label">Confirm Password</label>
                                        <input
                                            className="form-control form-control-lg"
                                            type="password"
                                            placeholder="Confirm your password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                        />
                                    </div>

                                    <button className="btn btn-danger btn-lg w-100" type="submit" disabled={loading}>
                                        {loading ? "Creating account..." : "Create Account"}
                                    </button>
                                </form>

                                <p className="text-center text-secondary mt-4 mb-0">
                                    Already have an account?{" "}
                                    <Link to="/login" className="text-danger fw-bold text-decoration-none">
                                        Login
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
