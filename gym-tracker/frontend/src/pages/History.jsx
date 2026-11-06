
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "https://gym-member-carl.onrender.com/api/payments";

export default function History({ user, onLogout }) {
    const navigate = useNavigate();

    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadPayments = async () => {
            if (!user?.uid) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError("");

                const response = await fetch(API_URL);

                if (!response.ok) {
                    throw new Error(`Server error: ${response.status}`);
                }

                const data = await response.json();

                if (!Array.isArray(data)) {
                    throw new Error("Invalid payment data received.");
                }

                const myPayments = data
                    .filter(
                        (payment) =>
                            String(payment.uid) === String(user.uid)
                    )
                    .sort(
                        (a, b) =>
                            new Date(b.createdAt || 0).getTime() -
                            new Date(a.createdAt || 0).getTime()
                    );

                setPayments(myPayments);

            } catch (err) {
                console.error("PAYMENT HISTORY ERROR:", err);
                setError(err.message || "Unable to load payment history.");
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
                    <span className="navbar-brand fw-bold">
                        MOMENTUM GYM
                    </span>

                    <div className="d-flex gap-2">
                        <button
                            className="btn btn-outline-light btn-sm"
                            onClick={() => navigate("/member")}
                        >
                            Back
                        </button>

                        <button
                            className="btn btn-outline-light btn-sm"
                            onClick={onLogout}
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </nav>

            <main className="container py-4 py-lg-5">
                <span className="text-danger fw-bold small">
                    HISTORY
                </span>

                <h1 className="fw-bold mt-1 mb-1">
                    My Payment History
                </h1>

                <p className="text-secondary mb-4">
                    {user?.email}
                </p>

                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-danger" />
                        <p className="mt-2">Loading payment history...</p>
                    </div>
                ) : error ? (
                    <div className="alert alert-danger">
                        {error}
                    </div>
                ) : payments.length === 0 ? (
                    <div className="alert alert-secondary">
                        No payment records found for this account.
                    </div>
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
                                {payments.map((payment, index) => (
                                    <tr key={payment.id || index}>
                                        <td>
                                            {payment.createdAt
                                                ? new Date(
                                                    payment.createdAt
                                                ).toLocaleDateString()
                                                : "—"}
                                        </td>

                                        <td className="fw-semibold">
                                            {payment.plan || "—"}
                                        </td>

                                        <td>
                                            {payment.paymentMethod || "—"}
                                        </td>

                                        <td>
                                            ₱{payment.amount ?? "—"}
                                        </td>

                                        <td>
                                            <span
                                                className={`badge ${
                                                    payment.status === "Approved"
                                                        ? "text-bg-success"
                                                        : payment.status === "Rejected"
                                                        ? "text-bg-danger"
                                                        : "text-bg-warning"
                                                }`}
                                            >
                                                {payment.status || "Unknown"}
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
