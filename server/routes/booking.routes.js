const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

/**
 * GET /api/bookings
 * Protected: List bookings relevant to current authenticated user
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    let sql = 'SELECT * FROM bookings';
    const params = [];

    if (req.user.role === 'farmer') {
      sql += ' WHERE farmer_id = ?';
      params.push(req.user.id);
    } else if (req.user.role === 'owner') {
      sql += ' WHERE owner_id = ?';
      params.push(req.user.id);
    } // admin sees all bookings

    sql += ' ORDER BY created_at DESC';

    const list = await db.all(sql, params);
    return res.json({
      success: true,
      count: list.length,
      bookings: list
    });
  } catch (err) {
    console.error('Fetch Bookings Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve bookings.' });
  }
});

/**
 * GET /api/bookings/:id
 * Protected: Get specific booking details & itemized receipt calculation
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const booking = await db.get('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    // Role check: farmer, owner of this equipment, or admin
    if (req.user.role !== 'admin' && booking.farmer_id !== req.user.id && booking.owner_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized to view this booking receipt.' });
    }

    const gst = Math.round(booking.total_amount * 0.05);
    const grandTotal = booking.total_amount + gst;

    return res.json({
      success: true,
      booking,
      receipt: {
        invoiceNumber: booking.id,
        bookingDate: booking.created_at,
        equipment: booking.equipment_name,
        renterName: booking.farmer_name,
        renterPhone: booking.farmer_phone,
        ownerName: booking.owner_name,
        startDate: booking.start_date,
        endDate: booking.end_date,
        durationDays: booking.days,
        dailyRate: booking.daily_rate,
        subtotal: booking.total_amount,
        gstRate: '5%',
        gstAmount: gst,
        grandTotal: grandTotal,
        paymentStatus: booking.payment_status
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve receipt details.' });
  }
});

/**
 * POST /api/bookings
 * Protected: Create a new equipment booking
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { equipmentId, startDate, endDate, location } = req.body;

    if (!equipmentId || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Equipment ID, start date, and end date are required.' });
    }

    const eq = await db.get('SELECT * FROM equipment WHERE id = ?', [equipmentId]);
    if (!eq) {
      return res.status(404).json({ success: false, message: 'Equipment not found.' });
    }

    const sDate = new Date(startDate);
    const eDate = new Date(endDate);
    const diffTime = Math.max(1, (eDate - sDate) / (1000 * 60 * 60 * 24));
    const days = isNaN(diffTime) ? 1 : Math.max(1, Math.round(diffTime));
    const totalAmount = eq.price * days;

    const bookingId = 'BK-' + Math.floor(1000 + Math.random() * 9000);
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    await db.run(
      `INSERT INTO bookings (id, equipment_id, equipment_name, equipment_img, farmer_id, farmer_name, farmer_phone, owner_id, owner_name, start_date, end_date, days, daily_rate, total_amount, status, payment_status, location, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Confirmed', 'Paid', ?, ?)`,
      [
        bookingId,
        eq.id,
        eq.name,
        eq.img,
        req.user.id,
        req.user.name,
        req.user.mobile,
        eq.owner_id,
        eq.owner_name,
        startDate,
        endDate,
        days,
        eq.price,
        totalAmount,
        location || req.user.location || 'Maharashtra, India',
        now
      ]
    );

    // Increment rentals count on equipment
    await db.run('UPDATE equipment SET total_rentals = total_rentals + 1 WHERE id = ?', [eq.id]);

    const newBooking = await db.get('SELECT * FROM bookings WHERE id = ?', [bookingId]);

    return res.status(201).json({
      success: true,
      message: `Booking ${bookingId} confirmed successfully!`,
      booking: newBooking
    });
  } catch (err) {
    console.error('Create Booking Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create booking.' });
  }
});

/**
 * PATCH /api/bookings/:id/status
 * Protected: Update booking status (Confirmed, Completed, Cancelled, Pending)
 */
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];

    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ success: false, message: `Status must be one of: ${allowed.join(', ')}` });
    }

    const booking = await db.get('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    // Check permissions
    if (req.user.role !== 'admin' && booking.farmer_id !== req.user.id && booking.owner_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You do not have permission to modify this booking.' });
    }

    await db.run('UPDATE bookings SET status = ? WHERE id = ?', [status, req.params.id]);
    const updated = await db.get('SELECT * FROM bookings WHERE id = ?', [req.params.id]);

    return res.json({
      success: true,
      message: `Booking ${req.params.id} updated to ${status}.`,
      booking: updated
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update booking status.' });
  }
});

module.exports = router;
