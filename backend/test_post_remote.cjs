const https = require('https');

const data = JSON.stringify({
  name: "Test Course",
  code: "TST",
  duration: 4,
  credits: 160,
  semesters: 8
});

const options = {
  hostname: 'exam-proctar.onrender.com',
  path: '/api/superadmin/courses',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, res => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log(`POST Course Status: ${res.statusCode}`);
    console.log(`POST Course Body: ${body.substring(0, 100)}`);
  });
});

req.on('error', error => {
  console.error(error);
});

req.write(data);
req.end();
