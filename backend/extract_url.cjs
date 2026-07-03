const https = require('https');

https.get('https://exam-proctar.vercel.app/', (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    const match = body.match(/assets\/index-[a-zA-Z0-9]*\.js/);
    if (match) {
      https.get('https://exam-proctar.vercel.app/' + match[0], (jsRes) => {
        let jsBody = '';
        jsRes.on('data', chunk => jsBody += chunk);
        jsRes.on('end', () => {
          const apiMatch = jsBody.match(/https:\/\/[a-zA-Z0-9.-]+\.onrender\.com/g);
          console.log('Found APIs:', [...new Set(apiMatch)]);
        });
      });
    } else {
      console.log('No JS bundle found');
    }
  });
});
