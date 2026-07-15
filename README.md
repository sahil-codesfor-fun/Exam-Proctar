# 🛡️ Nexus Proctor

> An enterprise-grade, highly secure, and real-time online examination platform. Built with a twin-turbo architecture using React, Node.js, Express, MySQL, and Redis to handle massive concurrent student loads without breaking a sweat.

Welcome to the fortress! Nexus Proctor is not your average quiz app. It is a fully-fledged, proctored examination environment featuring real-time socket monitoring, advanced code compilation, laser-beam matching UIs, and robust anti-cheat mechanisms.

---

## 🏗️ The Tech Stack

| Technology | Role |
| --- | --- |
| **MySQL** | Primary relational database managed via Prisma ORM with heavily optimized `@index` mapping for lightning-fast reads. |
| **Express.js** | Backend API engine protected by strict rate-limiting middlewares. |
| **React** | Lightning-fast frontend utilizing imperative flushes and custom debounce hooks. |
| **Node.js** | The core runtime, supercharged with event-driven background job queues. |
| **Redis (Upstash)** | The VIP Cache layer ensuring sub-millisecond database reads during traffic spikes. |
| **Socket.io** | Powers real-time proctoring, live student monitoring, and force-submission commands. |
| **Monaco Editor** | Integrated VS-Code style environment for live coding exams with hidden test cases. |

---

## 🔥 Core Features

### 👨‍🎓 Student Environment (The Fortress)

* **Impenetrable Fullscreen Lock:** Exam sessions are strictly locked. Exiting fullscreen logs a critical violation and warns the proctor.
* **Anti-Cheat Mechanics:** Complete block on copy, paste, cut, select-all shortcuts, context menus, and drag-and-drop actions.
* **Live Code Compiler:** Write, compile, and judge code in 19+ languages (Python, C++, Java, etc.) directly in the browser.
* **Interactive Matching UI:** "Laser beam" matching questions utilizing dynamic SVG lines and touch-safe coordinate mapping.
* **Emergency Auto-Save:** Keystrokes are debounced and silently saved every 2000ms. An imperative flush guarantees the absolute final keystroke is saved upon submission.

### 👨‍🏫 Faculty / Teacher Dashboard

* **Massive Exam Builder:** Construct complex exams with MCQ, Subjective, Coding, and Matching questions.
* **Background Queues:** Heavy exam creation transactions are offloaded to background workers, immediately returning a `202 Accepted` to keep the UI buttery smooth.
* **Live Proctoring Console:** Watch student connection statuses in real-time via Socket.io.
* **One-Click Terminate:** Instantly force-submit a specific student's exam if critical violations are detected.

### ⚡ System Architecture & Performance

* **Graceful Degradation:** The backend automatically falls back to raw database queries if the Redis cache drops, preventing catastrophic API crashes.
* **API Rate Limiting:** Global and route-specific bouncers permanently block spam, brute-force attacks, and double-click bugs.

---

## 🗺️ Application Routes (Navigation Guide)

Our routing architecture is strictly separated by Role-Based Access Control (RBAC). The platform exposes the following primary entry gates.

| Route / Path | Required Role | Description |
| --- | --- | --- |
| `/public` (or `/`) | *Public* | The main public landing page and general entry point for students. |
| `/fac` | **Faculty** | Faculty login portal and dashboard for managing courses, students, and exams. |
| `/adm` | **Admin** | Department-level administration. Admins can oversee faculty, review department stats, and manage schedules. |
| `/superadminlogin` | **Super Admin** | The God-mode terminal. Full platform oversight, global configuration, and root-level access. |

*(Note: Internal application routes are protected and dynamically served post-authentication).*

---

## 🚀 Getting Started (Local Setup)

To spin up Nexus Proctor on your local machine, follow these steps exactly.

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/Nexus-Proctor.git
cd Nexus-Proctor

```

### 2. Install Dependencies

You will need to install packages for both the frontend and the twin-turbo backend.

```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install

```

### 3. Environment Variables

Create a `.env` file in the `/backend` directory. You will need to provide the following keys to start the engine:

```env
# Server
PORT=10000

# Prisma / MySQL Database
DATABASE_URL="mysql://user:password@host:3306/nexus_db"

# JWT Secrets
JWT_SECRET="your_super_secret_key"

# Redis Cache (Upstash)
REDIS_URL="rediss://default:your_secret_token@your-upstash-url:6379"

# Email Configuration (Nodemailer)
EMAIL_USER="your_email@gmail.com"
EMAIL_PASS="your_app_password"

```

### 4. Database Sync

Push the Prisma schema to your MySQL database to generate the tables and indexes.

```bash
cd backend
npx prisma generate
npx prisma db push

```

### 5. Ignite the Engines

Open two terminal windows to start the development servers.

**Terminal 1 (Backend):**

```bash
cd backend
npm run dev

```

**Terminal 2 (Frontend):**

```bash
cd frontend
npm run dev

```

The application is now live on `http://localhost:5173` (Frontend) and `http://localhost:10000` (Backend API).

---

## 🤝 Contribution Guidelines

This codebase adheres strictly to enterprise stability standards. Before submitting a Pull Request, ensure:

* All React components utilize proper loading, updating, and disconnecting state locks.
* API endpoints are protected by `express-rate-limit`.
* Database queries are properly indexed in `schema.prisma`.
* You do not commit `.env` secrets or raw database passwords.
