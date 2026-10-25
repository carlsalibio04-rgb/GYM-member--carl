import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    orderBy,
    query,
    serverTimestamp,
    updateDoc
} from "firebase/firestore";

import { db } from "../lib/firebase.js";

const PLANS_URL = "https://gym-member-carl.onrender.com/api/plans";

const emptyForm = {
    name: "",
    email: "",
    plan: "",
    amount: "",
    duration: "",
    paymentMethod: "Cash",
    status: "Approved"
};

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

const buildDates = (duration, startISO) => {
    const days = parseInt(duration, 10);

    if (Number.isNaN(days)) return {};

    const startDate = startISO ? new Date(startISO) : new Date();
    const expirationDate = new Date(startDate);
    expirationDate.setDate(expirationDate.getDate() + days);

    return {
        startDate: startDate.toISOString(),
        expirationDate: expirationDate.toISOString()
    };
};

export default function FrontDesk({ user, onLogout }) {
    const [payments, setPayments] = useState([]);
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [now, setNow] = useState(Date.now());

    const [modalMode, setModalMode] = useState(null);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);

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

    const loadPlans = async () => {
        try {
            const response = await fetch(PLANS_URL);

            if (!response.ok) {
                throw new Error("Failed to load membership plans.");
            }

            setPlans(await response.json());
        } catch (error) {
            console.error("PLAN ERROR:", error);
        }
    };

    useEffect(() => {
        loadPayments();
        loadPlans();
    }, []);

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);

    // ==========================================
    // POST - add a walk-in payment
    // ==========================================
    const openAdd = () => {
        setForm(emptyForm);
        setEditing(null);
        setModalMode("add");
    };

    // ==========================================
    // PUT - edit a payment record
    // ==========================================
    const openEdit = (payment) => {
        setForm({
            name: payment.name || "",
            email: payment.email || "",
            plan: payment.plan || "",
            amount: payment.amount ?? "",
            duration: payment.duration || "",
            paymentMethod: payment.paymentMethod || "Cash",
            status: payment.status || "Pending"
        });
        setEditing(payment);
        setModalMode("edit");
    };

    const closeModal = () => {
        setModalMode(null);
        setEditing(null);
    };

    const handlePlanChange = (planName) => {
        const selected = plans.find((plan) => plan.name === planName);

        setForm({
            ...form,
            plan: planName,
            amount: selected ? selected.price : form.amount,
            duration: selected ? selected.duration : form.duration
        });
    };

    const handleSave = async (e) => {
        e.preventDefault();

        if (!form.name.trim()) {
            alert("Please enter the member name.");
            return;
        }

        if (!form.plan || !Number(form.amount) || Number(form.amount) <= 0) {
            alert("Please choose a plan and enter a valid amount.");
            return;
        }

        const data = {
            name: form.name.trim(),
            email: form.email.trim(),
            plan: form.plan,
            amount: Number(form.amount),
            duration: form.duration,
            paymentMethod: form.paymentMethod,
            status: form.status
        };

        if (form.status === "Approved") {
            Object.assign(data, buildDates(form.duration, editing?.startDate));
        } else if (modalMode === "edit") {
            data.startDate = null;
            data.expirationDate = null;
        }

        try {
            setSaving(true);

            if (modalMode === "add") {
                await addDoc(collection(db, "payments"), {
                    ...data,
                    uid: null,
                    createdAt: serverTimestamp()
                });
                alert("Payment added successfully!");
            } else {
                await updateDoc(doc(db, "payments", editing.id), data);
                alert("Payment updated successfully!");
            }

            closeModal();
            loadPayments();
        } catch (error) {
            console.error("Save error:", error);
            alert("Unable to save payment: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    // ==========================================
    // DELETE - remove a payment record
    // ==========================================
    const deletePayment = async (payment) => {
        if (!window.confirm(`Delete the payment record of ${payment.name}?`)) {
            return;
        }

        try {
            await deleteDoc(doc(db, "payments", payment.id));
            alert("Payment deleted successfully!");
            loadPayments();
        } catch (error) {
            console.error("Delete error:", error);
            alert("Unable to delete payment: " + error.message);
        }
    };

    const approvePayment = async (payment) => {
        try {
            await updateDoc(doc(db, "payments", payment.id), {
                status: "Approved",
                ...buildDates(payment.duration, null)
            });

            alert("Payment approved successfully!");
            loadPayments();
        } catch (error) {
            console.error("Approval error:", error);
            alert("Unable to approve payment: " + error.message);
        }
    };

    const isExpired = (payment) =>
        payment.status === "Approved" &&
        getTimeLeft(payment.expirationDate, now)?.expired === true;

    const pendingCount = payments.filter(
        (payment) => payment.status === "Pending"
    ).length;

    const approvedCount = payments.filter(
        (payment) => payment.status === "Approved"
    ).length;

    const expiredCount = payments.filter(isExpired).length;

    const keyword = search.trim().toLowerCase();

    const filteredPayments = payments.filter((payment) => {
        const matchesSearch =
            !keyword ||
            (payment.name || "").toLowerCase().includes(keyword) ||
            (payment.email || "").toLowerCase().includes(keyword);

        const matchesStatus =
            statusFilter === "All" ||
            (statusFilter === "Expired"
                ? isExpired(payment)
                : payment.status === statusFilter);

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="bg-light min-vh-100">
            <nav className="navbar navbar-dark bg-dark shadow-sm">
                <div className="container">
                    <div>
                        <span className="navbar-brand fw-bold">MOMENTUM GYM</span>
                        <span className="badge text-bg-danger ms-2">FRONT DESK</span>
                    </div>
                    <div className="d-flex gap-2">
                        <Link className="btn btn-outline-light btn-sm" to="/admin">
                            Back
                        </Link>
                        <button className="btn btn-outline-light btn-sm" onClick={onLogout}>
                            Logout
                        </button>
                    </div>
                </div>
            </nav>

            <main className="container py-4 py-lg-5">
                <div className="mb-4">
                    <h1 className="fw-bold mb-1">Front Desk</h1>
                    <p className="text-secondary mb-0">Signed in as {user?.email}</p>
                </div>

                <div className="row g-4 mb-5">
                    <div className="col-md-4">
                        <div className="card border-0 shadow-sm h-100">
                            <div className="card-body">
                                <span className="text-secondary small">PENDING</span>
                                <div className="display-6 fw-bold text-danger mt-2">{pendingCount}</div>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="card border-0 shadow-sm h-100">
                            <div className="card-body">
                                <span className="text-secondary small">APPROVED</span>
                                <div className="display-6 fw-bold text-success mt-2">{approvedCount}</div>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="card border-0 shadow-sm h-100">
                            <div className="card-body">
                                <span className="text-secondary small">EXPIRED MEMBERSHIPS</span>
                                <div className="display-6 fw-bold mt-2">{expiredCount}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-3">
                    <div>
                        <span className="text-danger fw-bold small">MANAGEMENT</span>
                        <h2 className="h3 fw-bold mt-1 mb-0">Payment Records</h2>
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                        <input
                            className="form-control w-auto"
                            type="text"
                            placeholder="Search name or email"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <select
                            className="form-select w-auto"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="All">All Payments</option>
                            <option value="Pending">Pending</option>
                            <option value="Approved">Approved</option>
                            <option value="Expired">Expired</option>
                        </select>
                        <button className="btn btn-danger" onClick={openAdd}>
                            + Add Payment
                        </button>
                    </div>
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
                                    <th>Status</th>
                                    <th>Expiration</th>
                                    <th>Time Left</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPayments.map((payment) => {
                                    const timeLeft =
                                        payment.status === "Approved"
                                            ? getTimeLeft(payment.expirationDate, now)
                                            : null;

                                    return (
                                        <tr key={payment.id}>
                                            <td>
                                                <strong>{payment.name}</strong>
                                                <small className="d-block text-secondary">{payment.email || "—"}</small>
                                            </td>
                                            <td>{payment.plan}</td>
                                            <td>₱{payment.amount}</td>
                                            <td>{payment.paymentMethod || "—"}</td>
                                            <td>
                                                <span className={`badge ${payment.status === "Approved" ? "text-bg-success" : "text-bg-warning"}`}>
                                                    {payment.status}
                                                </span>
                                            </td>
                                            <td>
                                                {payment.expirationDate
                                                    ? new Date(payment.expirationDate).toLocaleDateString()
                                                    : "—"}
                                            </td>
                                            <td>
                                                {timeLeft ? (
                                                    <span
                                                        className={`badge font-monospace ${
                                                            timeLeft.expired
                                                                ? "text-bg-danger"
                                                                : timeLeft.urgent
                                                                    ? "text-bg-warning"
                                                                    : "text-bg-success"
                                                        }`}
                                                    >
                                                        {timeLeft.text}
                                                    </span>
                                                ) : (
                                                    "—"
                                                )}
                                            </td>
                                            <td>
                                                <div className="d-flex flex-wrap gap-1">
                                                    {payment.status === "Pending" && (
                                                        <button
                                                            className="btn btn-sm btn-success"
                                                            onClick={() => approvePayment(payment)}
                                                        >
                                                            Approve
                                                        </button>
                                                    )}
                                                    <button
                                                        className="btn btn-sm btn-outline-dark"
                                                        onClick={() => openEdit(payment)}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={() => deletePayment(payment)}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>

            {modalMode && (
                <>
                    <div className="modal d-block" tabIndex="-1" role="dialog">
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content border-0 shadow">
                                <form onSubmit={handleSave}>
                                    <div className="modal-header bg-dark text-white">
                                        <h5 className="modal-title fw-bold">
                                            {modalMode === "add" ? "Add Payment" : "Edit Payment"}
                                        </h5>
                                        <button
                                            type="button"
                                            className="btn-close btn-close-white"
                                            onClick={closeModal}
                                        />
                                    </div>

                                    <div className="modal-body p-4">
                                        <div className="mb-3">
                                            <label className="form-label fw-semibold">Member Name</label>
                                            <input
                                                className="form-control"
                                                type="text"
                                                value={form.name}
                                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                            />
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label fw-semibold">Email</label>
                                            <input
                                                className="form-control"
                                                type="email"
                                                value={form.email}
                                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                            />
                                        </div>

                                        <div className="row g-3 mb-3">
                                            <div className="col-md-6">
                                                <label className="form-label fw-semibold">Plan</label>
                                                {plans.length > 0 ? (
                                                    <select
                                                        className="form-select"
                                                        value={form.plan}
                                                        onChange={(e) => handlePlanChange(e.target.value)}
                                                    >
                                                        <option value="">Select plan</option>
                                                        {plans.map((plan) => (
                                                            <option key={plan.id} value={plan.name}>
                                                                {plan.name}
                                                            </option>
                                                        ))}
                                                        {form.plan && !plans.some((plan) => plan.name === form.plan) && (
                                                            <option value={form.plan}>{form.plan}</option>
                                                        )}
                                                    </select>
                                                ) : (
                                                    <input
                                                        className="form-control"
                                                        type="text"
                                                        placeholder="e.g. Monthly"
                                                        value={form.plan}
                                                        onChange={(e) => setForm({ ...form, plan: e.target.value })}
                                                    />
                                                )}
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label fw-semibold">Duration</label>
                                                <input
                                                    className="form-control"
                                                    type="text"
                                                    placeholder="e.g. 30 Days"
                                                    value={form.duration}
                                                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="row g-3">
                                            <div className="col-md-4">
                                                <label className="form-label fw-semibold">Amount</label>
                                                <input
                                                    className="form-control"
                                                    type="number"
                                                    min="1"
                                                    value={form.amount}
                                                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                                />
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label fw-semibold">Method</label>
                                                <select
                                                    className="form-select"
                                                    value={form.paymentMethod}
                                                    onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                                                >
                                                    <option value="Cash">Cash</option>
                                                    <option value="GCash">GCash</option>
                                                </select>
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label fw-semibold">Status</label>
                                                <select
                                                    className="form-select"
                                                    value={form.status}
                                                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                                                >
                                                    <option value="Pending">Pending</option>
                                                    <option value="Approved">Approved</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="modal-footer">
                                        <button type="button" className="btn btn-outline-secondary" onClick={closeModal}>
                                            Cancel
                                        </button>
                                        <button type="submit" className="btn btn-danger" disabled={saving}>
                                            {saving ? "Saving..." : "Save"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop show" />
                </>
            )}
        </div>
    );
}
