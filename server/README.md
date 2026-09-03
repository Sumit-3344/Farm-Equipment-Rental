# 🚜 FarmRent — REST API Backend & SQLite Database

High-performance, secure Node.js + Express backend powered by an embedded SQLite database (`node:sqlite`).

---

## 🛠️ Tech Stack & Architecture

- **Runtime**: Node.js v24+
- **Framework**: Express.js
- **Database**: SQLite with foreign key enforcement and auto-migrations
- **Security**: JWT (JSON Web Tokens) + bcryptjs password hashing + CORS
- **Port**: `5000` (Default)

---

## 📁 Database Schema (`db/farmrent.sqlite`)

```sql
-- 1. Users Table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  mobile TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('farmer', 'owner', 'admin')),
  location TEXT,
  equipment_type TEXT,
  farm_size TEXT,
  avatar TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'suspended')),
  created_at TEXT NOT NULL
);

-- 2. Equipment Table
CREATE TABLE equipment (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  hp TEXT,
  price REAL NOT NULL,
  unit TEXT NOT NULL DEFAULT 'day',
  status TEXT NOT NULL DEFAULT 'Available' CHECK(status IN ('Available', 'Rented', 'Maintenance')),
  owner_id TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  owner_phone TEXT,
  location TEXT,
  rating REAL DEFAULT 5.0,
  total_rentals INTEGER DEFAULT 0,
  img TEXT NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Bookings Table
CREATE TABLE bookings (
  id TEXT PRIMARY KEY,
  equipment_id INTEGER NOT NULL,
  equipment_name TEXT NOT NULL,
  equipment_img TEXT NOT NULL,
  farmer_id TEXT NOT NULL,
  farmer_name TEXT NOT NULL,
  farmer_phone TEXT,
  owner_id TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  days INTEGER NOT NULL,
  daily_rate REAL NOT NULL,
  total_amount REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'Confirmed' CHECK(status IN ('Pending', 'Confirmed', 'Completed', 'Cancelled')),
  payment_status TEXT NOT NULL DEFAULT 'Paid' CHECK(payment_status IN ('Paid', 'Pending')),
  location TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (farmer_id) REFERENCES users(id),
  FOREIGN KEY (equipment_id) REFERENCES equipment(id)
);

-- 4. OTPs Table
CREATE TABLE otps (
  mobile TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);
```

---

## 🚀 Running the Backend Server

```bash
# Navigate to server directory
cd server

# Install dependencies (if not already done)
npm install

# Start the Express server
npm start
# Or in watch mode:
npm run dev
```

The server will automatically:
1. Initialize the SQLite database at `server/db/farmrent.sqlite`.
2. Seed initial demo users (**Farmer**, **Owner**, **Admin**), default equipment catalog, and bookings.
3. Serve API endpoints on `http://localhost:5000/api`.
4. Serve the frontend directly on `http://localhost:5000`.

---

## 📡 REST API Reference

### 🔐 1. Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new Farmer or Equipment Owner | No |
| `POST` | `/api/auth/login` | Login with email/mobile + password | No |
| `POST` | `/api/auth/otp/send` | Request 6-digit OTP | No |
| `POST` | `/api/auth/otp/verify` | Verify OTP & obtain JWT token | No |
| `GET` | `/api/auth/me` | Get profile for authenticated user | Yes (`Bearer <JWT>`) |
| `POST` | `/api/auth/reset-password` | Dispatch password reset link | No |

---

### 🚜 2. Equipment Management (`/api/equipment`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/equipment` | List equipment (supports `?name=`, `?category=`, `?location=`) | No |
| `GET` | `/api/equipment/:id` | Get details for specific machine | No |
| `POST` | `/api/equipment` | Publish new machinery listing | Yes (Owner / Admin) |
| `PATCH` | `/api/equipment/:id` | Update machine specs or toggle Availability | Yes (Owner / Admin) |
| `DELETE`| `/api/equipment/:id` | Delete equipment listing | Yes (Owner / Admin) |

---

### 📅 3. Bookings & Invoices (`/api/bookings`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/bookings` | List bookings (scoped by role) | Yes |
| `GET` | `/api/bookings/:id` | Get booking & itemized tax invoice receipt | Yes |
| `POST` | `/api/bookings` | Create new equipment booking | Yes |
| `PATCH` | `/api/bookings/:id/status`| Update status (`Confirmed`, `Completed`, `Cancelled`) | Yes |

---

### 🛡️ 4. Admin Management (`/api/admin`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/users` | List all platform users | Yes (Admin only) |
| `PATCH` | `/api/admin/users/:id/status` | Suspend or activate user | Yes (Admin only) |
| `GET` | `/api/admin/stats` | Platform totals, volume, and commission | Yes (Admin only) |

---

## 🧪 Testing the API

Run the automated test suite:
```bash
node test-api.js
```
