import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    collection,
    getDocs,
    query,
    where
} from "firebase/firestore";

import { db } from "../lib/firebase.js";

const getTimeLeft = (expirationDate, now) => {
    if (!expirationDate) return null;

    const diff = new Date(expirationDate).getTime() - now;

    if (Number.isNaN(diff)) return null;

    if (diff <= 0) {
        return { expired: true, urgent: true, text: "Expired" };
    }

    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return {
        expired: false,
        urgent: days < 3,
        text: `${days}d ${hours}h ${minutes}m ${seconds}s`
    };
};

export default function MemberDashboard({ user, onLogout }) {
    const navigate = useNavigate();
    const [plans, setPlans] = useState([]);
    const [activeMembership, setActiveMembership] = useState(null);
    const [pendingPayment, setPendingPayment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const loadPlans = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await fetch("https://gym-member-carl.onrender.com/api/plans");

                if (!response.ok) {
                    throw new Error("Failed to load membership plans.");
                }

                setPlans(await response.json());
            } catch (error) {
                console.error("PLAN ERROR:", error);
                setError(
                    "Unable to load membership plans. Make sure the backend server is running."
                );
            } finally {
                setLoading(false);
            }
        };

        loadPlans();
    }, []);

    useEffect(() => {
        const loadPayments = async () => {
            if (!user) return;

            try {
                const q = query(
                    collection(db, "payments"),
                    where("uid", "==", user.uid)
                );

                const snapshot = await getDocs(q);
                const data = snapshot.docs.map((document) => ({
                    id: document.id,
                    ...document.data()
                }));

                data.sort((a, b) => {
                    const aTime = a.createdAt?.toMillis?.() || 0;
                    const bTime = b.createdAt?.toMillis?.() || 0;
                    return bTime - aTime;
                });

                const pending = data.find((payment) => payment.status === "Pending");
                setPendingPayment(pending || null);

                const approved = data.filter((payment) => payment.status === "Approved");

                if (approved.length > 0) {
                    const latest = approved[0];

                    if (latest.expirationDate) {
                        const expirationDate = new Date(latest.expirationDate);
                        setActiveMembership(
                            expirationDate >= new Date()
                                ? latest
                                : { ...latest, membershipStatus: "Expired" }
                        );
                    } else {
                        setActiveMembership(latest);
                    }
                } else {
                    setActiveMembership(null);
                }
            } catch (error) {
                console.error("PAYMENT HISTORY ERROR:", error);
            }
        };

        loadPayments();
    }, [user]);

    return (
        <div className="bg-light min-vh-100">
            <nav className="navbar navbar-dark bg-dark shadow-sm">
                <div className="container">
                    <span className="navbar-brand fw-bold">MOMENTUM GYM</span>
                    <div className="d-flex gap-2">
                        <button className="btn btn-outline-light btn-sm" onClick={() => navigate("/history")}>
                            History
                        </button>
                        <button className="btn btn-outline-light btn-sm" onClick={onLogout}>
                            Logout
                        </button>
                    </div>
                </div>
            </nav>

            <main className="container py-4 py-lg-5">
                <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
                    <div>
                        <span className="badge text-bg-danger mb-2">MEMBER</span>
                        <h1 className="fw-bold mb-1">Member Dashboard</h1>
                        <p className="text-secondary mb-0">Welcome, {user?.email}</p>
                    </div>
                </div>

                <div className="card border-0 bg-dark text-white shadow mb-4">
                    <div className="card-body p-4 p-lg-5">
                        <span className="text-danger fw-bold small">MEMBERSHIP</span>
                        <h2 className="fw-bold mt-2">Stay consistent. Keep progressing.</h2>
                        <p className="text-secondary mb-0">
                            Manage your membership, choose a plan, and track your payments in one place.
                        </p>
                    </div>
                </div>

                <section className="mb-5">
                    <h2 className="h3 fw-bold mb-3">My Membership</h2>

                    {activeMembership ? (
                        <div className={`card border-0 shadow-sm ${activeMembership.membershipStatus === "Expired" ? "border border-warning" : ""}`}>
                            <div className="card-body p-4">
                                <div className="d-flex flex-wrap justify-content-between gap-3">
                                    <div>
                                        <span className="text-secondary small">PLAN</span>
                                        <h3 className="h4 fw-bold mt-1">{activeMembership.plan}</h3>
                                    </div>
                                    <span className={`badge align-self-start ${activeMembership.membershipStatus === "Expired" ? "text-bg-warning" : "text-bg-success"}`}>
                                        {activeMembership.membershipStatus || activeMembership.status}
                                    </span>
                                </div>

                                <div className="row g-3 mt-2">
                                    <div className="col-md-3">
                                        <div className="p-3 bg-light rounded">
                                            <small className="text-secondary d-block">Amount</small>
                                            <strong>₱{activeMembership.amount}</strong>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="p-3 bg-light rounded">
                                            <small className="text-secondary d-block">Start Date</small>
                                            <strong>{activeMembership.startDate ? new Date(activeMembership.startDate).toLocaleDateString() : "—"}</strong>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="p-3 bg-light rounded">
                                            <small className="text-secondary d-block">Expiration</small>
                                            <strong>{activeMembership.expirationDate ? new Date(activeMembership.expirationDate).toLocaleDateString() : "—"}</strong>
                                        </div>
                                    </div>

                                    <div className="col-md-3">
                                        <div className="p-3 bg-light rounded">
                                            <small className="text-secondary d-block">Time Left</small>
                                            {(() => {
                                                const timeLeft = getTimeLeft(activeMembership.expirationDate, now);

                                                if (!timeLeft) return <strong>—</strong>;

                                                return (
                                                    <strong className={`font-monospace ${timeLeft.expired ? "text-danger" : timeLeft.urgent ? "text-warning" : "text-success"}`}>
                                                        {timeLeft.text}
                                                    </strong>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>

                                {activeMembership.membershipStatus === "Expired" && !pendingPayment && (
                                    <button
                                        className="btn btn-danger mt-4"
                                        onClick={() => document.getElementById("membership-plans")?.scrollIntoView({ behavior: "smooth" })}
                                    >
                                        Renew Membership
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="alert alert-secondary mb-0">
                            <h3 className="h5">No active membership yet</h3>
                            <p className="mb-0">Choose a plan below to get started.</p>
                        </div>
                    )}
                </section>

                {pendingPayment && (
                    <div className="alert alert-warning d-flex flex-wrap justify-content-between align-items-center gap-3 shadow-sm">
                        <div>
                            <strong>Waiting for admin approval</strong>
                            <div>{pendingPayment.plan} · ₱{pendingPayment.amount}</div>
                        </div>
                        <span className="badge text-bg-warning">Pending</span>
                    </div>
                )}

                <section id="membership-plans" className="mb-5">
                    <div className="d-flex flex-wrap justify-content-between align-items-end mb-3">
                        <div>
                            <span className="text-danger fw-bold small">PLANS</span>
                            <h2 className="h3 fw-bold mt-1">Membership Plans</h2>
                        </div>
                        <p className="text-secondary mb-1">Choose the plan that works for you.</p>
                    </div>

                    {loading && <div className="text-center py-4"><div className="spinner-border text-danger" /></div>}

                    {error && (
                        <div className="alert alert-danger">
                            {error}
                            <button className="btn btn-sm btn-outline-danger ms-3" onClick={() => window.location.reload()}>
                                Try Again
                            </button>
                        </div>
                    )}

                    {!loading && !error && plans.length === 0 && (
                        <div className="alert alert-secondary">No membership plans found.</div>
                    )}

                    <div className="row g-4">
                        {!loading && !error && plans.map((plan) => (
                            <div className="col-md-6 col-lg-4" key={plan.id}>
                                <div className="card h-100 border-0 shadow-sm">
                                    <div className="card-body p-4 d-flex flex-column">
                                        <span className="text-danger fw-bold small">MEMBERSHIP</span>
                                        <h3 className="h4 fw-bold mt-2">{plan.name}</h3>
                                        <p className="text-secondary">Duration: {plan.duration}</p>
                                        <div className="display-6 fw-bold mt-auto mb-3">₱{plan.price}</div>
                                        <button
                                            className="btn btn-danger w-100"
                                            disabled={pendingPayment !== null}
                                            onClick={() => navigate("/payment", { state: { plan } })}
                                        >
                                            {pendingPayment ? "Payment Pending" : "Select Plan"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}
