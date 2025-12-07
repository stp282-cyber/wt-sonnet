
const http = require('http');

http.get('http://localhost:3000/api/debug-schema', (resp) => {
    let data = '';
    resp.on('data', (chunk) => {
        data += chunk;
    });
    resp.on('end', () => {
        try {
            console.log(JSON.stringify(JSON.parse(data), null, 2));
        } catch (e) {
            console.log(data);
        }
    });
}).on("error", (err) => {
    console.log("Error: " + err.message);
});
