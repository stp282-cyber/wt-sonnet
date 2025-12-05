const start = async () => {
    try {
        const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'teacher1', password: 'password123' })
        });

        console.log('Status:', response.status);
        const text = await response.text();
        console.log('Body:', text.substring(0, 500)); // 너무 길면 자름
    } catch (error) {
        console.error('Error:', error);
    }
};

start();
