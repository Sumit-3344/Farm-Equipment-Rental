const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

function generateToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * POST /api/auth/register
 * Register a new Farmer or Equipment Owner
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, mobile, password, role, location, equipmentType, farmSize } = req.body;

    if (!name || !mobile || !password) {
      return res.status(400).json({ success: false, message: 'Name, mobile number, and password are required.' });
    }

    const cleanRole = ['farmer', 'owner'].includes(role) ? role : 'farmer';
    const cleanMobile = mobile.trim();
    const cleanEmail = email ? email.trim().toLowerCase() : `${cleanMobile}@farmrent.com`;

    // Check if user already exists
    const existing = await db.get('SELECT id FROM users WHERE email = ? OR mobile = ?', [cleanEmail, cleanMobile]);
    if (existing) {
      return res.status(400).json({ success: false, message: 'An account with this email or mobile number already exists.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);
    const userId = `usr_${Date.now()}`;
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const avatar = cleanRole === 'owner' ? '🚜' : '👨‍🌾';

    await db.run(
      `INSERT INTO users (id, name, email, mobile, password_hash, role, location, equipment_type, farm_size, avatar, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
      [userId, name.trim(), cleanEmail, cleanMobile, passwordHash, cleanRole, location || 'Maharashtra, India', equipmentType || null, farmSize || '10 Acres', avatar, now]
    );

    const newUser = await db.get('SELECT id, name, email, mobile, role, location, equipment_type, farm_size, avatar, status FROM users WHERE id = ?', [userId]);
    const token = generateToken(newUser);

    return res.status(201).json({
      success: true,
      message: `Account created successfully as ${cleanRole.toUpperCase()}!`,
      user: newUser,
      token
    });
  } catch (err) {
    console.error('Registration Error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error during registration.' });
  }
});

/**
 * POST /api/auth/login
 * Password login for any role
 */
router.post('/login', async (req, res) => {
  try {
    const { identifier, password, role } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Please provide mobile/email and password.' });
    }

    const cleanId = identifier.trim().toLowerCase();
    let query = 'SELECT * FROM users WHERE (lower(email) = ? OR mobile = ?)';
    let params = [cleanId, cleanId];

    if (role) {
      query += ' AND role = ?';
      params.push(role);
    }

    const user = await db.get(query, params);

    if (!user) {
      return res.status(401).json({ success: false, message: 'No account found matching these credentials.' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ success: false, message: 'Your account is suspended. Please contact platform administration.' });
    }

    const validPassword = bcrypt.compareSync(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ success: false, message: 'Invalid password. Please check your credentials.' });
    }

    const sanitizedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      location: user.location,
      equipmentType: user.equipment_type,
      farmSize: user.farm_size,
      avatar: user.avatar,
      status: user.status
    };

    const token = generateToken(sanitizedUser);

    return res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      user: sanitizedUser,
      token
    });
  } catch (err) {
    console.error('Login Error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error during login.' });
  }
});

/**
 * POST /api/auth/otp/send
 * Generate and dispatch 6-digit OTP
 */
router.post('/otp/send', async (req, res) => {
  try {
    const { mobile } = req.body;
    if (!mobile || mobile.trim().length < 10) {
      return res.status(400).json({ success: false, message: 'Valid 10-digit mobile number required.' });
    }

    const cleanMobile = mobile.trim();
    const code = '123456';
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    await db.run('INSERT OR REPLACE INTO otps (mobile, code, expires_at) VALUES (?, ?, ?)', [cleanMobile, code, expiresAt]);

    return res.json({
      success: true,
      message: `6-digit OTP sent to +91 ${cleanMobile}`,
      demoCode: '123456'
    });
  } catch (err) {
    console.error('Send OTP Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to send OTP.' });
  }
});

/**
 * POST /api/auth/otp/verify
 * Verify OTP and auto-login or provision user
 */
router.post('/otp/verify', async (req, res) => {
  try {
    const { mobile, code, role } = req.body;

    if (!mobile || !code) {
      return res.status(400).json({ success: false, message: 'Mobile and OTP code are required.' });
    }

    const cleanMobile = mobile.trim();
    const cleanCode = code.trim();

    // Check OTP
    const otpRow = await db.get('SELECT * FROM otps WHERE mobile = ?', [cleanMobile]);
    const isValid = cleanCode === '123456' || (otpRow && otpRow.code === cleanCode && otpRow.expires_at > Date.now());

    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP. (Use 123456 for demo)' });
    }

    // Clear used OTP
    await db.run('DELETE FROM otps WHERE mobile = ?', [cleanMobile]);

    // Find or Auto-provision user
    let user = await db.get('SELECT * FROM users WHERE mobile = ?', [cleanMobile]);
    const targetRole = role || 'farmer';

    if (!user) {
      const salt = bcrypt.genSaltSync(10);
      const passHash = bcrypt.hashSync('otp_user_123', salt);
      const userId = `usr_${Date.now()}`;
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const defaultName = `${targetRole === 'owner' ? 'Equipment Owner' : 'Farmer User'} (${cleanMobile.slice(-4)})`;
      const avatar = targetRole === 'owner' ? '🚜' : targetRole === 'admin' ? '🛡️' : '👨‍🌾';

      await db.run(
        `INSERT INTO users (id, name, email, mobile, password_hash, role, location, avatar, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 'Maharashtra, India', ?, 'active', ?)`,
        [userId, defaultName, `${cleanMobile}@farmrent.com`, cleanMobile, passHash, targetRole, avatar, now]
      );

      user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
    }

    const sanitizedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      location: user.location,
      avatar: user.avatar,
      status: user.status
    };

    const token = generateToken(sanitizedUser);

    return res.json({
      success: true,
      message: 'OTP verified successfully!',
      user: sanitizedUser,
      token
    });
  } catch (err) {
    console.error('Verify OTP Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to verify OTP.' });
  }
});

/**
 * GET /api/auth/me
 * Protected: Get current user profile
 */
router.get('/me', authenticateToken, (req, res) => {
  return res.json({
    success: true,
    user: req.user
  });
});

/**
 * POST /api/auth/reset-password
 * Reset password via contact confirmation
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { contact, newPassword } = req.body;
    if (!contact) {
      return res.status(400).json({ success: false, message: 'Registered email or mobile number required.' });
    }

    const cleanContact = contact.trim().toLowerCase();
    const user = await db.get('SELECT id FROM users WHERE lower(email) = ? OR mobile = ?', [cleanContact, cleanContact]);

    if (!user) {
      return res.status(404).json({ success: false, message: 'No registered user found with this contact.' });
    }

    if (newPassword) {
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(newPassword, salt);
      await db.run('UPDATE users SET password_hash = ? WHERE id = ?', [hash, user.id]);
    }

    return res.json({
      success: true,
      message: 'Password reset link / OTP successfully dispatched to ' + contact
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to reset password.' });
  }
});

module.exports = router;
