const https = require('https');

https.get('https://exam-proctar.onrender.com/api/test', (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log(`Test API Status: ${res.statusCode}`);
    console.log(`Test API Body: ${body}`);
  });
});

https.get('https://exam-proctar.onrender.com/api/auth/departments', (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log(`Auth Departments Status: ${res.statusCode}`);
    console.log(`Auth Departments Body: ${body.substring(0, 100)}`);
  });
});
