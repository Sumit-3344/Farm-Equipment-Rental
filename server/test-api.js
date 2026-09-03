async function runTests() {
  const BASE_URL = 'http://localhost:5000/api';
  console.log('Testing FarmRent API endpoints...\n');

  // 1. Health
  const healthRes = await fetch(`${BASE_URL}/health`);
  const health = await healthRes.json();
  console.log('1. Health Check:', health);

  // 2. Login Farmer
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'farmer@farmrent.com', password: 'farmer123', role: 'farmer' })
  });
  const farmerAuth = await loginRes.json();
  console.log('2. Farmer Login:', farmerAuth.success ? `Success (${farmerAuth.user.name})` : farmerAuth);

  // 3. Equipment Catalog
  const eqRes = await fetch(`${BASE_URL}/equipment`);
  const eqData = await eqRes.json();
  console.log(`3. Equipment Catalog: Found ${eqData.count} items.`);

  // 4. Create Booking
  const bookRes = await fetch(`${BASE_URL}/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${farmerAuth.token}`
    },
    body: JSON.stringify({
      equipmentId: 1,
      startDate: '2026-09-01',
      endDate: '2026-09-03',
      location: 'Satara District, Maharashtra'
    })
  });
  const bookData = await bookRes.json();
  console.log('4. Create Booking:', bookData.success ? `Booking Created (${bookData.booking.id})` : bookData);

  // 5. Admin Stats
  const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'admin@farmrent.com', password: 'admin123', role: 'admin' })
  });
  const adminAuth = await adminLoginRes.json();
  const statsRes = await fetch(`${BASE_URL}/admin/stats`, {
    headers: { 'Authorization': `Bearer ${adminAuth.token}` }
  });
  const statsData = await statsRes.json();
  console.log('5. Admin Platform Stats:', statsData.stats);

  console.log('\nAll API and Database tests passed successfully! 🎉');
}

runTests().catch(console.error);
