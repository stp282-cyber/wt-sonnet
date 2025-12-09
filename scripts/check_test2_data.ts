
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTest2Data() {
    console.log('Checking data for test2...');

    // 1. Get student ID
    const { data: students, error: studentError } = await supabase
        .from('users')
        .select('id, username, full_name')
        .or('username.eq.test2,full_name.eq.테스트2');

    if (studentError || !students || students.length === 0) {
        console.error('Student test2 not found', studentError);
        return;
    }

    const student = students[0];
    console.log('Student:', student);

    // 2. Get Student Curriculums
    const { data: currics, error: curricError } = await supabase
        .from('student_curriculums')
        .select(`
        *,
        curriculums (
            id,
            name,
            start_date,
            curriculum_items (
                id,
                title,
                sequence
            )
        )
    `)
        .eq('student_id', student.id);

    if (curricError) {
        console.error('Error fetching curriculums:', curricError);
        return;
    }

    console.log(`Found ${currics.length} curriculums`);

    for (const sc of currics) {
        console.log(`\nCurriculum: ${sc.curriculums?.name} (Start: ${sc.curriculums?.start_date})`);
        console.log(`Study Days: ${JSON.stringify(sc.study_days)}`);

        // 3. Get Study Logs
        const { data: logs, error: logError } = await supabase
            .from('study_logs')
            .select('*')
            .eq('student_id', student.id)
            .eq('curriculum_id', sc.curriculum_id);

        if (logError) {
            console.error('Error fetching logs:', logError);
        } else {
            console.log(`Found ${logs.length} logs`);
            logs.forEach(l => {
                console.log(` - Log: Item ${l.curriculum_item_id}, Status: ${l.status}, Scheduled: ${l.scheduled_date}`);
            });
        }
    }
}

checkTest2Data();
