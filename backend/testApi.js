async function testApi() {
  try {
    const loginRes = await fetch('http://localhost:5002/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@nexusproctor.com', password: 'Admin@123' })
    });
    
    const loginData = await loginRes.json();
    console.log('Login Response:', loginData);
    
    if (!loginData.token) {
      console.log('No token received!');
      return;
    }
    
    const createRes = await fetch('http://localhost:5002/api/superadmin/departments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${loginData.token}`
      },
      body: JSON.stringify({ name: 'Test Dept 2', code: 'TEST2' })
    });
    
    const createData = await createRes.json();
    console.log('Create Dept Response:', createRes.status, createData);
  } catch (err) {
    console.error(err);
  }
}

testApi();
