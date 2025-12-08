
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectTest2() {
    console.log('--- Inspecting Test2 Data ---');

    // 1. Find User
    const { data: users, error: userError } = await supabase
        .from('users')
        .select('*')
        .or('username.eq.test2,full_name.eq.테스트2');

    if (userError) {
        console.error('User fetch error:', userError);
        return;
    }

    if (!users || users.length === 0) {
        console.log('User test2 not found');
        return;
    }

    const test2 = users[0];
    console.log(`User Found: ${test2.username} (${test2.id})`);

    // 2. Fetch Active Curriculums
    const { data: curriculums, error: curError } = await supabase
        .from('student_curriculums')
        .select(`
            id,
            start_date,
            status,
            study_days,
            curriculums (
                id,
                name,
                curriculum_items (
                    id,
                    title,
                    sequence
                )
            )
        `)
        .eq('student_id', test2.id)
        .eq('status', 'active');

    if (curError) {
        console.error('Curriculum fetch error:', curError);
        return;
    }

    console.log(`Active Curriculums Count: ${curriculums?.length}`);

    if (curriculums) {
        curriculums.forEach((sc: any, idx) => {
            console.log(`\n[${idx + 1}] Curriculum: ${sc.curriculums?.name}`);
            console.log(`    Start Date: ${sc.start_date}`);
            console.log(`    Study Days: ${sc.study_days}`);
            console.log(`    Total Items: ${sc.curriculums?.curriculum_items?.length}`);
        });
    }

    // 3. Check Study Logs for today
    const { data: logs, error: logError } = await supabase
        .from('study_logs')
        .select('*')
        .eq('student_id', test2.id)
        .gte('created_at', new Date().toISOString().split('T')[0]);

    console.log(`\nToday's Logs Count: ${logs?.length}`);
}

inspectTest2();
