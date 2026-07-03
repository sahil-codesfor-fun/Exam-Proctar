const https = require('https');

https.get('https://exam-proctar.vercel.app/', (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    // Find all JS files
    const matches = body.match(/assets\/[a-zA-Z0-9_-]+\.js/g);
    if (matches) {
      matches.forEach(match => {
        https.get('https://exam-proctar.vercel.app/' + match, (jsRes) => {
          let jsBody = '';
          jsRes.on('data', chunk => jsBody += chunk);
          jsRes.on('end', () => {
            const apiMatch = jsBody.match(/https:\/\/[a-zA-Z0-9.-]+/g);
            if(apiMatch) {
                const uniqueUrls = [...new Set(apiMatch)].filter(url => !url.includes('w3.org') && !url.includes('reactjs.org') && !url.includes('exam-proctar.vercel.app'));
                if (uniqueUrls.length > 0) {
                    console.log(`URLs in ${match}:`, uniqueUrls);
                }
            }
          });
        });
      });
    } else {
      console.log('No JS bundle found');
    }
  });
});
