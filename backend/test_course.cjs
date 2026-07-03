const http = require('http');

const data = JSON.stringify({
  name: "Test Course",
  code: "TST",
  duration: 4,
  credits: 160,
  semesters: 8
});

const options = {
  hostname: 'localhost',
  port: 5002,
  path: '/api/superadmin/courses',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, res => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Body: ${body}`);
  });
});

req.on('error', error => {
  console.error(error);
});

req.write(data);
req.end();
