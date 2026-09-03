/**
 * FarmRent — Shared Local Database & REST API Client
 * Seamlessly interfaces with Node.js + Express + SQLite Backend API
 * with automatic fallback & localStorage session synchronization.
 */

const API_BASE = 'http://localhost:5000/api';

const STORAGE_KEYS = {
  AUTH_USER: 'farmrent_auth_user',
  AUTH_TOKEN: 'farmrent_auth_token',
  USERS: 'farmrent_users',
  EQUIPMENT: 'farmrent_equipment',
  BOOKINGS: 'farmrent_bookings',
  ACTIVE_OTP: 'farmrent_active_otp'
};

// Initial Seed Data for fallback
const DEFAULT_USERS = [
  {
    id: 'usr_farmer_1',
    name: 'Ramesh Patil',
    email: 'farmer@farmrent.com',
    mobile: '9876543210',
    password: 'farmer123',
    role: 'farmer',
    location: 'Satara, Maharashtra',
    farmSize: '15 Acres',
    status: 'active',
    avatar: '👨‍🌾',
    joinedDate: '2025-11-12'
  },
  {
    id: 'usr_owner_1',
    name: 'Balwinder Singh',
    email: 'owner@farmrent.com',
    mobile: '9876543211',
    password: 'owner123',
    role: 'owner',
    location: 'Ludhiana, Punjab',
    equipmentType: 'Tractors & Harvesters',
    status: 'active',
    avatar: '🚜',
    joinedDate: '2025-08-20',
    bankAccount: 'HDFC •••• 4829'
  },
  {
    id: 'usr_admin_1',
    name: 'FarmRent Admin',
    email: 'admin@farmrent.com',
    mobile: '9876543212',
    password: 'admin123',
    role: 'admin',
    location: 'Pune, Maharashtra',
    status: 'active',
    avatar: '🛡️',
    joinedDate: '2025-01-01'
  }
];

const DEFAULT_EQUIPMENT = [
  {
    id: 1,
    name: 'John Deere 5050D',
    category: 'Tractor',
    hp: '50 HP',
    price: 2500,
    unit: 'day',
    status: 'Available',
    ownerId: 'usr_owner_1',
    ownerName: 'Balwinder Singh',
    ownerPhone: '+91 98765 43211',
    location: 'Pune & Western Maharashtra',
    rating: 4.9,
    totalRentals: 42,
    img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&auto=format&fit=crop&q=80',
    description: 'High-torque 50HP John Deere tractor with power steering and dual clutch. Ideal for ploughing, rotavation, and heavy haulage.'
  },
  {
    id: 2,
    name: 'New Holland Harvester TC5.30',
    category: 'Harvester',
    hp: '130 HP',
    price: 6500,
    unit: 'day',
    status: 'Available',
    ownerId: 'usr_owner_1',
    ownerName: 'Balwinder Singh',
    ownerPhone: '+91 98765 43211',
    location: 'Ludhiana & Northern Region',
    rating: 4.8,
    totalRentals: 28,
    img: 'https://images.unsplash.com/photo-1599059813005-11265ba4b4ce?w=600&auto=format&fit=crop&q=80',
    description: 'Advanced multi-crop combine harvester suitable for wheat, paddy, soybean, and pulses with minimal grain loss.'
  },
  {
    id: 3,
    name: 'Landforce Heavy Rotavator (7 Feet)',
    category: 'Rotavator',
    hp: '45-60 HP Compatible',
    price: 1200,
    unit: 'day',
    status: 'Available',
    ownerId: 'usr_owner_1',
    ownerName: 'Balwinder Singh',
    ownerPhone: '+91 98765 43211',
    location: 'Satara, Maharashtra',
    rating: 4.7,
    totalRentals: 35,
    img: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600&auto=format&fit=crop&q=80',
    description: 'Heavy-duty multi-speed gearbox rotavator with boron steel blades for superior soil pulverization and seedbed preparation.'
  },
  {
    id: 4,
    name: 'Universal 9-Row Seed Drill Machine',
    category: 'Seed Drill',
    hp: '35 HP Compatible',
    price: 900,
    unit: 'day',
    status: 'Available',
    ownerId: 'usr_owner_1',
    ownerName: 'Balwinder Singh',
    ownerPhone: '+91 98765 43211',
    location: 'Pune, Maharashtra',
    rating: 4.9,
    totalRentals: 19,
    img: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=600&auto=format&fit=crop&q=80',
    description: 'Precision seed cum fertilizer drill machine for uniform depth and spacing during sowing season.'
  }
];

const DEFAULT_BOOKINGS = [
  {
    id: 'BK-1001',
    equipmentId: 1,
    equipmentName: 'John Deere 5050D',
    equipmentImg: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&auto=format&fit=crop&q=80',
    farmerId: 'usr_farmer_1',
    farmerName: 'Ramesh Patil',
    farmerPhone: '9876543210',
    ownerId: 'usr_owner_1',
    ownerName: 'Balwinder Singh',
    startDate: '2026-08-25',
    endDate: '2026-08-27',
    days: 3,
    dailyRate: 2500,
    totalAmount: 7500,
    status: 'Confirmed',
    paymentStatus: 'Paid',
    location: 'Satara, Maharashtra',
    createdAt: '2026-08-22T10:30:00.000Z'
  },
  {
    id: 'BK-1002',
    equipmentId: 3,
    equipmentName: 'Landforce Heavy Rotavator (7 Feet)',
    equipmentImg: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600&auto=format&fit=crop&q=80',
    farmerId: 'usr_farmer_1',
    farmerName: 'Ramesh Patil',
    farmerPhone: '9876543210',
    ownerId: 'usr_owner_1',
    ownerName: 'Balwinder Singh',
    startDate: '2026-08-15',
    endDate: '2026-08-16',
    days: 2,
    dailyRate: 1200,
    totalAmount: 2400,
    status: 'Completed',
    paymentStatus: 'Paid',
    location: 'Satara, Maharashtra',
    createdAt: '2026-08-14T09:15:00.000Z'
  }
];

function initDatabase() {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.EQUIPMENT)) {
    localStorage.setItem(STORAGE_KEYS.EQUIPMENT, JSON.stringify(DEFAULT_EQUIPMENT));
  }
  if (!localStorage.getItem(STORAGE_KEYS.BOOKINGS)) {
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(DEFAULT_BOOKINGS));
  }
}
initDatabase();

// ─── AUTHENTICATION & API CLIENT ───

window.FarmRentAuth = {
  apiBase: API_BASE,

  getToken: function () {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  },

  setToken: function (token) {
    if (token) localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    else localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  },

  getCurrentUser: function () {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  setCurrentUser: function (user, token) {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
      if (token) this.setToken(token);
    } else {
      localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
      this.setToken(null);
    }
  },

  logout: function () {
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    window.location.href = 'index.html';
  },

  loginWithPassword: function (identifier, password, role) {
    // Attempt async fetch in background to sync server
    try {
      fetch(`${this.apiBase}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password, role })
      }).then(r => r.json()).then(data => {
        if (data.success && data.token) this.setToken(data.token);
      }).catch(() => {});
    } catch(e) {}

    // Synchronous local state validation
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const cleanId = identifier.trim().toLowerCase();

    const user = users.find(function (u) {
      const matchId = u.email.toLowerCase() === cleanId || u.mobile === cleanId;
      const matchRole = !role || u.role === role;
      return matchId && matchRole;
    });

    if (!user) {
      return { success: false, message: 'No account found matching this ' + (role ? role : 'user') + ' profile.' };
    }

    if (user.password !== password) {
      return { success: false, message: 'Invalid password. Please check your credentials.' };
    }

    if (user.status === 'suspended') {
      return { success: false, message: 'Your account has been suspended. Please contact admin support.' };
    }

    this.setCurrentUser(user);
    return { success: true, user: user };
  },

  sendOtp: function (mobile) {
    const cleanMobile = mobile.trim();
    if (cleanMobile.length < 10) {
      return { success: false, message: 'Please enter a valid 10-digit mobile number' };
    }

    try {
      fetch(`${this.apiBase}/auth/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: cleanMobile })
      }).catch(() => {});
    } catch(e) {}

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const otpData = {
      mobile: cleanMobile,
      code: '123456',
      generatedCode: code,
      expiresAt: Date.now() + 5 * 60 * 1000
    };
    localStorage.setItem(STORAGE_KEYS.ACTIVE_OTP, JSON.stringify(otpData));

    return {
      success: true,
      message: 'OTP sent to +91 ' + cleanMobile,
      code: '123456'
    };
  },

  verifyOtpAndLogin: function (mobile, enteredCode, role) {
    const cleanMobile = mobile.trim();
    const stored = localStorage.getItem(STORAGE_KEYS.ACTIVE_OTP);
    let otpData = stored ? JSON.parse(stored) : null;

    const isValidCode = (enteredCode === '123456') || (otpData && otpData.code === enteredCode) || (otpData && otpData.generatedCode === enteredCode);

    if (!isValidCode) {
      return { success: false, message: 'Invalid OTP code. Please enter 123456 for demo.' };
    }

    let users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    let user = users.find(function (u) {
      return u.mobile === cleanMobile && (!role || u.role === role);
    });

    if (!user) {
      user = {
        id: 'usr_' + Date.now(),
        name: (role === 'owner' ? 'Equipment Owner' : role === 'admin' ? 'System Admin' : 'Farmer User') + ' (' + cleanMobile.slice(-4) + ')',
        email: cleanMobile + '@farmrent.com',
        mobile: cleanMobile,
        password: 'password123',
        role: role || 'farmer',
        location: 'Maharashtra, India',
        status: 'active',
        avatar: role === 'owner' ? '🚜' : role === 'admin' ? '🛡️' : '👨‍🌾',
        joinedDate: new Date().toISOString().split('T')[0]
      };
      users.push(user);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }

    this.setCurrentUser(user);
    return { success: true, user: user };
  },

  register: function (data) {
    let users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const cleanEmail = (data.email || '').trim().toLowerCase();
    const cleanMobile = (data.mobile || '').trim();

    const exists = users.some(function (u) {
      return (cleanEmail && u.email.toLowerCase() === cleanEmail) || (cleanMobile && u.mobile === cleanMobile);
    });

    if (exists) {
      return { success: false, message: 'An account with this email or mobile number already exists.' };
    }

    const newUser = {
      id: 'usr_' + Date.now(),
      name: data.name,
      email: data.email || (data.mobile + '@farmrent.com'),
      mobile: data.mobile,
      password: data.password,
      role: data.role || 'farmer',
      location: data.location || 'Pune, Maharashtra',
      equipmentType: data.equipmentType || '',
      farmSize: data.farmSize || '10 Acres',
      status: 'active',
      avatar: data.role === 'owner' ? '🚜' : '👨‍🌾',
      joinedDate: new Date().toISOString().split('T')[0]
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    this.setCurrentUser(newUser);

    try {
      fetch(`${this.apiBase}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).catch(() => {});
    } catch(e) {}

    return { success: true, user: newUser };
  },

  // ─── DATA ACCESS METHODS ───

  getEquipmentList: function () {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.EQUIPMENT) || '[]');
  },

  addEquipment: function (item) {
    const list = this.getEquipmentList();
    const newItem = {
      id: Date.now(),
      name: item.name,
      category: item.category || 'Tractor',
      hp: item.hp || '50 HP',
      price: Number(item.price) || 2000,
      unit: item.unit || 'day',
      status: 'Available',
      ownerId: item.ownerId,
      ownerName: item.ownerName,
      ownerPhone: item.ownerPhone,
      location: item.location || 'Maharashtra',
      rating: 5.0,
      totalRentals: 0,
      img: item.img || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&auto=format&fit=crop&q=80',
      description: item.description || ''
    };
    list.unshift(newItem);
    localStorage.setItem(STORAGE_KEYS.EQUIPMENT, JSON.stringify(list));

    // Async sync with backend
    try {
      const token = this.getToken();
      if (token) {
        fetch(`${this.apiBase}/equipment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(item)
        }).catch(() => {});
      }
    } catch(e) {}

    return newItem;
  },

  deleteEquipment: function (id) {
    let list = this.getEquipmentList();
    list = list.filter(function (e) { return e.id !== Number(id); });
    localStorage.setItem(STORAGE_KEYS.EQUIPMENT, JSON.stringify(list));
  },

  toggleEquipmentStatus: function (id, newStatus) {
    const list = this.getEquipmentList();
    const item = list.find(function (e) { return e.id === Number(id); });
    if (item) {
      item.status = newStatus;
      localStorage.setItem(STORAGE_KEYS.EQUIPMENT, JSON.stringify(list));
    }
  },

  getBookings: function () {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKINGS) || '[]');
  },

  createBooking: function (bookingData) {
    const bookings = this.getBookings();
    const newBooking = {
      id: 'BK-' + Math.floor(1000 + Math.random() * 9000),
      equipmentId: bookingData.equipmentId,
      equipmentName: bookingData.equipmentName,
      equipmentImg: bookingData.equipmentImg,
      farmerId: bookingData.farmerId,
      farmerName: bookingData.farmerName,
      farmerPhone: bookingData.farmerPhone,
      ownerId: bookingData.ownerId,
      ownerName: bookingData.ownerName,
      startDate: bookingData.startDate,
      endDate: bookingData.endDate,
      days: Number(bookingData.days) || 1,
      dailyRate: Number(bookingData.dailyRate) || 1000,
      totalAmount: (Number(bookingData.days) || 1) * (Number(bookingData.dailyRate) || 1000),
      status: 'Confirmed',
      paymentStatus: 'Paid',
      location: bookingData.location || 'Pune, Maharashtra',
      createdAt: new Date().toISOString()
    };

    bookings.unshift(newBooking);
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));

    // Async sync with backend
    try {
      const token = this.getToken();
      if (token) {
        fetch(`${this.apiBase}/bookings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(bookingData)
        }).catch(() => {});
      }
    } catch(e) {}

    return newBooking;
  },

  updateBookingStatus: function (bookingId, newStatus) {
    const bookings = this.getBookings();
    const booking = bookings.find(function (b) { return b.id === bookingId; });
    if (booking) {
      booking.status = newStatus;
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
      return booking;
    }
    return null;
  },

  getUsersList: function () {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
  },

  toggleUserStatus: function (userId) {
    const users = this.getUsersList();
    const user = users.find(function (u) { return u.id === userId; });
    if (user) {
      user.status = (user.status === 'active') ? 'suspended' : 'active';
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      return user;
    }
    return null;
  }
};
