import { useEffect, useState } from "react";

const API_URL = "https://gym-member-carl.onrender.com/api/plans";

export default function PriceEdit({ user, onLogout }) {
    const [plans, setPlans] = useState([]);
    const [prices, setPrices] = useState({});
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState(null);
    const [error, setError] = useState("");

    // LOAD MEMBERSHIP PLANS
    const loadPlans = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await fetch(API_URL);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to load plans.");
            }

            setPlans(data);

            const priceData = {};

            data.forEach((plan) => {
                priceData[plan.id] = plan.price;
            });

            setPrices(priceData);

        } catch (err) {
            console.error("LOAD PLANS ERROR:", err);
            setError("Unable to load membership plans.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPlans();
    }, []);

    // HANDLE PRICE INPUT
    const handlePriceChange = (id, value) => {
        setPrices((prev) => ({
            ...prev,
            [id]: value,
        }));
    };

    // SAVE UPDATED PRICE
    const savePrice = async (plan) => {
        const newPrice = Number(prices[plan.id]);

        if (!Number.isFinite(newPrice) || newPrice <= 0) {
            setError("Please enter a valid price.");
            return;
        }

        try {
            setSavingId(plan.id);
            setError("");

            const response = await fetch(`${API_URL}/${plan.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    price: newPrice,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to update price.");
            }

            await loadPlans();

            alert("Membership price updated successfully!");

        } catch (err) {
            console.error("PRICE UPDATE ERROR:", err);
            setError(err.message || "Unable to update price.");
        } finally {
            setSavingId(null);
        }
    };

    return (
        <div className="container py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-bold">Membership Price Management</h2>
                    <p className="text-muted mb-0">
                        Update the prices of your membership plans.
                    </p>
                </div>

                {onLogout && (
                    <button
                        className="btn btn-outline-danger"
                        onClick={onLogout}
                    >
                        Logout
                    </button>
                )}
            </div>

            {error && (
                <div className="alert alert-danger">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="text-center py-5">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2">Loading membership plans...</p>
                </div>
            ) : plans.length === 0 ? (
                <div className="alert alert-warning">
                    No membership plans found.
                </div>
            ) : (
                <div className="row g-3">
                    {plans.map((plan) => (
                        <div className="col-md-6 col-lg-4" key={plan.id}>
                            <div className="card shadow-sm h-100">
                                <div className="card-body">
                                    <h4 className="fw-bold">
                                        {plan.name}
                                    </h4>

                                    <p className="text-muted">
                                        Duration: {plan.duration}
                                    </p>

                                    <label className="form-label fw-semibold">
                                        Membership Price (₱)
                                    </label>

                                    <input
                                        type="number"
                                        className="form-control mb-3"
                                        min="1"
                                        step="0.01"
                                        value={prices[plan.id] ?? ""}
                                        onChange={(e) =>
                                            handlePriceChange(
                                                plan.id,
                                                e.target.value
                                            )
                                        }
                                    />

                                    <button
                                        className="btn btn-primary w-100"
                                        onClick={() => savePrice(plan)}
                                        disabled={savingId === plan.id}
                                    >
                                        {savingId === plan.id
                                            ? "Saving..."
                                            : "Save Price"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <button
                className="btn btn-secondary mt-4"
                onClick={loadPlans}
                disabled={loading || savingId !== null}
            >
                Refresh Plans
            </button>
        </div>
    );
}