
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

const PORT = process.env.PORT || 8080;
const app = express();

app.use(cors());
app.use(express.json());

// ==========================================
// MYSQL DATABASE CONNECTION
// ==========================================

const db = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "gym_membership",
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function testConnection() {
    try {
        const connection = await db.getConnection();
        console.log("MySQL Database Connected!");
        connection.release();
    } catch (error) {
        console.error("Database Connection Failed:", error.message);
    }
}

testConnection();

// ==========================================
// MEMBERSHIP PLANS
// ==========================================

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

const PLANS_FILE = path.join(__dirname, "plans.json");

const loadPlans = () => {
    try {
        if (fs.existsSync(PLANS_FILE)) {
            return JSON.parse(
                fs.readFileSync(PLANS_FILE, "utf-8")
            );
        }
    } catch (error) {
        console.error("Failed to read plans.json:", error);
    }

    return defaultPlans;
};

let membershipPlans = loadPlans();

const savePlans = () => {
    fs.writeFileSync(
        PLANS_FILE,
        JSON.stringify(membershipPlans, null, 4)
    );
};

// ==========================================
// HOME
// ==========================================

app.get("/", (req, res) => {
    res.json({
        message: "Gym Membership System API is running!"
    });
});

// ==========================================
// GET MEMBERSHIP PLANS
// ==========================================

app.get("/api/plans", (req, res) => {
    res.json(membershipPlans);
});

// ==========================================
// UPDATE PLAN PRICE
// ==========================================

const updatePlanPrice = (req, res) => {
    const plan = membershipPlans.find(
        (item) => item.id === Number(req.params.id)
    );

    if (!plan) {
        return res.status(404).json({
            message: "Plan not found."
        });
    }

    const price = Number(req.body.price);

    if (!Number.isFinite(price) || price <= 0) {
        return res.status(400).json({
            message: "Invalid price."
        });
    }

    plan.price = price;

    try {
        savePlans();

        res.json({
            message: "Price updated successfully!",
            plan
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to save plan price."
        });
    }
};

app.patch("/api/plans/:id", updatePlanPrice);
app.put("/api/plans/:id", updatePlanPrice);

// ==========================================
// GET ALL PAYMENT RECORDS
// ==========================================

app.get("/api/payments", async (req, res) => {
    try {
        const [payments] = await db.query(`
            SELECT
                id,
                uid,
                name,
                email,
                plan,
                amount,
                payment_method AS paymentMethod,
                duration_days AS durationDays,
                CONCAT(duration_days, ' Days') AS duration,
                status,
                start_date AS startDate,
                expiration_date AS expirationDate,
                created_at AS createdAt
            FROM payments
            ORDER BY id DESC
        `);

        res.json(payments);

    } catch (error) {
        console.error("GET Payments Error:", error);

        res.status(500).json({
            message: "Failed to load payments."
        });
    }
});

// ==========================================
// ADD NEW PAYMENT
// ==========================================

app.post("/api/payments", async (req, res) => {
    try {
        const {
            uid,
            name,
            email,
            plan,
            amount,
            paymentMethod,
            duration,
            durationDays,
            duration_days
        } = req.body;

        const planDurations = {
            Weekly: 7,
            Monthly: 30,
            Yearly: 365
        };

        const days = Number(
            durationDays ||
            duration_days ||
            parseInt(duration, 10) ||
            planDurations[plan]
        );

        const paymentAmount = Number(amount);

        if (
            !uid ||
            !name ||
            !email ||
            !plan ||
            !Number.isFinite(paymentAmount) ||
            paymentAmount <= 0 ||
            !Number.isInteger(days) ||
            days <= 0
        ) {
            return res.status(400).json({
                message: "Please complete all payment details."
            });
        }

        const [result] = await db.query(
            `INSERT INTO payments
            (
                uid,
                name,
                email,
                plan,
                amount,
                payment_method,
                duration_days,
                status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')`,
            [
                uid,
                name,
                email,
                plan,
                paymentAmount,
                paymentMethod || "Cash",
                days
            ]
        );

        res.status(201).json({
            message: "Payment submitted successfully!",
            id: result.insertId,
            status: "Pending",
            durationDays: days
        });

    } catch (error) {
        console.error("POST Payment Error:", error);

        res.status(500).json({
            message: "Failed to submit payment."
        });
    }
});

// ==========================================
// EDIT PAYMENT
// ==========================================

app.put("/api/payments/:id", async (req, res) => {
    try {
        const paymentId = Number(req.params.id);

        const {
            name,
            email,
            plan,
            amount,
            paymentMethod,
            durationDays,
            status
        } = req.body;

        const days = Number(durationDays);
        const paymentAmount = Number(amount);

        if (
            !Number.isInteger(paymentId) ||
            paymentId <= 0 ||
            !name ||
            !email ||
            !plan ||
            !Number.isInteger(days) ||
            days <= 0 ||
            !Number.isFinite(paymentAmount) ||
            paymentAmount <= 0 ||
            !["Pending", "Approved"].includes(status)
        ) {
            return res.status(400).json({
                message: "Invalid payment details."
            });
        }

        const [existing] = await db.query(
            `SELECT id, status, start_date
             FROM payments
             WHERE id = ?`,
            [paymentId]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                message: "Payment not found."
            });
        }

        if (existing[0].status === "Approved") {
            await db.query(
                `UPDATE payments
                 SET
                    name = ?,
                    email = ?,
                    plan = ?,
                    amount = ?,
                    payment_method = ?,
                    duration_days = ?,
                    expiration_date = DATE_ADD(
                        COALESCE(start_date, NOW()),
                        INTERVAL ? DAY
                    )
                 WHERE id = ?`,
                [
                    name,
                    email,
                    plan,
                    paymentAmount,
                    paymentMethod || "Cash",
                    days,
                    days,
                    paymentId
                ]
            );
        } else {
            await db.query(
                `UPDATE payments
                 SET
                    name = ?,
                    email = ?,
                    plan = ?,
                    amount = ?,
                    payment_method = ?,
                    duration_days = ?,
                    status = ?
                 WHERE id = ?`,
                [
                    name,
                    email,
                    plan,
                    paymentAmount,
                    paymentMethod || "Cash",
                    days,
                    status,
                    paymentId
                ]
            );
        }

        res.json({
            message: "Payment updated successfully!",
            durationDays: days
        });

    } catch (error) {
        console.error("Edit Payment Error:", error);

        res.status(500).json({
            message: "Failed to update payment."
        });
    }
});

// ==========================================
// DELETE PAYMENT
// ==========================================

app.delete("/api/payments/:id", async (req, res) => {
    try {
        const paymentId = Number(req.params.id);

        if (!Number.isInteger(paymentId) || paymentId <= 0) {
            return res.status(400).json({
                message: "Invalid payment ID."
            });
        }

        const [result] = await db.query(
            "DELETE FROM payments WHERE id = ?",
            [paymentId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Payment not found."
            });
        }

        res.json({
            message: "Payment deleted successfully!"
        });

    } catch (error) {
        console.error("Delete Payment Error:", error);

        res.status(500).json({
            message: "Failed to delete payment."
        });
    }
});

// ==========================================
// APPROVE PAYMENT
// EXTEND EXISTING MEMBERSHIP
// ==========================================

app.patch("/api/payments/:id/status", async (req, res) => {
    let connection;

    try {
        const paymentId = Number(req.params.id);
        const { status } = req.body;

        if (!Number.isInteger(paymentId) || paymentId <= 0) {
            return res.status(400).json({
                message: "Invalid payment ID."
            });
        }

        if (status !== "Approved") {
            return res.status(400).json({
                message: "Invalid payment status."
            });
        }

        connection = await db.getConnection();

        await connection.beginTransaction();

        // Hanapin ang pending payment
        const [payments] = await connection.query(
            `SELECT *
             FROM payments
             WHERE id = ?
             AND status = 'Pending'
             FOR UPDATE`,
            [paymentId]
        );

        if (payments.length === 0) {
            await connection.rollback();

            return res.status(400).json({
                message: "Payment not found or already approved."
            });
        }

        const payment = payments[0];

        // Hanapin ang latest active membership
        const [memberships] = await connection.query(
            `SELECT expiration_date
             FROM payments
             WHERE uid = ?
             AND status = 'Approved'
             AND expiration_date > NOW()
             ORDER BY expiration_date DESC
             LIMIT 1
             FOR UPDATE`,
            [payment.uid]
        );

        const existingExpiration =
            memberships.length > 0
                ? memberships[0].expiration_date
                : null;

        // Idagdag ang duration_days sa existing expiration.
        // Kung walang active membership, NOW() ang starting date.
        await connection.query(
            `UPDATE payments
             SET
                status = 'Approved',
                start_date = CASE
                    WHEN ? IS NOT NULL THEN ?
                    ELSE NOW()
                END,
                expiration_date = DATE_ADD(
                    CASE
                        WHEN ? IS NOT NULL THEN ?
                        ELSE NOW()
                    END,
                    INTERVAL duration_days DAY
                )
             WHERE id = ?
             AND status = 'Pending'`,
            [
                existingExpiration,
                existingExpiration,
                existingExpiration,
                existingExpiration,
                paymentId
            ]
        );

        await connection.commit();

        const [updatedPayment] = await db.query(
            `SELECT
                id,
                uid,
                name,
                email,
                plan,
                amount,
                payment_method AS paymentMethod,
                duration_days AS durationDays,
                status,
                start_date AS startDate,
                expiration_date AS expirationDate
             FROM payments
             WHERE id = ?`,
            [paymentId]
        );

        res.json({
            message: "Payment approved and membership extended successfully!",
            payment: updatedPayment[0]
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }

        console.error("Approve Payment Error:", error);

        res.status(500).json({
            message: "Failed to approve payment."
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
});

// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, () => {
    console.log(
        `Server is running on http://localhost:${PORT}`
    );
});
