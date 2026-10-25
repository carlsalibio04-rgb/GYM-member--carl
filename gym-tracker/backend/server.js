
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const PORT = proccess.env.PORT || 8080;
const app = express();

app.use(cors());
app.use(express.json());


const defaultPlans = [
    {
        id: 1,
        name: "Weekly",
        duration: "7 Days",
        price: 150
    },
    {
        id: 2,
        name: "Monthly",
        duration: "30 Days",
        price: 500
    },
    {
        id: 3,
        name: "Yearly",
        duration: "365 Days",
        price: 5000
    }
];


// Plan prices are saved to plans.json so edits survive a server restart.
const PLANS_FILE = path.join(__dirname, "plans.json");

const loadPlans = () => {
    try {
        if (fs.existsSync(PLANS_FILE)) {
            return JSON.parse(fs.readFileSync(PLANS_FILE, "utf-8"));
        }
    } catch (error) {
        console.error("Failed to read plans.json, using defaults:", error);
    }

    return defaultPlans;
};

const savePlans = () => {
    fs.writeFileSync(PLANS_FILE, JSON.stringify(membershipPlans, null, 4));
};

let membershipPlans = loadPlans();


// ==========================================
// PAYMENT RECORDS
// ==========================================

let payments = [
    {
        id: 1,
        name: "Juan Dela Cruz",
        uid: "sample-uid-001",
        email: "juan@gmail.com",
        plan: "Monthly",
        amount: 500,
        paymentMethod: "Cash",
        status: "Approved"
    },
    {
        id: 2,
        name: "Maria Santos",
        uid: "sample-uid-002",
        email: "maria@gmail.com",
        plan: "Weekly",
        amount: 150,
        paymentMethod: "GCash",
        status: "Pending"
    }
];


// ==========================================
// HOME
// ==========================================

app.get("/", (req, res) => {

    res.json({
        message:
            "Gym Membership System API is running!"
    });

});


// ==========================================
// GET MEMBERSHIP PLANS
// ==========================================

app.get("/api/plans", (req, res) => {

    res.json(membershipPlans);

});


// ==========================================
// GET PAYMENT RECORDS
// ==========================================

app.get("/api/payments", (req, res) => {

    res.json(payments);

});


// ==========================================
// SUBMIT PAYMENT
// ==========================================

app.post("/api/payments", (req, res) => {

    const newPayment = {

        id: payments.length + 1,

        name: req.body.name,

        uid: req.body.uid,

        email: req.body.email,

        plan: req.body.plan,

        amount: req.body.amount,

        paymentMethod:
            req.body.paymentMethod,

        status: "Pending"

    };

    payments.push(newPayment);

    res.status(201).json({

        message:
            "Payment submitted successfully!",

        payment: newPayment

    });

});


// ==========================================
// UPDATE PAYMENT STATUS
// ==========================================

app.patch(
    "/api/payments/:id/status",
    (req, res) => {

        const paymentId =
            Number(req.params.id);

        const { status } = req.body;

        const payment =
            payments.find(
                (payment) =>
                    payment.id === paymentId
            );

        if (!payment) {

            return res.status(404).json({

                message:
                    "Payment not found."

            });

        }

        if (
            status !== "Pending" &&
            status !== "Approved"
        ) {

            return res.status(400).json({

                message:
                    "Invalid payment status."

            });

        }

        payment.status = status;

        res.json({

            message:
                "Payment status updated successfully!",

            payment: payment

        });

    }
);


// ==========================================
// UPDATE PLAN PRICE
// ==========================================

const updatePlanPrice = (req, res) => {

    const plan = membershipPlans.find(
        (plan) => plan.id === Number(req.params.id)
    );

    if (!plan) {
        return res.status(404).json({ message: "Plan not found." });
    }

    const price = Number(req.body.price);

    if (!price || price <= 0) {
        return res.status(400).json({ message: "Invalid price." });
    }

    plan.price = price;

    try {
        savePlans();
    } catch (error) {
        console.error("Failed to save plans.json:", error);
        return res.status(500).json({ message: "Price changed but could not be saved to file." });
    }

    res.json({ message: "Price updated successfully!", plan });

};

app.patch("/api/plans/:id", updatePlanPrice);
app.put("/api/plans/:id", updatePlanPrice);


// ==========================================
// START SERVER
// ==========================================



app.listen(PORT, () => {

    console.log(
        `Server is running on http://localhost:${PORT}`
    );

});
