-- ============================================================================
-- 🚜 FarmRent — Farm Equipment Rental System Database Script
-- Compatible with MySQL Workbench 8.0+ & MySQL Server 8.0+
-- ============================================================================

-- 1. Create and Select Database
CREATE DATABASE IF NOT EXISTS `farmrent` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `farmrent`;

-- Disable Foreign Key checks temporarily for clean drop/recreate
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `reviews`;
DROP TABLE IF EXISTS `otps`;
DROP TABLE IF EXISTS `bookings`;
DROP TABLE IF EXISTS `equipment`;
DROP TABLE IF EXISTS `users`;
DROP VIEW IF EXISTS `v_active_rentals`;
DROP VIEW IF EXISTS `v_equipment_summary`;
DROP VIEW IF EXISTS `v_owner_earnings`;
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- 2. Table Structures
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: users
-- Stores Farmers, Equipment Owners, and System Administrators
-- ----------------------------------------------------------------------------
CREATE TABLE `users` (
  `id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `mobile` VARCHAR(20) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('farmer', 'owner', 'admin') NOT NULL DEFAULT 'farmer',
  `location` VARCHAR(200) NULL,
  `equipment_type` VARCHAR(150) NULL,
  `farm_size` VARCHAR(50) NULL,
  `avatar` VARCHAR(50) NULL DEFAULT '👨‍🌾',
  `status` ENUM('active', 'suspended') NOT NULL DEFAULT 'active',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_users_email` (`email`),
  UNIQUE KEY `uk_users_mobile` (`mobile`),
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table: equipment
-- Stores Agricultural Machinery (Tractors, Harvesters, Implements)
-- ----------------------------------------------------------------------------
CREATE TABLE `equipment` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `hp` VARCHAR(50) NULL,
  `price` DECIMAL(10,2) NOT NULL,
  `unit` VARCHAR(20) NOT NULL DEFAULT 'day',
  `status` ENUM('Available', 'Rented', 'Maintenance') NOT NULL DEFAULT 'Available',
  `owner_id` VARCHAR(50) NOT NULL,
  `owner_name` VARCHAR(100) NOT NULL,
  `owner_phone` VARCHAR(20) NULL,
  `location` VARCHAR(200) NULL,
  `rating` DECIMAL(3,2) NOT NULL DEFAULT 5.00,
  `total_rentals` INT NOT NULL DEFAULT 0,
  `img` TEXT NOT NULL,
  `description` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_equipment_owner` (`owner_id`),
  INDEX `idx_equipment_category` (`category`),
  INDEX `idx_equipment_status` (`status`),
  CONSTRAINT `fk_equipment_owner` 
    FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table: bookings
-- Stores Equipment Hire Orders, Dates, Durations, and Financial Totals
-- ----------------------------------------------------------------------------
CREATE TABLE `bookings` (
  `id` VARCHAR(50) NOT NULL,
  `equipment_id` INT NOT NULL,
  `equipment_name` VARCHAR(150) NOT NULL,
  `equipment_img` TEXT NOT NULL,
  `farmer_id` VARCHAR(50) NOT NULL,
  `farmer_name` VARCHAR(100) NOT NULL,
  `farmer_phone` VARCHAR(20) NULL,
  `owner_id` VARCHAR(50) NOT NULL,
  `owner_name` VARCHAR(100) NOT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `days` INT NOT NULL,
  `daily_rate` DECIMAL(10,2) NOT NULL,
  `total_amount` DECIMAL(10,2) NOT NULL,
  `status` ENUM('Pending', 'Confirmed', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Confirmed',
  `payment_status` ENUM('Paid', 'Pending', 'Refunded') NOT NULL DEFAULT 'Paid',
  `location` VARCHAR(200) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_bookings_farmer` (`farmer_id`),
  INDEX `idx_bookings_owner` (`owner_id`),
  INDEX `idx_bookings_equipment` (`equipment_id`),
  INDEX `idx_bookings_status` (`status`),
  CONSTRAINT `fk_bookings_farmer` 
    FOREIGN KEY (`farmer_id`) REFERENCES `users` (`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_bookings_owner` 
    FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_bookings_equipment` 
    FOREIGN KEY (`equipment_id`) REFERENCES `equipment` (`id`) 
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table: otps
-- Stores Mobile Verification Codes with Expiration Windows
-- ----------------------------------------------------------------------------
CREATE TABLE `otps` (
  `mobile` VARCHAR(20) NOT NULL,
  `code` VARCHAR(10) NOT NULL,
  `expires_at` BIGINT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`mobile`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table: reviews
-- Stores Farmer Reviews & Ratings for Equipment
-- ----------------------------------------------------------------------------
CREATE TABLE `reviews` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `booking_id` VARCHAR(50) NULL,
  `equipment_id` INT NOT NULL,
  `farmer_id` VARCHAR(50) NOT NULL,
  `rating` INT NOT NULL CHECK (`rating` BETWEEN 1 AND 5),
  `comment` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_reviews_equipment` (`equipment_id`),
  INDEX `idx_reviews_farmer` (`farmer_id`),
  CONSTRAINT `fk_reviews_equipment` 
    FOREIGN KEY (`equipment_id`) REFERENCES `equipment` (`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_reviews_farmer` 
    FOREIGN KEY (`farmer_id`) REFERENCES `users` (`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 3. Views for MySQL Workbench Reporting & Analytics
-- ============================================================================

-- View: Active Rentals with Farmer & Owner Contact Information
CREATE OR REPLACE VIEW `v_active_rentals` AS
SELECT 
  b.id AS booking_id,
  b.equipment_name,
  e.category,
  b.farmer_name,
  b.farmer_phone,
  b.owner_name,
  b.start_date,
  b.end_date,
  b.days,
  b.daily_rate,
  b.total_amount,
  b.status,
  b.payment_status,
  b.location
FROM bookings b
JOIN equipment e ON b.equipment_id = e.id
WHERE b.status = 'Confirmed'
ORDER BY b.start_date ASC;

-- View: Equipment Fleet Summary with Rental Counts
CREATE OR REPLACE VIEW `v_equipment_summary` AS
SELECT 
  e.id,
  e.name AS equipment_name,
  e.category,
  e.hp,
  e.price AS daily_rate,
  e.status,
  e.owner_name,
  e.location,
  e.rating,
  COUNT(b.id) AS total_bookings_count,
  COALESCE(SUM(CASE WHEN b.status != 'Cancelled' THEN b.total_amount ELSE 0 END), 0) AS total_revenue_generated
FROM equipment e
LEFT JOIN bookings b ON e.id = b.equipment_id
GROUP BY e.id, e.name, e.category, e.hp, e.price, e.status, e.owner_name, e.location, e.rating;

-- View: Owner Earnings & Metrics Aggregation
CREATE OR REPLACE VIEW `v_owner_earnings` AS
SELECT 
  u.id AS owner_id,
  u.name AS owner_name,
  u.email,
  u.mobile,
  COUNT(DISTINCT e.id) AS total_machines_listed,
  COUNT(b.id) AS total_rental_requests,
  COALESCE(SUM(CASE WHEN b.status != 'Cancelled' THEN b.total_amount ELSE 0 END), 0) AS gross_earnings,
  ROUND(COALESCE(SUM(CASE WHEN b.status != 'Cancelled' THEN b.total_amount ELSE 0 END), 0) * 0.90, 2) AS net_owner_payout
FROM users u
LEFT JOIN equipment e ON u.id = e.owner_id
LEFT JOIN bookings b ON u.id = b.owner_id
WHERE u.role = 'owner'
GROUP BY u.id, u.name, u.email, u.mobile;

-- ============================================================================
-- 4. Initial Seed Data (Demo Users, Fleet, Bookings, Reviews)
-- Passwords below are hashed using standard bcrypt (10 rounds):
--   'farmer@farmrent.com' -> farmer123
--   'owner@farmrent.com'  -> owner123
--   'admin@farmrent.com'  -> admin123
-- ============================================================================

-- Insert Users
INSERT INTO `users` (`id`, `name`, `email`, `mobile`, `password_hash`, `role`, `location`, `equipment_type`, `farm_size`, `avatar`, `status`, `created_at`) VALUES
('usr_farmer_1', 'Ramesh Patil', 'farmer@farmrent.com', '9876543210', '$2a$10$7mR9IVur.lHsS85Z18qxN.MpB9MFEG1WJhRIMNlujotL7Su9orUoW', 'farmer', 'Satara, Maharashtra', NULL, '15 Acres', '👨‍🌾', 'active', NOW()),
('usr_owner_1', 'Balwinder Singh', 'owner@farmrent.com', '9876543211', '$2a$10$2zyWcD6XgmoNVUBbklRHE.FergrHRG5AVH0LyNoKruzpj47/a7Yja', 'owner', 'Ludhiana, Punjab', 'Tractors & Harvesters', NULL, '🚜', 'active', NOW()),
('usr_admin_1', 'FarmRent Admin', 'admin@farmrent.com', '9876543212', '$2a$10$Zd0X3r09vhX5Y6cM1ITn5.BQygnR5j0.sLhtz0yNLM3bjHsCjcEoe', 'admin', 'Pune, Maharashtra', NULL, NULL, '🛡️', 'active', NOW()),
('usr_farmer_2', 'Suresh Deshmukh', 'suresh.farmer@gmail.com', '9876543213', '$2a$10$7mR9IVur.lHsS85Z18qxN.MpB9MFEG1WJhRIMNlujotL7Su9orUoW', 'farmer', 'Nashik, Maharashtra', NULL, '25 Acres', '👨‍🌾', 'active', NOW()),
('usr_owner_2', 'Kisan Agrotech Solutions', 'kisan.agro@farmrent.com', '9876543214', '$2a$10$2zyWcD6XgmoNVUBbklRHE.FergrHRG5AVH0LyNoKruzpj47/a7Yja', 'owner', 'Pune, Maharashtra', 'Custom Hiring Center', NULL, '🚜', 'active', NOW());

-- Insert Equipment
INSERT INTO `equipment` (`id`, `name`, `category`, `hp`, `price`, `unit`, `status`, `owner_id`, `owner_name`, `owner_phone`, `location`, `rating`, `total_rentals`, `img`, `description`, `created_at`) VALUES
(1, 'John Deere 5050D', 'Tractor', '50 HP', 2500.00, 'day', 'Available', 'usr_owner_1', 'Balwinder Singh', '+91 98765 43211', 'Pune & Western Maharashtra', 4.90, 42, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&auto=format&fit=crop&q=80', 'High-torque 50HP John Deere tractor with power steering and dual clutch. Ideal for ploughing, rotavation, and heavy haulage.', NOW()),
(2, 'New Holland Harvester TC5.30', 'Harvester', '130 HP', 6500.00, 'day', 'Available', 'usr_owner_1', 'Balwinder Singh', '+91 98765 43211', 'Ludhiana & Northern Region', 4.80, 28, 'https://images.unsplash.com/photo-1599059813005-11265ba4b4ce?w=600&auto=format&fit=crop&q=80', 'Advanced multi-crop combine harvester suitable for wheat, paddy, soybean, and pulses with minimal grain loss.', NOW()),
(3, 'Landforce Heavy Rotavator (7 Feet)', 'Rotavator', '45-60 HP', 1200.00, 'day', 'Available', 'usr_owner_1', 'Balwinder Singh', '+91 98765 43211', 'Satara, Maharashtra', 4.70, 35, 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600&auto=format&fit=crop&q=80', 'Heavy-duty multi-speed gearbox rotavator with boron steel blades for superior soil pulverization and seedbed preparation.', NOW()),
(4, 'Universal 9-Row Seed Drill Machine', 'Seed Drill', '35 HP', 900.00, 'day', 'Available', 'usr_owner_1', 'Balwinder Singh', '+91 98765 43211', 'Pune, Maharashtra', 4.90, 19, 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=600&auto=format&fit=crop&q=80', 'Precision seed cum fertilizer drill machine for uniform depth and spacing during sowing season.', NOW()),
(5, 'Mahindra 575 DI Sarpanch', 'Tractor', '45 HP', 2200.00, 'day', 'Available', 'usr_owner_2', 'Kisan Agrotech Solutions', '+91 98765 43214', 'Nashik, Maharashtra', 4.85, 14, 'https://images.unsplash.com/photo-1589876164627-2dfbc6f96614?w=600&auto=format&fit=crop&q=80', 'Fuel efficient 4-cylinder engine Mahindra tractor with high backup torque for heavy field cultivation.', NOW()),
(6, 'Aspee 500L Tractor Boom Sprayer', 'Sprayer', '30 HP+', 800.00, 'day', 'Available', 'usr_owner_2', 'Kisan Agrotech Solutions', '+91 98765 43214', 'Pune, Maharashtra', 4.75, 11, 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=600&auto=format&fit=crop&q=80', '500 Litre tractor mounted boom sprayer with 12 meter spray width for pesticide and foliar fertilizer application.', NOW());

-- Insert Bookings
INSERT INTO `bookings` (`id`, `equipment_id`, `equipment_name`, `equipment_img`, `farmer_id`, `farmer_name`, `farmer_phone`, `owner_id`, `owner_name`, `start_date`, `end_date`, `days`, `daily_rate`, `total_amount`, `status`, `payment_status`, `location`, `created_at`) VALUES
('BK-1001', 1, 'John Deere 5050D', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&auto=format&fit=crop&q=80', 'usr_farmer_1', 'Ramesh Patil', '9876543210', 'usr_owner_1', 'Balwinder Singh', '2026-08-25', '2026-08-27', 3, 2500.00, 7500.00, 'Confirmed', 'Paid', 'Satara, Maharashtra', NOW()),
('BK-1002', 3, 'Landforce Heavy Rotavator (7 Feet)', 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600&auto=format&fit=crop&q=80', 'usr_farmer_1', 'Ramesh Patil', '9876543210', 'usr_owner_1', 'Balwinder Singh', '2026-08-15', '2026-08-16', 2, 1200.00, 2400.00, 'Completed', 'Paid', 'Satara, Maharashtra', NOW()),
('BK-1003', 5, 'Mahindra 575 DI Sarpanch', 'https://images.unsplash.com/photo-1589876164627-2dfbc6f96614?w=600&auto=format&fit=crop&q=80', 'usr_farmer_2', 'Suresh Deshmukh', '9876543213', 'usr_owner_2', 'Kisan Agrotech Solutions', '2026-09-02', '2026-09-05', 4, 2200.00, 8800.00, 'Confirmed', 'Paid', 'Nashik, Maharashtra', NOW());

-- Insert Reviews
INSERT INTO `reviews` (`booking_id`, `equipment_id`, `farmer_id`, `rating`, `comment`, `created_at`) VALUES
('BK-1002', 3, 'usr_farmer_1', 5, 'Excellent rotavator performance, finely pulverized my sugarcane soil within hours. Highly recommended!', NOW()),
('BK-1001', 1, 'usr_farmer_1', 5, 'Tractor was delivered in top condition with full tank fuel. Owner is very supportive.', NOW());

-- ============================================================================
-- 5. Verification Queries for Workbench Query Tab
-- ============================================================================
SELECT '✅ Database farmrent created successfully!' AS Status;
SELECT COUNT(*) AS total_users FROM users;
SELECT COUNT(*) AS total_equipment FROM equipment;
SELECT COUNT(*) AS total_bookings FROM bookings;
SELECT * FROM v_active_rentals;
