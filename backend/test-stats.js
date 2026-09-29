async function test() {
  try {
    console.log('Logging in...');
    const loginRes = await fetch('http://localhost:5555/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@hirate.in',
        password: 'Admin@123456'
      })
    });
    const loginData = await loginRes.json();
    if (!loginData.success) throw new Error(loginData.message);
    const token = loginData.data.token;
    console.log('Login successful');

    console.log('Fetching stats...');
    const statsRes = await fetch('http://localhost:5555/api/v1/master/stats', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const statsData = await statsRes.json();
    console.log('Stats successful:', statsData);
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
