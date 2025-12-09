
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Force load env from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Missing credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function main() {
    console.log('Testing Admin Client...');

    // 1. Check a known student ID
    const studentId = '4ea05736-a6ec-49e9-8d43-6e09bd4f6c3c'; // From previous logs (Test 2)
    console.log(`Checking Curriculums for Student: ${studentId}`);

    const { data: currics, error } = await supabase
        .from('student_curriculums')
        .select('*')
        .eq('student_id', studentId);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log(`Found ${currics?.length} curriculums.`);
        console.log(JSON.stringify(currics, null, 2));
    }
}

main();
