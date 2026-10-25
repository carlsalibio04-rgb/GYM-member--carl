import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API_URL = "https://gym-member-carl.onrender.com/api/plans";

export default function PriceEdit({ user, onLogout }) {
    const [plans, setPlans] = useState([]);
    const [prices, setPrices] = useState({});
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState(null);
    const [error, setError] = useState("");

    const loadPlans = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await fetch(API_URL);

            if (!response.ok) {
                throw new Error("Failed to load membership plans.");
            }

            const data = await response.json();
            setPlans(data);
            setPrices(
                Object.fromEntries(data.map((plan) => [plan.id, plan.price]))
            );
        } catch (err) {
            console.error("PLAN ERROR:", err);
            setError("Unable to load membership plans. Make sure the backend server is running.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPlans();
    }, []);

    const savePrice = async (plan) => {
        const newPrice = Number(prices[plan.id]);

        if (!newPrice || newPrice <= 0) {
            alert("Please enter a valid price.");
            return;
        }

        try {
            setSavingId(plan.id);

            const response = await fetch(`${API_URL}/${plan.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ price: newPrice })
            });

            if (!response.ok) {
                let message = `Server returned ${response.status}.`;

                try {
                    const body = await response.json();
                    if (body.message) message = body.message;
                } catch {
                    message += " Restart the backend (node server.js) so it uses the updated server.js.";
                }

                throw new Error(message);
            }

            alert(`${plan.name} price updated to ₱${newPrice}!`);
            loadPlans();
        } catch (err) {
            console.error("Price update error:", err);

            if (err instanceof TypeError) {
                alert("Unable to reach the backend. Make sure it is running on port 8080.");
            } else {
                alert("Unable to update price: " + err.message);
            }
        } finally {
            setSavingId(null);
        }
    };

    return (
        <div className="bg-light min-vh-100">
            <nav className="navbar navbar-dark bg-dark shadow-sm">
                <div className="container">
                    <div>
                        <span className="navbar-brand fw-bold">MOMENTUM GYM</span>
                        <span className="badge text-bg-danger ms-2">ADMIN</span>
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
                    <h1 className="fw-bold mb-1">Price Edit</h1>
                    <p className="text-secondary mb-0">Signed in as {user?.email}</p>
                </div>

                <div className="mb-3">
                    <span className="text-danger fw-bold small">MANAGEMENT</span>
                    <h2 className="h3 fw-bold mt-1 mb-0">Membership Plan Prices</h2>
                </div>

                {loading && (
                    <div className="text-center py-5">
                        <div className="spinner-border text-danger" role="status" />
                        <p className="text-secondary mt-3">Loading membership plans...</p>
                    </div>
                )}

                {!loading && error && (
                    <div className="alert alert-warning">{error}</div>
                )}

                {!loading && !error && plans.length === 0 && (
                    <div className="alert alert-secondary">No membership plans found.</div>
                )}

                {!loading && !error && plans.length > 0 && (
                    <div className="table-responsive bg-white rounded shadow-sm">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-dark">
                                <tr>
                                    <th>Plan</th>
                                    <th>Duration</th>
                                    <th>Current Price</th>
                                    <th>New Price</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {plans.map((plan) => (
                                    <tr key={plan.id}>
                                        <td><strong>{plan.name}</strong></td>
                                        <td>{plan.duration}</td>
                                        <td className="text-danger fw-bold">₱{plan.price}</td>
                                        <td style={{ maxWidth: 180 }}>
                                            <div className="input-group">
                                                <span className="input-group-text">₱</span>
                                                <input
                                                    className="form-control"
                                                    type="number"
                                                    min="1"
                                                    value={prices[plan.id] ?? ""}
                                                    onChange={(e) =>
                                                        setPrices({ ...prices, [plan.id]: e.target.value })
                                                    }
                                                />
                                            </div>
                                        </td>
                                        <td>
                                            <button
                                                className="btn btn-sm btn-danger"
                                                disabled={
                                                    savingId === plan.id ||
                                                    Number(prices[plan.id]) === plan.price
                                                }
                                                onClick={() => savePrice(plan)}
                                            >
                                                {savingId === plan.id ? "Saving..." : "Save"}
                                            </button>
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
