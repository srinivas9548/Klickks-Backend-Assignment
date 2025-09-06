# Klickks Backend Assignemnt

This backend provides user authentication using **Express.js**, **SQLite**, **bcrypt**, and **express-session**.  
It includes registration, login, dashboard access (protected route), and logout functionality.

---

## Features
- User Registration with password hashing (`bcrypt`)
- Prevents duplicate email registration
- User Login with session-based authentication
- Stay logged in using `express-session` (cookies)
- Protected **Dashboard** route (only accessible if logged in)
- Logout functionality (destroys session)

---

## Tech Stack
- **Node.js** (Runtime)
- **Express.js** (Web framework)
- **SQLite3** (Database)
- **bcrypt** (Password hashing)
- **express-session** (Session management)
- **cookie-parser** (Cookie support)
- **cors** (Cross-Origin Resource Sharing)

---

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/srinivas9548/Klickks-Backend-Assignment.git
   cd Klickks-Backend-Assignment
   ```

2. Install dependencies::
   ```bash
   npm install
   ```

3. Start Server:
   ```bash
   npm start
   ```