const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function debugUsers() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('--- Fetching All Users ---');
    const { data: users, error } = await supabase
        .from('users')
        .select('id, username, full_name, role, academy_id');

    if (error) {
        console.error(error);
        return;
    }

    console.log(JSON.stringify(users, null, 2));
}

debugUsers();
