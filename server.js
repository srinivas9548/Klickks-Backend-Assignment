const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const cors = require("cors");

const session = require("express-session");
const cookieParser = require("cookie-parser");

const dotenv = require("dotenv");
dotenv.config();

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use(cors({
    origin: ["http://localhost:3000", "https://your-frontend-domain.com"],
    credentials: true
}));

app.set("trust proxy", 1);

app.use(session({
    secret: process.env.SESSION_SECRET || "mysecret",
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",  // only send cookie over HTTPS
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 1000 * 60 * 60  // 1 hour session
    }
}));

const dbPath = path.join(__dirname, "users.db");

const port = process.env.PORT || 4000;

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (error) => {
    if (error) {
        console.log("Error opening database:", error.message);
    } else {
        console.log("Connected to the users.db database.");
    }

    db.run(`
            CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL
            )
        `),
        (err) => {
            if (err) console.log("Error creating users table:", err.message);
        }

    app.listen(port, () => {
        console.log(`Server is Running at http://localhost:${port}`);
    });

});

// User Registration (sign up)
app.post("/users", async (request, response) => {
    try {
        const { email, password } = request.body;

        db.get(
            `SELECT * FROM users WHERE email = ?`, [email], async (err, dbUser) => {
                if (err) {
                    console.error("DB Error:", err.message);
                    response.status(500).json({ error_msg: "Database error" });
                } else if (dbUser) {
                    response.status(400).json({ error_msg: "Email already exists" });
                } else {
                    const hashedPassword = await bcrypt.hash(password, 10);

                    db.run(
                        `INSERT INTO users (email, password) VALUES (?, ?)`,
                        [email, hashedPassword],
                        function (err) {
                            if (err) {
                                console.error("DB Insert Error:", err.message);
                                if (err.message.includes("UNIQUE constraint failed")) {
                                    return response.status(400).json({ error_msg: "Email already exists" });
                                }
                                response.status(500).json({ error_msg: "Error creating users" });
                            } else {
                                response.status(201).json({ message: "User created successfully" });
                            }
                        }
                    );
                }
            }
        );
    } catch (e) {
        console.error(e.message);
        response.status(500).send("Internal Server Error");
    }
});

// User Login (sign in)
app.post("/login", async (request, response) => {
    const { email, password } = request.body;

    if (!email || !password) {
        return response.status(400).json({ error_msg: "email or password is invalid" });
    }

    db.get(
        `SELECT * FROM users WHERE email = ?`, [email], async (err, dbUser) => {
            if (err) {
                response.status(500).json({ error_msg: "Database Error" });
            } else if (!dbUser) {
                response.status(400).json({ error_msg: "Invalid Email" });
            } else {
                const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
                if (isPasswordMatched) {
                    // Set session
                    request.session.user = { id: dbUser.id, email: dbUser.email };

                    // Session cookie is automatically sent by express-session
                    response.json({ message: "Login Successful", user: request.session.user });
                } else {
                    response.status(400).json({ error_msg: "Email and password didn't match" })
                }
            }
        }
    )
});

// Get dashboard for Authenticated User
app.get("/dashboard", (request, response) => {
    if (request.session.user) {
        response.json({ message: `Welcome ${request.session.user.email}` })
    } else {
        response.status(401).json({ error_msg: "Unauthorized, please log in" });
    }
});

// Logout to destroy the session
app.post("/logout", (request, response) => {
    request.session.destroy((err) => {
        if (err) {
            console.error("Session destroy error:", err);
            return response.status(500).json({ error_msg: "Logout failed" });
        }
        response.clearCookie("connect.sid", {
            path: "/",
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
        });

        response.json({ message: "Logged out successfully" });
    });
});

//Initial API
app.get("/", async (request, response) => {
    try {
        response.send("Welcome!, This is a Klickks Assignment Backend domain you can access with endpoints.");
    } catch (e) {
        console.error(e.message);
        response.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = app;