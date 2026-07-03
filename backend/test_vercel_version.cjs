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
          // Look for 'Current Streak' text that I added earlier today to the Student Dashboard
          if (jsBody.includes('Current Streak')) {
            console.log('Frontend HAS the recent updates (Current Streak found)');
          } else {
            console.log('Frontend DOES NOT have recent updates');
          }
          // Look for 'Failed to delete department'
          if (jsBody.includes('Failed to delete department')) {
            console.log('Frontend HAS the department error fix');
          } else {
            console.log('Frontend DOES NOT have the department error fix');
          }
        });
      });
    }
  });
});
