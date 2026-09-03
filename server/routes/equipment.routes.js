const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

/**
 * GET /api/equipment
 * List all available machinery with search & category filters
 */
router.get('/', async (req, res) => {
  try {
    const { name, category, location, ownerId, status } = req.query;

    let sql = 'SELECT * FROM equipment WHERE 1=1';
    const params = [];

    if (name) {
      sql += ' AND lower(name) LIKE ?';
      params.push(`%${name.trim().toLowerCase()}%`);
    }

    if (category) {
      sql += ' AND lower(category) LIKE ?';
      params.push(`%${category.trim().toLowerCase()}%`);
    }

    if (location) {
      sql += ' AND lower(location) LIKE ?';
      params.push(`%${location.trim().toLowerCase()}%`);
    }

    if (ownerId) {
      sql += ' AND owner_id = ?';
      params.push(ownerId);
    }

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    sql += ' ORDER BY id DESC';

    const items = await db.all(sql, params);
    return res.json({
      success: true,
      count: items.length,
      equipment: items
    });
  } catch (err) {
    console.error('List Equipment Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch equipment catalog.' });
  }
});

/**
 * GET /api/equipment/:id
 * Get details for a single machine
 */
router.get('/:id', async (req, res) => {
  try {
    const item = await db.get('SELECT * FROM equipment WHERE id = ?', [req.params.id]);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Equipment not found.' });
    }
    return res.json({ success: true, equipment: item });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch equipment details.' });
  }
});

/**
 * POST /api/equipment
 * Protected (Owner / Admin): Publish new equipment for rent
 */
router.post('/', authenticateToken, requireRole('owner', 'admin'), async (req, res) => {
  try {
    const { name, category, hp, price, unit, location, img, description } = req.body;

    if (!name || !category || !price) {
      return res.status(400).json({ success: false, message: 'Name, category, and daily price are required.' });
    }

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const defaultImg = img || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&auto=format&fit=crop&q=80';

    const result = await db.run(
      `INSERT INTO equipment (name, category, hp, price, unit, status, owner_id, owner_name, owner_phone, location, rating, total_rentals, img, description, created_at)
       VALUES (?, ?, ?, ?, ?, 'Available', ?, ?, ?, ?, 5.0, 0, ?, ?, ?)`,
      [
        name.trim(),
        category,
        hp || 'Standard',
        Number(price),
        unit || 'day',
        req.user.id,
        req.user.name,
        req.user.mobile,
        location || req.user.location || 'Pune, Maharashtra',
        defaultImg,
        description || '',
        now
      ]
    );

    const newEquipment = await db.get('SELECT * FROM equipment WHERE id = ?', [result.lastInsertRowid]);

    return res.status(201).json({
      success: true,
      message: `Equipment "${name}" successfully listed for rent!`,
      equipment: newEquipment
    });
  } catch (err) {
    console.error('Create Equipment Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create equipment listing.' });
  }
});

/**
 * PATCH /api/equipment/:id
 * Protected (Owner / Admin): Update equipment or toggle status (Available/Maintenance)
 */
router.patch('/:id', authenticateToken, requireRole('owner', 'admin'), async (req, res) => {
  try {
    const item = await db.get('SELECT * FROM equipment WHERE id = ?', [req.params.id]);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Equipment not found.' });
    }

    // Ensure only owner or admin can modify
    if (req.user.role !== 'admin' && item.owner_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You do not have permission to modify this machinery.' });
    }

    const { name, category, hp, price, status, location, description } = req.body;

    await db.run(
      `UPDATE equipment
       SET name = COALESCE(?, name),
           category = COALESCE(?, category),
           hp = COALESCE(?, hp),
           price = COALESCE(?, price),
           status = COALESCE(?, status),
           location = COALESCE(?, location),
           description = COALESCE(?, description)
       WHERE id = ?`,
      [
        name,
        category,
        hp,
        price ? Number(price) : null,
        status,
        location,
        description,
        req.params.id
      ]
    );

    const updated = await db.get('SELECT * FROM equipment WHERE id = ?', [req.params.id]);

    return res.json({
      success: true,
      message: 'Equipment details updated successfully.',
      equipment: updated
    });
  } catch (err) {
    console.error('Update Equipment Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update equipment.' });
  }
});

/**
 * DELETE /api/equipment/:id
 * Protected (Owner / Admin): Delete equipment listing
 */
router.delete('/:id', authenticateToken, requireRole('owner', 'admin'), async (req, res) => {
  try {
    const item = await db.get('SELECT * FROM equipment WHERE id = ?', [req.params.id]);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Equipment not found.' });
    }

    if (req.user.role !== 'admin' && item.owner_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You do not have permission to delete this listing.' });
    }

    await db.run('DELETE FROM equipment WHERE id = ?', [req.params.id]);

    return res.json({
      success: true,
      message: 'Equipment listing successfully deleted.'
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete equipment.' });
  }
});

module.exports = router;
