const http = require('http');

http.get('http://localhost:3000/api/student-curriculums/student/f5c2eea6-6127-4f35-93dd-573f30ef2120', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (!json.curriculums) { console.log('No curriculums found'); return; }
            json.curriculums.forEach(c => {
                console.log('------------------------------------------------');
                console.log('Curriculum:', c.curriculums?.name);
                console.log('Curriculum ID:', c.curriculum_id);

                c.curriculum_items.forEach(i => {
                    console.log('  Item ID:', i.id);
                    console.log('  Title:', i.item_details?.title || 'No Title');
                    console.log('  Type:', i.item_type || 'NULL_TYPE');
                    console.log('  Daily Amount Type:', i.daily_amount_type);
                    console.log('  Daily Amount:', i.daily_amount);
                    if (i.sections && i.sections.length > 0) {
                        console.log('  Sections:', i.sections.length);
                    } else {
                        console.log('  NO SECTIONS FOUND');
                    }
                });
            });
        } catch (e) { console.error('Parse Error:', e); }
    });
}).on('error', err => console.error(err));
