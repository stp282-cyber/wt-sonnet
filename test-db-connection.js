const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testApi() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase env vars');
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Testing Users API (Direct DB Query)...');
    const { data: users, error: userError } = await supabase
        .from('users')
        .select('*');

    if (userError) console.error('Error fetching users:', userError);
    else console.log(`Found ${users.length} users:`, users.map(u => `${u.full_name} (${u.role})`));

    console.log('\nTesting Messages API (Direct DB Query)...');
    const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select('*');

    if (msgError) console.error('Error fetching messages:', msgError);
    else console.log(`Found ${messages.length} messages`);
}

testApi();
