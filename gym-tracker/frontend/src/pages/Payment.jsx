import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

import { db } from "../lib/firebase.js";

export default function Payment({ user }) {
    const location = useLocation();
    const navigate = useNavigate();
    const plan = location.state?.plan;

    const [memberName, setMemberName] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("Cash");
    const [submitting, setSubmitting] = useState(false);

    if (!plan) {
        return (
            <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center p-4">
                <div className="alert alert-warning shadow-sm">
                    No membership plan was selected. <Link to="/member">Return to dashboard</Link>.
                </div>
            </div>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!memberName) {
            alert("Please enter your name.");
            return;
        }

        try {
            setSubmitting(true);

            await addDoc(collection(db, "payments"), {
                name: memberName,
                uid: user.uid,
                email: user.email,
                plan: plan.name,
                amount: plan.price,
                duration: plan.duration,
                paymentMethod,
                status: "Pending",
                createdAt: serverTimestamp()
            });

            alert("Payment submitted successfully!");
            navigate("/member", { replace: true });
        } catch (error) {
            console.error("Payment Error:", error);
            alert("Payment failed: " + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-vh-100 bg-light py-5">
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-md-8 col-lg-6">
                        <div className="card border-0 shadow">
                            <div className="card-header bg-dark text-white p-4">
                                <span className="text-danger fw-bold small">PAYMENT</span>
                                <h1 className="h3 fw-bold mt-2 mb-0">Membership Payment</h1>
                            </div>

                            <div className="card-body p-4">
                                <div className="bg-light rounded p-3 mb-4">
                                    <div className="d-flex justify-content-between">
                                        <span className="text-secondary">Plan</span>
                                        <strong>{plan.name}</strong>
                                    </div>
                                    <div className="d-flex justify-content-between mt-2">
                                        <span className="text-secondary">Duration</span>
                                        <strong>{plan.duration}</strong>
                                    </div>
                                    <div className="d-flex justify-content-between mt-2">
                                        <span className="text-secondary">Amount</span>
                                        <strong className="text-danger fs-4">₱{plan.price}</strong>
                                    </div>
                                </div>

                                <p className="text-secondary small">Account: {user?.email}</p>

                                <form onSubmit={handleSubmit}>
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">Member Name</label>
                                        <input
                                            className="form-control form-control-lg"
                                            type="text"
                                            placeholder="Enter your full name"
                                            value={memberName}
                                            onChange={(e) => setMemberName(e.target.value)}
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="form-label fw-semibold">Payment Method</label>
                                        <select
                                            className="form-select form-select-lg"
                                            value={paymentMethod}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                        >
                                            <option value="Cash">Cash</option>
                                            <option value="GCash">GCash</option>
                                        </select>
                                    </div>

                                    <button className="btn btn-danger btn-lg w-100" type="submit" disabled={submitting}>
                                        {submitting ? "Submitting..." : "Submit Payment"}
                                    </button>
                                </form>

                                <button className="btn btn-link text-secondary w-100 mt-2" onClick={() => navigate("/member")}>
                                    Back to Dashboard
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
