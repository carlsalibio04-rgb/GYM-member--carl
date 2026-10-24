import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    collection,
    getDocs,
    orderBy,
    query,
    doc,
    updateDoc
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

export default function AdminDashboard({ user, onLogout }) {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);
    const [statusFilter, setStatusFilter] = useState("All");

    const loadPayments = async () => {
        try {
            setLoading(true);

            const paymentsQuery = query(
                collection(db, "payments"),
                orderBy("createdAt", "desc")
            );

            const snapshot = await getDocs(paymentsQuery);
            setPayments(
                snapshot.docs.map((document) => ({
                    id: document.id,
                    ...document.data()
                }))
            );
        } catch (error) {
            console.error("Failed to load payments:", error);
            alert("Unable to load payment records: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPayments();
    }, []);

    const approvePayment = async (payment) => {
        try {
            const startDate = new Date();
            const expirationDate = new Date(startDate);
            const days = parseInt(payment.duration, 10);

            expirationDate.setDate(expirationDate.getDate() + days);

            await updateDoc(doc(db, "payments", payment.id), {
                status: "Approved",
                startDate: startDate.toISOString(),
                expirationDate: expirationDate.toISOString()
            });

            alert("Payment approved successfully!");
            loadPayments();
        } catch (error) {
            console.error("Approval error:", error);
            alert("Unable to approve payment: " + error.message);
        }
    };

    const totalPayments = payments.reduce(
        (total, payment) => total + Number(payment.amount || 0),
        0
    );

    const pendingPayments = payments.filter(
        (payment) => payment.status === "Pending"
    ).length;

    const approvedPayments = payments.filter(
        (payment) => payment.status === "Approved"
    ).length;

    const filteredPayments = statusFilter === "All"
        ? payments
        : payments.filter((payment) => payment.status === statusFilter);

    return (
        <div className="bg-light min-vh-100">
            <nav className="navbar navbar-dark bg-dark shadow-sm">
                <div className="container">
                    <div>
                        <span className="navbar-brand fw-bold">MOMENTUM GYM</span>
                        <span className="badge text-bg-danger ms-2">ADMIN</span>
                    </div>
                    <div className="d-flex gap-2">
                        <Link className="btn btn-outline-light btn-sm" to="/frontdesk">
                            Front Desk
                        </Link>
                        <Link className="btn btn-outline-light btn-sm" to="/priceedit">
                            Price Edit
                        </Link>
                        <button className="btn btn-outline-light btn-sm" onClick={onLogout}>
                            Logout
                        </button>
                    </div>
                </div>
            </nav>

            <main className="container py-4 py-lg-5">
                <div className="mb-4">
                    <h1 className="fw-bold mb-1">Admin Dashboard</h1>
                    <p className="text-secondary mb-0">Signed in as {user?.email}</p>
                </div>

                <div className="row g-4 mb-5">
                    <div className="col-md-4">
                        <div className="card border-0 shadow-sm h-100">
                            <div className="card-body">
                                <span className="text-secondary small">TOTAL PAYMENTS</span>
                                <div className="display-6 fw-bold text-danger mt-2">₱{totalPayments}</div>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="card border-0 shadow-sm h-100">
                            <div className="card-body">
                                <span className="text-secondary small">PENDING</span>
                                <div className="display-6 fw-bold mt-2">{pendingPayments}</div>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="card border-0 shadow-sm h-100">
                            <div className="card-body">
                                <span className="text-secondary small">APPROVED</span>
                                <div className="display-6 fw-bold text-success mt-2">{approvedPayments}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
                    <div>
                        <span className="text-danger fw-bold small">MANAGEMENT</span>
                        <h2 className="h3 fw-bold mt-1 mb-0">Payment Records</h2>
                    </div>
                    <select
                        className="form-select w-auto"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="All">All Payments</option>
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                    </select>
                </div>

                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-danger" role="status" />
                        <p className="text-secondary mt-3">Loading payment records...</p>
                    </div>
                ) : filteredPayments.length === 0 ? (
                    <div className="alert alert-secondary">No payment records found.</div>
                ) : (
                    <div className="table-responsive bg-white rounded shadow-sm">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-dark">
                                <tr>
                                    <th>Member</th>
                                    <th>Plan</th>
                                    <th>Amount</th>
                                    <th>Method</th>
                                    <th>Duration</th>
                                    <th>Status</th>
                                    <th>Time Left</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPayments.map((payment) => (
                                    <tr key={payment.id}>
                                        <td>
                                            <strong>{payment.name}</strong>
                                            <small className="d-block text-secondary">{payment.email}</small>
                                        </td>
                                        <td>{payment.plan}</td>
                                        <td>₱{payment.amount}</td>
                                        <td>{payment.paymentMethod || "—"}</td>
                                        <td>{payment.duration || "—"}</td>
                                        <td>
                                            <span className={`badge ${payment.status === "Approved" ? "text-bg-success" : "text-bg-warning"}`}>
                                                {payment.status}
                                            </span>
                                        </td>
                                        <td>
                                            {(() => {
                                                const timeLeft =
                                                    payment.status === "Approved"
                                                        ? getTimeLeft(payment.expirationDate, now)
                                                        : null;

                                                if (!timeLeft) return "—";

                                                return (
                                                    <span className={`badge font-monospace ${timeLeft.expired ? "text-bg-danger" : timeLeft.urgent ? "text-bg-warning" : "text-bg-success"}`}>
                                                        {timeLeft.text}
                                                    </span>
                                                );
                                            })()}
                                        </td>
                                        <td>
                                            {payment.status === "Pending" ? (
                                                <button
                                                    className="btn btn-sm btn-success"
                                                    onClick={() => approvePayment(payment)}
                                                >
                                                    Approve
                                                </button>
                                            ) : (
                                                <span className="text-secondary small">Completed</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
        </div>
    );
}
