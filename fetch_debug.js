
const fetch = require('node-fetch'); // Next.js env might not have node-fetch global in script, but let's try native fetch if node 18+
// Or just use http module.
const http = require('http');

http.get('http://localhost:3000/api/debug-listening', (resp) => {
    let data = '';
    resp.on('data', (chunk) => {
        data += chunk;
    });
    resp.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log(JSON.stringify(json, null, 2));
        } catch (e) {
            console.log(data);
        }
    });
}).on("error", (err) => {
    console.log("Error: " + err.message);
});
