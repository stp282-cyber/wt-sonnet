const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function fixUsers() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const targetAcademyId = '00000000-0000-0000-0000-000000000000';

    console.log('--- Updating Users with NULL academy_id ---');
    const { data, error } = await supabase
        .from('users')
        .update({ academy_id: targetAcademyId })
        .is('academy_id', null)
        .select();

    if (error) {
        console.error('Error updating users:', error);
        return;
    }

    console.log(`Updated ${data.length} users:`, data.map(u => u.username));
}

fixUsers();
