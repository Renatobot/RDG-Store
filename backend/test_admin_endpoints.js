const axios = require('axios');
const jwt = require('jsonwebtoken');

async function testAdmin() {
  const API_BASE = 'https://backend-pink-one-92.vercel.app';
  const JWT_SECRET = 'rdg_super_secret_key_2026';
  
  // Create an admin token for testing (for user id 2 - Renato DEV)
  const token = jwt.sign({ id: 2, role: 'ADMIN' }, JWT_SECRET, { expiresIn: '7d' });
  const authHeaders = { Authorization: `Bearer ${token}` };

  const endpoints = [
    { method: 'GET', url: `${API_BASE}/api/auth/me`, headers: authHeaders },
    { method: 'GET', url: `${API_BASE}/api/orders`, headers: authHeaders },
    { method: 'GET', url: `${API_BASE}/api/products`, headers: authHeaders },
    { method: 'GET', url: `${API_BASE}/api/banners`, headers: authHeaders },
    { method: 'GET', url: `${API_BASE}/api/users/admin/list`, headers: authHeaders },
    { method: 'GET', url: `${API_BASE}/api/coupons`, headers: authHeaders },
    { method: 'GET', url: `${API_BASE}/api/settings`, headers: authHeaders },
    { method: 'GET', url: `${API_BASE}/api/credentials`, headers: authHeaders }
  ];

  for (const ep of endpoints) {
    try {
      const res = await axios({
        method: ep.method,
        url: ep.url,
        headers: ep.headers,
        timeout: 10000
      });
      console.log(`[OK] ${ep.url} -> Status: ${res.status} | Data length/type: ${Array.isArray(res.data) ? res.data.length : typeof res.data}`);
    } catch (err) {
      console.error(`[FAIL] ${ep.url} -> Status: ${err.response?.status} | Error:`, err.response?.data || err.message);
    }
  }
}

testAdmin();
