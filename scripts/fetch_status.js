
const http = require('http');

http.get('http://localhost:3000/api/teacher/learning-status?date=2025-12-09', (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json.error) {
                console.log('Error:', json.error);
            } else {
                console.log('Success.');
                const test2 = json.data.find(s => s.student_name === '테스트2' || s.student_name === 'test2' || s.student_id === 'test2');
                if (test2) {
                    console.log('Test2 Assignments:', test2.assignments.length);
                    console.log('Debug Logs:', test2.debug_logs);
                    test2.assignments.forEach(a => {
                        console.log(` - ${a.scheduled_date}: ${a.item_title} [${a.status}] (PastDue: ${a.is_past_due})`);
                    });
                } else {
                    console.log('Test2 not found in response');
                    // print snippets of data to check names
                    console.log('Students found:', json.data.map(s => s.student_name));
                }
            }
        } catch (e) {
            console.log('Raw data:', data);
        }
    });
}).on('error', (err) => {
    console.log('Error: ' + err.message);
});
