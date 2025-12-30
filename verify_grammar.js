async function verify() {
    try {
        console.log('Fetching from http://localhost:3000/api/grammar ...');
        const res = await fetch('http://localhost:3000/api/grammar');

        if (!res.ok) {
            console.error('API Error:', res.status, res.statusText);
            const text = await res.text();
            console.error('Response:', text);
            return;
        }

        const data = await res.json();
        console.log('API Success! Data received:', JSON.stringify(data, null, 2));

        if (Array.isArray(data) || Array.isArray(data.books)) {
            console.log('VERIFICATION PASSED: Data structure is valid.');
        } else {
            console.error('VERIFICATION FAILED: Unexpected data structure.');
        }

    } catch (e) {
        console.error('Connection Failed:', e.message);
        console.log('TIP: Ensure npm run dev is running on port 3000.');
    }
}

verify();
