# 🚜 FarmRent — Farm Equipment Rental System

A full-featured farm equipment rental web application built with **HTML, CSS, and JavaScript** (frontend) and **Node.js + Express + MySQL** (backend).

![FarmRent Homepage](https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=1200&auto=format&fit=crop&q=80)

---

## 🌟 Features

### Public Pages
- **Homepage** — Hero section, live search bar, trust badges, featured equipment carousel
- **Equipment Listing** — Browse all available equipment with category/location filters
- **Equipment Detail** — Photos, specs, pricing, and live cost calculator
- **How It Works** — Step-by-step guide + FAQ

### Role-Based Dashboards
| Role | Features |
|---|---|
| 🌾 **Farmer** | Browse equipment, make bookings, view booking history, save favorites |
| 🔧 **Equipment Owner** | List equipment, set pricing & availability, accept/reject bookings, track earnings |
| 🛡️ **Admin** | Approve listings, manage users, resolve disputes, view platform analytics |

### Core Functionality
- 🔐 JWT-based authentication with role guard
- 📅 Availability engine — prevents double-booking via date-range overlap detection
- 💰 Live rental cost calculator (price/day × days + GST + deposit)
- ❤️ Favorites toggle
- 📍 Location-based search with radius filtering (Haversine formula)
- 📱 Fully responsive design

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Node.js, Express.js |
| Database | MySQL |
| Auth | JWT (JSON Web Tokens) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- MySQL 8+

### 1. Clone the repository
```bash
git clone https://github.com/Sumit-3344/Farm-Equipment-Rental.git
cd Farm-Equipment-Rental
```

### 2. Set up the database
Import the SQL schema:
```bash
mysql -u root -p < farmrent_workbench_setup.sql
```

### 3. Configure environment
```bash
cd server
cp .env.example .env
# Edit .env with your DB credentials and JWT secret
```

### 4. Install server dependencies & start
```bash
cd server
npm install
node server.js
```

### 5. Open the frontend
Simply open `index.html` in your browser — no build step required!

---

## 📁 Project Structure

```
Farm-Equipment-Rental/
├── index.html                  ← Homepage (pure HTML/CSS/JS)
├── login.html                  ← Login & registration pages
├── dashboard.html              ← Role-based dashboard
├── farmer-dashboard.html       ← Farmer dashboard
├── owner-dashboard.html        ← Equipment owner dashboard
├── admin-dashboard.html        ← Admin panel
├── auth.js                     ← Frontend authentication logic
├── farmrent_workbench_setup.sql ← MySQL database schema + seed data
└── server/
    ├── server.js               ← Express app entry point
    ├── package.json
    └── routes/
        ├── auth.routes.js      ← Register / Login / OTP
        ├── equipment.routes.js ← CRUD + availability check
        ├── booking.routes.js   ← Booking flow & status
        └── admin.routes.js     ← Admin management endpoints
```

---

## 📊 Database Schema

| Table | Purpose |
|---|---|
| `users` | Farmers, Owners, Admins with role field |
| `equipment` | Listings with category, price, location, status |
| `bookings` | Date-range bookings with status tracking |
| `categories` | Equipment categories with icons |
| `favorites` | Farmer saved equipment |
| `reviews` | Post-booking ratings & comments |

---

## 🎓 College Project Info

> **Course:** Web Development / Final Year Project  
> **Team:** FarmRent Dev Team  
> **Institution:** —

---

## 📄 License

MIT License — free to use for educational purposes.
