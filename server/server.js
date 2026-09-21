const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');

// Initialize database
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files from the parent directory
const frontendDir = path.join(__dirname, '..');
app.use(express.static(frontendDir));

// API Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/equipment', require('./routes/equipment.routes'));
app.use('/api/bookings', require('./routes/booking.routes'));
app.use('/api/admin', require('./routes/admin.routes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'FarmRent Backend API',
    database: db.getDriver() === 'mysql' ? 'MySQL (Connection Pool)' : 'SQLite (node:sqlite)'
  });
});

// Fallback route for SPA / frontend entry
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendDir, 'index.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚜 FarmRent Backend API Server is running on port ${PORT}`);
  console.log(`🌐 Frontend Portal: http://localhost:${PORT}`);
  console.log(`📊 API Health:     http://localhost:${PORT}/api/health`);
  console.log(`📦 Database:       ${db.getDriver() === 'mysql' ? 'MySQL Workbench Schema' : 'SQLite fallback'}`);
  console.log(`======================================================\n`);
});

module.exports = app;
