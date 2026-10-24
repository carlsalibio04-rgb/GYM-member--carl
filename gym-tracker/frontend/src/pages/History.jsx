import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    collection,
    getDocs,
    query,
    where
} from "firebase/firestore";

import { db } from "../lib/firebase.js";

export default function PaymentHistory({ user, onLogout }) {
    const navigate = useNavigate();
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadPayments = async () => {
            if (!user) return;

            try {
                setLoading(true);

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

                setPayments(data);
            } catch (error) {
                console.error("PAYMENT HISTORY ERROR:", error);
            } finally {
                setLoading(false);
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
                        <button className="btn btn-outline-light btn-sm" onClick={() => navigate("/member")}>
                            Back
                        </button>
                        <button className="btn btn-outline-light btn-sm" onClick={onLogout}>
                            Logout
                        </button>
                    </div>
                </div>
            </nav>

            <main className="container py-4 py-lg-5">
                <span className="text-danger fw-bold small">HISTORY</span>
                <h1 className="fw-bold mt-1 mb-1">My Payment History</h1>
                <p className="text-secondary mb-4">{user?.email}</p>

                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-danger" role="status" />
                    </div>
                ) : payments.length === 0 ? (
                    <div className="alert alert-secondary">No payment records yet.</div>
                ) : (
                    <div className="table-responsive bg-white rounded shadow-sm">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-dark">
                                <tr>
                                    <th>Date</th>
                                    <th>Plan</th>
                                    <th>Method</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.map((payment) => (
                                    <tr key={payment.id}>
                                        <td>
                                            {payment.createdAt?.toDate?.()
                                                ? payment.createdAt.toDate().toLocaleDateString()
                                                : "—"}
                                        </td>
                                        <td className="fw-semibold">{payment.plan}</td>
                                        <td>{payment.paymentMethod || "—"}</td>
                                        <td>₱{payment.amount}</td>
                                        <td>
                                            <span className={`badge ${payment.status === "Approved" ? "text-bg-success" : "text-bg-warning"}`}>
                                                {payment.status}
                                            </span>
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
