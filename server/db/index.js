require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

let dbDriver = process.env.DB_DRIVER || 'sqlite';
let mysqlPool = null;
let sqliteDb = null;

// Initialize Database connection based on driver
if (dbDriver === 'mysql') {
  const mysql = require('mysql2/promise');
  try {
    mysqlPool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'farmrent',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    console.log('🔌 Connected to MySQL Connection Pool (MySQL Workbench Database)');
  } catch (err) {
    console.error('⚠️ Failed to connect to MySQL. Falling back to SQLite...', err.message);
    dbDriver = 'sqlite';
  }
}

if (dbDriver === 'sqlite') {
  const { DatabaseSync } = require('node:sqlite');
  const dbDir = path.join(__dirname);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  const dbPath = path.join(dbDir, 'farmrent.sqlite');
  sqliteDb = new DatabaseSync(dbPath);
  sqliteDb.exec('PRAGMA foreign_keys = ON;');
  console.log('🔌 Connected to SQLite database:', dbPath);

  // Initialize SQLite Schema & Seed
  initSqliteSchema(sqliteDb);
}

/**
 * SQLite Local Schema & Seed (Fallback)
 */
function initSqliteSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
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

    CREATE TABLE IF NOT EXISTS equipment (
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

    CREATE TABLE IF NOT EXISTS bookings (
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

    CREATE TABLE IF NOT EXISTS otps (
      mobile TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      expires_at INTEGER NOT NULL
    );
  `);

  const countStmt = db.prepare('SELECT COUNT(*) as count FROM users');
  const result = countStmt.get();

  if (result.count === 0) {
    console.log('🌱 Seeding SQLite fallback database with default data...');
    const salt = bcrypt.genSaltSync(10);
    const farmerPass = bcrypt.hashSync('farmer123', salt);
    const ownerPass = bcrypt.hashSync('owner123', salt);
    const adminPass = bcrypt.hashSync('admin123', salt);
    const now = new Date().toISOString();

    const insertUser = db.prepare(`
      INSERT INTO users (id, name, email, mobile, password_hash, role, location, equipment_type, farm_size, avatar, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertUser.run('usr_farmer_1', 'Ramesh Patil', 'farmer@farmrent.com', '9876543210', farmerPass, 'farmer', 'Satara, Maharashtra', null, '15 Acres', '👨‍🌾', 'active', now);
    insertUser.run('usr_owner_1', 'Balwinder Singh', 'owner@farmrent.com', '9876543211', ownerPass, 'owner', 'Ludhiana, Punjab', 'Tractors & Harvesters', null, '🚜', 'active', now);
    insertUser.run('usr_admin_1', 'FarmRent Admin', 'admin@farmrent.com', '9876543212', adminPass, 'admin', 'Pune, Maharashtra', null, null, '🛡️', 'active', now);

    const insertEq = db.prepare(`
      INSERT INTO equipment (name, category, hp, price, unit, status, owner_id, owner_name, owner_phone, location, rating, total_rentals, img, description, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertEq.run('John Deere 5050D', 'Tractor', '50 HP', 2500, 'day', 'Available', 'usr_owner_1', 'Balwinder Singh', '+91 98765 43211', 'Pune & Western Maharashtra', 4.9, 42, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&auto=format&fit=crop&q=80', 'High-torque 50HP John Deere tractor with power steering and dual clutch.', now);
    insertEq.run('New Holland Harvester TC5.30', 'Harvester', '130 HP', 6500, 'day', 'Available', 'usr_owner_1', 'Balwinder Singh', '+91 98765 43211', 'Ludhiana & Northern Region', 4.8, 28, 'https://images.unsplash.com/photo-1599059813005-11265ba4b4ce?w=600&auto=format&fit=crop&q=80', 'Advanced multi-crop combine harvester suitable for wheat and paddy.', now);
    insertEq.run('Landforce Heavy Rotavator (7 Feet)', 'Rotavator', '45-60 HP', 1200, 'day', 'Available', 'usr_owner_1', 'Balwinder Singh', '+91 98765 43211', 'Satara, Maharashtra', 4.7, 35, 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600&auto=format&fit=crop&q=80', 'Heavy-duty multi-speed gearbox rotavator with boron steel blades.', now);
    insertEq.run('Universal 9-Row Seed Drill Machine', 'Seed Drill', '35 HP', 900, 'day', 'Available', 'usr_owner_1', 'Balwinder Singh', '+91 98765 43211', 'Pune, Maharashtra', 4.9, 19, 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=600&auto=format&fit=crop&q=80', 'Precision seed cum fertilizer drill machine for uniform depth.', now);

    const insertBk = db.prepare(`
      INSERT INTO bookings (id, equipment_id, equipment_name, equipment_img, farmer_id, farmer_name, farmer_phone, owner_id, owner_name, start_date, end_date, days, daily_rate, total_amount, status, payment_status, location, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertBk.run('BK-1001', 1, 'John Deere 5050D', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&auto=format&fit=crop&q=80', 'usr_farmer_1', 'Ramesh Patil', '9876543210', 'usr_owner_1', 'Balwinder Singh', '2026-08-25', '2026-08-27', 3, 2500, 7500, 'Confirmed', 'Paid', 'Satara, Maharashtra', now);
    insertBk.run('BK-1002', 3, 'Landforce Heavy Rotavator (7 Feet)', 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600&auto=format&fit=crop&q=80', 'usr_farmer_1', 'Ramesh Patil', '9876543210', 'usr_owner_1', 'Balwinder Singh', '2026-08-15', '2026-08-16', 2, 1200, 2400, 'Completed', 'Paid', 'Satara, Maharashtra', now);
    console.log('✅ SQLite fallback database seeded.');
  }
}

// Helper: Convert query placeholders from sqlite/mysql ? to match mysql requirements if needed
// Both drivers support positional ? parameters, so we can use standard ? syntax.
function cleanParams(params) {
  return Array.isArray(params) ? params : [params];
}

module.exports = {
  getDriver: () => dbDriver,

  get: async (sql, params = []) => {
    const args = cleanParams(params);
    if (dbDriver === 'mysql') {
      const [rows] = await mysqlPool.execute(sql, args);
      return rows[0] || null;
    } else {
      return sqliteDb.prepare(sql).get(...args);
    }
  },

  all: async (sql, params = []) => {
    const args = cleanParams(params);
    if (dbDriver === 'mysql') {
      const [rows] = await mysqlPool.execute(sql, args);
      return rows;
    } else {
      return sqliteDb.prepare(sql).all(...args);
    }
  },

  run: async (sql, params = []) => {
    const args = cleanParams(params);
    if (dbDriver === 'mysql') {
      const [result] = await mysqlPool.execute(sql, args);
      return {
        lastInsertRowid: result.insertId,
        changes: result.affectedRows
      };
    } else {
      const info = sqliteDb.prepare(sql).run(...args);
      return {
        lastInsertRowid: info.lastInsertRowid,
        changes: info.changes
      };
    }
  }
};
