const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5002,
  path: '/api/auth/departments',
  method: 'GET'
};

const req = http.request(options, res => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Body: ${body.substring(0, 200)}`);
  });
});

req.on('error', error => {
  console.error(error);
});

req.end();
