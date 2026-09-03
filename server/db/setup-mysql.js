require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function setupMySQL() {
  console.log('\n🚜 ========================================================');
  console.log('🌱 FarmRent — Automated MySQL Workbench Setup Utility');
  console.log('========================================================\n');

  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  };

  console.log(`Connecting to MySQL Server on ${config.host}:${config.port} as user '${config.user}'...`);

  try {
    const connection = await mysql.createConnection(config);
    console.log('✅ Connected to MySQL Server successfully!\n');

    const sqlFilePath = path.join(__dirname, 'farmrent_workbench_setup.sql');
    console.log(`Reading SQL Script: ${sqlFilePath}`);
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('Executing database schema creation and seed data insertion...');
    await connection.query(sqlContent);

    console.log('✅ Database `farmrent` initialized and populated successfully in MySQL Server!\n');

    // Run verification query
    const [users] = await connection.query('SELECT id, name, role, email FROM farmrent.users');
    console.log('📋 Seeded Users:');
    console.table(users);

    const [equipment] = await connection.query('SELECT id, name, category, price, status, location FROM farmrent.equipment');
    console.log('\n🚜 Seeded Equipment:');
    console.table(equipment);

    await connection.end();

    console.log('\n🎉 Setup complete! You can now open MySQL Workbench to view, query, and generate ER diagrams.\n');
  } catch (err) {
    console.error('\n❌ MySQL Setup Failed:', err.message);
    console.log('\n💡 Tip: Check your MySQL credentials in `server/.env` (DB_USER, DB_PASSWORD, DB_PORT).');
    console.log('   Alternatively, open `farmrent_workbench_setup.sql` directly in MySQL Workbench and click Execute (⚡).\n');
  }
}

setupMySQL();
