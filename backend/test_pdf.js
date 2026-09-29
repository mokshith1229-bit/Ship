const http = require('http');
const fs = require('fs');

console.log('Starting PDF request...');
const req = http.get('http://localhost:5555/api/v1/reports/generate-pdf?project=Maharashtra&isSummary=false', (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  
  let size = 0;
  res.on('data', (chunk) => {
    size += chunk.length;
    process.stdout.write(`\rReceived: ${size} bytes`);
  });
  
  res.on('end', () => {
    console.log('\nResponse finished. Total size:', size);
  });
});

req.setTimeout(600000, () => {
  console.error('\nRequest timed out after 10 minutes');
  req.abort();
});

req.on('error', (e) => {
  console.error(`\nProblem with request: ${e.message}`);
});
