
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- Logic being tested ---
function isStudyDay(date: dayjs.Dayjs, studyDays: any): boolean {
    if (!studyDays) return false;

    // Normalize to string
    let sDays = '';
    if (typeof studyDays === 'string') {
        sDays = studyDays;
    } else if (Array.isArray(studyDays)) {
        sDays = studyDays.join(',');
    } else {
        sDays = String(studyDays);
    }

    const dayName = date.format('ddd').toLowerCase();
    const studies = sDays.toLowerCase().split(',').map(s => s.trim());
    const match = studies.some(s => s.startsWith(dayName));
    console.log(`Checking ${dayName} in [${studies}] -> ${match}`);
    return match;
}

function calculateSchedule(curriculum: any, targetDateStr: string) {
    const start = dayjs(curriculum.start_date).tz('Asia/Seoul').startOf('day');
    const target = dayjs(targetDateStr).tz('Asia/Seoul').startOf('day');

    console.log(`\nCurriculum: ${curriculum.curriculums?.name}`);
    console.log(`Start: ${start.format()}, Target: ${target.format()}`);
    console.log(`Study Days Raw:`, curriculum.study_days, `Type: ${typeof curriculum.study_days}`);

    if (target.isBefore(start)) {
        console.log('Target is before start');
        return null;
    }

    if (!curriculum.study_days || !isStudyDay(target, curriculum.study_days)) {
        console.log('Not a study day today');
        return null;
    }

    let studyDayCount = 0;
    let current = start.clone();

    // Normalize safely again
    let sDays = '';
    if (typeof curriculum.study_days === 'string') {
        sDays = curriculum.study_days;
    } else if (Array.isArray(curriculum.study_days)) {
        sDays = curriculum.study_days.join(',');
    } else {
        sDays = String(curriculum.study_days);
    }
    const studyDays = sDays.toLowerCase();

    while (current.isBefore(target) || current.isSame(target, 'day')) {
        const dName = current.format('ddd').toLowerCase();
        // Check if 'current' is a study day
        // We need to be careful with 'includes' if names are short, but 'mon' 'tue' are distinct enough
        // Better to split and check
        const studies = studyDays.split(',').map(s => s.trim());
        if (studies.some(s => s.startsWith(dName))) {
            studyDayCount++;
        }
        current = current.add(1, 'day');
    }

    console.log(`Study Day Count: ${studyDayCount}`);

    const items = curriculum.curriculums?.curriculum_items || [];
    console.log(`Total Items: ${items.length}`);

    if (studyDayCount > 0 && studyDayCount <= items.length) {
        return items[studyDayCount - 1];
    } else {
        console.log('Study count out of range');
    }

    return null;
}
// --------------------------

async function run() {
    // 1. Fetch Test2
    const { data: users } = await supabase
        .from('users')
        .select('*')
        .or('username.eq.test2,full_name.eq.테스트2');

    if (!users?.length) return console.log('User not found');
    const test2 = users[0];

    // 2. Fetch Curriculums
    const { data: currics } = await supabase
        .from('student_curriculums')
        .select(`
            *,
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

    if (!currics) return console.log('No curriculums');

    // Test for 'Today' (2025-12-08)
    const dateStr = '2025-12-08';
    console.log(`Testing Date: ${dateStr}`);

    for (const sc of currics) {
        const item = calculateSchedule(sc, dateStr);
        console.log(`Result Item: ${item?.title || 'NULL'}`);
    }
}

run();
