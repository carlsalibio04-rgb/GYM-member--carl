
import { useEffect, useState } from "react";

const PLANS_URL = "http://localhost:8080/api/plans";
const API_URL = "http://localhost:8080/api/payments";

const emptyForm = {
    uid: "",
    name: "",
    email: "",
    plan: "",
    amount: "",
    duration: "",
    additionalDays: "0",
    paymentMethod: "Cash",
    status: "Pending"
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

export default function FrontDesk({ user }) {
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

            const response = await fetch(API_URL);

            if (!response.ok) {
                throw new Error("Server error " + response.status);
            }

            const data = await response.json();

            setPayments(
                [...data].sort((a, b) => Number(b.id) - Number(a.id))
            );
        } catch (error) {
            console.error("Failed to load payments:", error);
            alert("Hindi ma-load ang payment records.");
        } finally {
            setLoading(false);
        }
    };

    const loadPlans = async () => {
        try {
            const response = await fetch(PLANS_URL);

            if (!response.ok) {
                throw new Error("Failed to load plans.");
            }

            setPlans(await response.json());
        } catch (error) {
            console.error("Plan error:", error);
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

    const getBaseDays = (planName) => {
        const selected = plans.find(
            (plan) => plan.name.toLowerCase() === planName.toLowerCase()
        );

        if (selected) {
            return parseInt(selected.duration, 10) || 0;
        }

        return 0;
    };

    const getTotalDays = () => {
        const baseDays = parseInt(form.duration, 10) || 0;
        const extraDays = parseInt(form.additionalDays, 10) || 0;

        return baseDays + extraDays;
    };

    const openAdd = () => {
        setForm({
            ...emptyForm,
            name: "",
            email: "",
            plan: plans[0]?.name || "",
            amount: plans[0]?.price?.toString() || "",
            duration: plans[0]?.duration || ""
        });

        setEditing(null);
        setModalMode("add");
    };

    const openEdit = (payment) => {
        const totalDays = Number(
            payment.durationDays || parseInt(payment.duration, 10) || 0
        );

        const baseDays = getBaseDays(payment.plan);
        const extraDays = Math.max(0, totalDays - baseDays);

        setForm({
            uid: payment.uid || "",
            name: payment.name || "",
            email: payment.email || "",
            plan: payment.plan || "",
            amount: payment.amount ?? "",
            duration: baseDays > 0
                ? `${baseDays} Days`
                : `${totalDays} Days`,
            additionalDays: extraDays.toString(),
            paymentMethod: payment.paymentMethod || "Cash",
            status: payment.status || "Pending"
        });

        setEditing(payment);
        setModalMode("edit");
    };

    const closeModal = () => {
        setModalMode(null);
        setEditing(null);
        setForm(emptyForm);
    };

    const handlePlanChange = (planName) => {
        const selected = plans.find(
            (plan) => plan.name === planName
        );

        setForm((previous) => ({
            ...previous,
            plan: planName,
            amount: selected ? selected.price.toString() : previous.amount,
            duration: selected ? selected.duration : previous.duration
        }));
    };

    const handleSave = async (e) => {
        e.preventDefault();

        if (!form.uid.trim()) {
            alert("Kailangan ang Member UID. Hindi maaaring iwanang blanko.");
            return;
        }

        if (!form.name.trim() || !form.email.trim() || !form.plan) {
            alert("Pakikumpleto ang member details at plan.");
            return;
        }

        const amount = Number(form.amount);
        const totalDays = getTotalDays();

        if (!Number.isFinite(amount) || amount <= 0) {
            alert("Invalid payment amount.");
            return;
        }

        if (!Number.isInteger(totalDays) || totalDays <= 0) {
            alert("Invalid membership duration.");
            return;
        }

        const data = {
            uid: form.uid.trim(),
            name: form.name.trim(),
            email: form.email.trim(),
            plan: form.plan,
            amount,
            durationDays: totalDays,
            duration: `${totalDays} Days`,
            paymentMethod: form.paymentMethod,
            status: form.status
        };

        try {
            setSaving(true);

            const url = modalMode === "add"
                ? API_URL
                : `${API_URL}/${editing.id}`;

            const response = await fetch(url, {
                method: modalMode === "add" ? "POST" : "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Failed to save payment.");
            }

            alert(
                `Payment saved! Total membership duration: ${totalDays} days.`
            );

            closeModal();
            await loadPayments();
        } catch (error) {
            console.error("Save error:", error);
            alert(error.message);
        } finally {
            setSaving(false);
        }
    };

    const deletePayment = async (payment) => {
        if (!window.confirm(`Delete the payment record of ${payment.name}?`)) {
            return;
        }

        try {
            const response = await fetch(`${API_URL}/${payment.id}`, {
                method: "DELETE"
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Delete failed.");
            }

            alert("Payment deleted.");
            await loadPayments();
        } catch (error) {
            console.error("Delete error:", error);
            alert(error.message);
        }
    };

    const approvePayment = async (payment) => {
        if (!window.confirm(`Approve payment of ${payment.name}?`)) {
            return;
        }

        try {
            const response = await fetch(
                `${API_URL}/${payment.id}/status`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ status: "Approved" })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Approval failed.");
            }

            alert("Payment approved successfully!");
            await loadPayments();
        } catch (error) {
            console.error("Approval error:", error);
            alert(error.message);
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
            <main className="container py-4 py-lg-5">
                <div className="mb-4">
                    <h1 className="fw-bold mb-1">Front Desk</h1>
                    <p className="text-secondary mb-0">
                        Signed in as {user?.email}
                    </p>
                </div>

                <div className="row g-4 mb-5">
                    <div className="col-md-4">
                        <div className="card border-0 shadow-sm h-100">
                            <div className="card-body">
                                <span className="text-secondary small">PENDING</span>
                                <div className="display-6 fw-bold text-danger mt-2">
                                    {pendingCount}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-4">
                        <div className="card border-0 shadow-sm h-100">
                            <div className="card-body">
                                <span className="text-secondary small">APPROVED</span>
                                <div className="display-6 fw-bold text-success mt-2">
                                    {approvedCount}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-4">
                        <div className="card border-0 shadow-sm h-100">
                            <div className="card-body">
                                <span className="text-secondary small">
                                    EXPIRED MEMBERSHIPS
                                </span>
                                <div className="display-6 fw-bold mt-2">
                                    {expiredCount}
                                </div>
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
                        <div className="spinner-border text-danger" />
                        <p className="text-secondary mt-3">
                            Loading payment records...
                        </p>
                    </div>
                ) : filteredPayments.length === 0 ? (
                    <div className="alert alert-secondary">
                        No payment records found.
                    </div>
                ) : (
                    <div className="table-responsive bg-white rounded shadow-sm">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-dark">
                                <tr>
                                    <th>Member</th>
                                    <th>Plan</th>
                                    <th>Days</th>
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
                                                <small className="d-block text-secondary">
                                                    {payment.email || "—"}
                                                </small>
                                            </td>
                                            <td>{payment.plan}</td>
                                            <td>{payment.durationDays || "—"} days</td>
                                            <td>₱{payment.amount}</td>
                                            <td>{payment.paymentMethod || "—"}</td>
                                            <td>
                                                <span className={`badge ${
                                                    payment.status === "Approved"
                                                        ? "text-bg-success"
                                                        : "text-bg-warning"
                                                }`}>
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
                                                    <span className={`badge font-monospace ${
                                                        timeLeft.expired
                                                            ? "text-bg-danger"
                                                            : timeLeft.urgent
                                                                ? "text-bg-warning"
                                                                : "text-bg-success"
                                                    }`}>
                                                        {timeLeft.text}
                                                    </span>
                                                ) : "—"}
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
                                            <label className="form-label fw-semibold">
                                                Member UID
                                            </label>
                                            <input
                                                className="form-control"
                                                value={form.uid}
                                                onChange={(e) =>
                                                    setForm({ ...form, uid: e.target.value })
                                                }
                                                placeholder="Enter member Firebase UID"
                                                required
                                            />
                                            <small className="text-secondary">
                                                Kailangan ang UID para maiugnay ang membership sa account.
                                            </small>
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label fw-semibold">
                                                Member Name
                                            </label>
                                            <input
                                                className="form-control"
                                                value={form.name}
                                                onChange={(e) =>
                                                    setForm({ ...form, name: e.target.value })
                                                }
                                                required
                                            />
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label fw-semibold">
                                                Email
                                            </label>
                                            <input
                                                className="form-control"
                                                type="email"
                                                value={form.email}
                                                onChange={(e) =>
                                                    setForm({ ...form, email: e.target.value })
                                                }
                                                required
                                            />
                                        </div>

                                        <div className="row g-3 mb-3">
                                            <div className="col-md-6">
                                                <label className="form-label fw-semibold">
                                                    Plan
                                                </label>

                                                <select
                                                    className="form-select"
                                                    value={form.plan}
                                                    onChange={(e) =>
                                                        handlePlanChange(e.target.value)
                                                    }
                                                    required
                                                >
                                                    <option value="">Select plan</option>
                                                    {plans.map((plan) => (
                                                        <option key={plan.id} value={plan.name}>
                                                            {plan.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="col-md-6">
                                                <label className="form-label fw-semibold">
                                                    Base Duration
                                                </label>
                                                <input
                                                    className="form-control"
                                                    value={form.duration}
                                                    readOnly
                                                />
                                            </div>
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label fw-semibold">
                                                Additional Days
                                            </label>
                                            <input
                                                className="form-control"
                                                type="number"
                                                min="0"
                                                step="1"
                                                value={form.additionalDays}
                                                onChange={(e) =>
                                                    setForm({
                                                        ...form,
                                                        additionalDays: e.target.value
                                                    })
                                                }
                                            />
                                            <small className="text-secondary">
                                                Dagdag na araw sa napiling membership plan.
                                            </small>
                                        </div>

                                        <div className="alert alert-info">
                                            **Total Membership: {getTotalDays()} Days**
                                        </div>

                                        <div className="row g-3">
                                            <div className="col-md-4">
                                                <label className="form-label fw-semibold">
                                                    Amount
                                                </label>
                                                <input
                                                    className="form-control"
                                                    type="number"
                                                    min="1"
                                                    value={form.amount}
                                                    onChange={(e) =>
                                                        setForm({ ...form, amount: e.target.value })
                                                    }
                                                    required
                                                />
                                            </div>

                                            <div className="col-md-4">
                                                <label className="form-label fw-semibold">
                                                    Method
                                                </label>
                                                <select
                                                    className="form-select"
                                                    value={form.paymentMethod}
                                                    onChange={(e) =>
                                                        setForm({
                                                            ...form,
                                                            paymentMethod: e.target.value
                                                        })
                                                    }
                                                >
                                                    <option value="Cash">Cash</option>
                                                    <option value="GCash">GCash</option>
                                                </select>
                                            </div>

                                            <div className="col-md-4">
                                                <label className="form-label fw-semibold">
                                                    Status
                                                </label>
                                                <select
                                                    className="form-select"
                                                    value={form.status}
                                                    onChange={(e) =>
                                                        setForm({ ...form, status: e.target.value })
                                                    }
                                                >
                                                    <option value="Pending">Pending</option>
                                                    <option value="Approved">Approved</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="modal-footer">
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary"
                                            onClick={closeModal}
                                        >
                                            Cancel
                                        </button>

                                        <button
                                            type="submit"
                                            className="btn btn-danger"
                                            disabled={saving}
                                        >
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
