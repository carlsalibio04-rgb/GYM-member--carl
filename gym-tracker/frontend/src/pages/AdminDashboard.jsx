
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase.js";
import "./AdminDashboard.css";

const API_URL = "http://localhost:8080/api/payments";

const getTimeLeft = (expirationDate, now) => {
    if (!expirationDate) return null;

    const diff = new Date(expirationDate).getTime() - now;

    if (Number.isNaN(diff)) return null;

    if (diff <= 0) {
        return {
            expired: true,
            urgent: true,
            text: "Expired"
        };
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
    const [members, setMembers] = useState([]);

    const [loading, setLoading] = useState(true);
    const [membersLoading, setMembersLoading] = useState(true);

    const [now, setNow] = useState(Date.now());
    const [searchParams] = useSearchParams();

    const [statusFilter, setStatusFilter] = useState("All");
    const [showMembers, setShowMembers] = useState(false);
    const [memberSearch, setMemberSearch] = useState("");

    // Update countdown every second
    useEffect(() => {
        const timer = setInterval(() => {
            setNow(Date.now());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (searchParams.get("view") === "members") {
            setShowMembers(true);
        }
    }, [searchParams]);

    // ==========================================
    // LOAD ALL REGISTERED MEMBERS FROM FIRESTORE
    // ==========================================

    const loadMembers = async () => {
        try {
            setMembersLoading(true);

            const usersSnapshot = await getDocs(
                collection(db, "users")
            );

            const registeredUsers = usersSnapshot.docs
                .map((document) => ({
                    id: document.id,
                    ...document.data()
                }))
                .filter((member) => member.role === "member");

            setMembers(registeredUsers);

        } catch (error) {
            console.error("Failed to load members:", error);
                    } finally {
            setMembersLoading(false);
        }
    };

    // ==========================================
    // LOAD PAYMENT RECORDS FROM MYSQL
    // ==========================================

    const loadPayments = async () => {
        try {
            setLoading(true);

            const response = await fetch(API_URL);

            if (!response.ok) {
                throw new Error("Server error " + response.status);
            }

            const data = await response.json();

            setPayments(
                [...data].sort(
                    (a, b) => Number(b.id) - Number(a.id)
                )
            );

        } catch (error) {
            console.error("Failed to load payments:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPayments();
        loadMembers();
    }, []);

    // ==========================================
    // GET MEMBER MEMBERSHIP INFORMATION
    // ==========================================

    const getMemberInfo = (member) => {
        const memberPayments = payments.filter(
            (payment) => payment.uid === member.uid
        );

        const approvedPayments = memberPayments
            .filter((payment) => payment.status === "Approved")
            .sort(
                (a, b) =>
                    new Date(b.expirationDate || 0) -
                    new Date(a.expirationDate || 0)
            );

        const pendingPayment = memberPayments.find(
            (payment) => payment.status === "Pending"
        );

        const latestApproved = approvedPayments[0];

        if (latestApproved) {
            const timeLeft = getTimeLeft(
                latestApproved.expirationDate,
                now
            );

            return {
                plan: latestApproved.plan,
                membershipStatus: timeLeft?.expired
                    ? "Expired"
                    : "Active"
            };
        }

        if (pendingPayment) {
            return {
                plan: pendingPayment.plan,
                membershipStatus: "Pending"
            };
        }

        return {
            plan: "No Plan",
            membershipStatus: "No Membership"
        };
    };

    // ==========================================
    // SEARCH MEMBERS
    // ==========================================

    const filteredMembers = members.filter((member) => {
        const keyword = memberSearch.trim().toLowerCase();

        return (
            !keyword ||
            (member.name || "").toLowerCase().includes(keyword) ||
            (member.email || "").toLowerCase().includes(keyword)
        );
    });

    // ==========================================
    // APPROVE PAYMENT
    // ==========================================

    const approvePayment = async (payment) => {
                try {
            const response = await fetch(
                `${API_URL}/${payment.id}/status`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        status: "Approved"
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Approval failed."
                );
            }

            
            await loadPayments();

        } catch (error) {
            console.error("Approval error:", error);
                    }
    };

    // ==========================================
    // PAYMENT STATISTICS
    // ==========================================

    const totalPayments = payments.reduce(
        (total, payment) =>
            total + Number(payment.amount || 0),
        0
    );

    const pendingPayments = payments.filter(
        (payment) => payment.status === "Pending"
    ).length;

    const approvedPayments = payments.filter(
        (payment) => payment.status === "Approved"
    ).length;

    const filteredPayments =
        statusFilter === "All"
            ? payments
            : payments.filter(
                (payment) => payment.status === statusFilter
            );

    // ==========================================
    // DASHBOARD UI
    // ==========================================

    return (
        <div className="bg-light min-vh-100">

            <main className="admin-main container-fluid py-4 py-lg-5">

                <div className="mb-4">
                    <h1 className="fw-bold mb-1">
                        Admin Dashboard
                    </h1>

                    <p className="text-secondary mb-0">
                        Signed in as {user?.email}
                    </p>
                </div>

                {/* PAYMENT STATISTICS */}

                <div className="row g-4 mb-5">

                    <div className="col-md-4">
                        <div className="card border-0 shadow-sm h-100">
                            <div className="card-body">
                                <span className="text-secondary small">
                                    TOTAL PAYMENTS
                                </span>

                                <div className="display-6 fw-bold text-danger mt-2">
                                    ₱{totalPayments}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-4">
                        <div className="card border-0 shadow-sm h-100">
                            <div className="card-body">
                                <span className="text-secondary small">
                                    PENDING
                                </span>

                                <div className="display-6 fw-bold mt-2">
                                    {pendingPayments}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-4">
                        <div className="card border-0 shadow-sm h-100">
                            <div className="card-body">
                                <span className="text-secondary small">
                                    APPROVED
                                </span>

                                <div className="display-6 fw-bold text-success mt-2">
                                    {approvedPayments}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* PAYMENT RECORDS */}

                <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">

                    <div>
                        <span className="text-danger fw-bold small">
                            MANAGEMENT
                        </span>

                        <h2 className="h3 fw-bold mt-1 mb-0">
                            Payment Records
                        </h2>
                    </div>

                    <select
                        className="form-select w-auto"
                        value={statusFilter}
                        onChange={(e) =>
                            setStatusFilter(e.target.value)
                        }
                    >
                        <option value="All">All Payments</option>
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                    </select>

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

                                            <small className="d-block text-secondary">
                                                {payment.email}
                                            </small>
                                        </td>

                                        <td>{payment.plan}</td>

                                        <td>₱{payment.amount}</td>

                                        <td>
                                            {payment.paymentMethod || "—"}
                                        </td>

                                        <td>
                                            {payment.duration || "—"}
                                        </td>

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
                                            {(() => {
                                                const timeLeft =
                                                    payment.status === "Approved"
                                                        ? getTimeLeft(
                                                            payment.expirationDate,
                                                            now
                                                        )
                                                        : null;

                                                if (!timeLeft) return "—";

                                                return (
                                                    <span className={`badge font-monospace ${
                                                        timeLeft.expired
                                                            ? "text-bg-danger"
                                                            : timeLeft.urgent
                                                                ? "text-bg-warning"
                                                                : "text-bg-success"
                                                    }`}>
                                                        {timeLeft.text}
                                                    </span>
                                                );
                                            })()}
                                        </td>

                                        <td>
                                            {payment.status === "Pending" ? (
                                                <button
                                                    className="btn btn-sm btn-success"
                                                    onClick={() =>
                                                        approvePayment(payment)
                                                    }
                                                >
                                                    Approve
                                                </button>
                                            ) : (
                                                <span className="text-secondary small">
                                                    Completed
                                                </span>
                                            )}
                                        </td>

                                    </tr>
                                ))}
                            </tbody>

                        </table>
                    </div>
                )}

            </main>

            {/* MEMBERS MODAL */}

            {showMembers && (
                <>

                    <div className="modal d-block" tabIndex="-1" role="dialog">

                        <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">

                            <div className="modal-content border-0 shadow">

                                <div className="modal-header bg-dark text-white">

                                    <h5 className="modal-title fw-bold">
                                        Registered Members ({members.length})
                                    </h5>

                                    <button
                                        type="button"
                                        className="btn-close btn-close-white"
                                        onClick={() => setShowMembers(false)}
                                    />

                                </div>

                                <div className="modal-body p-4">

                                    <input
                                        className="form-control mb-3"
                                        type="text"
                                        placeholder="Search name or email"
                                        value={memberSearch}
                                        onChange={(e) =>
                                            setMemberSearch(e.target.value)
                                        }
                                    />

                                    {membersLoading ? (

                                        <div className="text-center py-4">
                                            <div className="spinner-border text-danger" />

                                            <p className="text-secondary mt-2">
                                                Loading members...
                                            </p>
                                        </div>

                                    ) : filteredMembers.length === 0 ? (

                                        <div className="alert alert-secondary mb-0">
                                            No members found.
                                        </div>

                                    ) : (

                                        <div className="table-responsive">

                                            <table className="table table-hover align-middle mb-0">

                                                <thead className="table-dark">
                                                    <tr>
                                                        <th>Member</th>
                                                        <th>Plan</th>
                                                        <th>Membership Status</th>
                                                    </tr>
                                                </thead>

                                                <tbody>
                                                    {filteredMembers.map((member) => {
                                                        const info = getMemberInfo(member);

                                                        return (
                                                            <tr key={member.id}>

                                                                <td>
                                                                    <strong>
                                                                        {member.name || "No Name"}
                                                                    </strong>

                                                                    <small className="d-block text-secondary">
                                                                        {member.email || "—"}
                                                                    </small>
                                                                </td>

                                                                <td>
                                                                    {info.plan}
                                                                </td>

                                                                <td>
                                                                    <span className={`badge ${
                                                                        info.membershipStatus === "Active"
                                                                            ? "text-bg-success"
                                                                            : info.membershipStatus === "Expired"
                                                                                ? "text-bg-danger"
                                                                                : info.membershipStatus === "Pending"
                                                                                    ? "text-bg-warning"
                                                                                    : "text-bg-secondary"
                                                                    }`}>
                                                                        {info.membershipStatus}
                                                                    </span>
                                                                </td>

                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>

                                            </table>

                                        </div>
                                    )}

                                </div>

                                <div className="modal-footer">

                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary"
                                        onClick={() => setShowMembers(false)}
                                    >
                                        Close
                                    </button>

                                </div>

                            </div>
                        </div>
                    </div>

                    <div className="modal-backdrop show" />

                </>
            )}

        </div>
    );
}
