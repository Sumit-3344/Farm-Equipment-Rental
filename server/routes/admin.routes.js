const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

/**
 * All admin routes require admin role
 */
router.use(authenticateToken, requireRole('admin'));

/**
 * GET /api/admin/users
 * List all users with status & role details
 */
router.get('/users', async (req, res) => {
  try {
    const users = await db.all(
      'SELECT id, name, email, mobile, role, location, equipment_type, farm_size, avatar, status, created_at FROM users ORDER BY created_at DESC'
    );
    return res.json({ success: true, count: users.length, users });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve users directory.' });
  }
});

/**
 * PATCH /api/admin/users/:id/status
 * Toggle user account status (active / suspended)
 */
router.patch('/users/:id/status', async (req, res) => {
  try {
    const user = await db.get('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot suspend an admin account.' });
    }

    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    await db.run('UPDATE users SET status = ? WHERE id = ?', [newStatus, user.id]);

    return res.json({
      success: true,
      message: `User ${user.name} is now ${newStatus}.`,
      status: newStatus
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update user status.' });
  }
});

/**
 * GET /api/admin/stats
 * Platform wide metrics and telemetry
 */
router.get('/stats', async (req, res) => {
  try {
    const totalUsersResult = await db.get('SELECT COUNT(*) as count FROM users');
    const totalUsers = totalUsersResult ? totalUsersResult.count : 0;

    const farmersCountResult = await db.get("SELECT COUNT(*) as count FROM users WHERE role = 'farmer'");
    const farmersCount = farmersCountResult ? farmersCountResult.count : 0;

    const ownersCountResult = await db.get("SELECT COUNT(*) as count FROM users WHERE role = 'owner'");
    const ownersCount = ownersCountResult ? ownersCountResult.count : 0;

    const totalEquipmentResult = await db.get('SELECT COUNT(*) as count FROM equipment');
    const totalEquipment = totalEquipmentResult ? totalEquipmentResult.count : 0;

    const activeEquipmentResult = await db.get("SELECT COUNT(*) as count FROM equipment WHERE status = 'Available'");
    const activeEquipment = activeEquipmentResult ? activeEquipmentResult.count : 0;

    const totalBookingsResult = await db.get('SELECT COUNT(*) as count FROM bookings');
    const totalBookings = totalBookingsResult ? totalBookingsResult.count : 0;

    const activeRentalsResult = await db.get("SELECT COUNT(*) as count FROM bookings WHERE status = 'Confirmed'");
    const activeRentals = activeRentalsResult ? activeRentalsResult.count : 0;

    const totalVolumeResult = await db.get("SELECT COALESCE(SUM(total_amount), 0) as total FROM bookings WHERE status != 'Cancelled'");
    const totalVolume = totalVolumeResult ? totalVolumeResult.total : 0;

    return res.json({
      success: true,
      stats: {
        totalUsers,
        farmersCount,
        ownersCount,
        totalEquipment,
        activeEquipment,
        totalBookings,
        activeRentals,
        totalVolume,
        platformCommission: Math.round(totalVolume * 0.10) // 10% platform fee
      }
    });
  } catch (err) {
    console.error('Stats Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to compute platform stats.' });
  }
});

module.exports = router;
