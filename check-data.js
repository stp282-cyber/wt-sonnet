const http = require('http');

console.log('Starting request...');

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/debug-data',
    method: 'GET',
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('Body:');
        console.log(data);
    });
});

req.on('error', (error) => {
    console.error('Error:', error);
});

req.end();
