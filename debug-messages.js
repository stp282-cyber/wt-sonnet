const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkMessages() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const test2Ids = ['4ea05736-a6ec-49e9-8d43-6e09bd4f6c3c']; // Test2 ID

    console.log(`--- Checking Messages for Recipient: ${test2Ids[0]} ---`);
    const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .or(`recipient_id.in.(${test2Ids.join(',')}),sender_id.in.(${test2Ids.join(',')})`);

    if (error) {
        console.error(error);
        return;
    }

    console.log(`Found ${messages.length} messages:`);
    console.table(messages.map(m => ({ id: m.id, content: m.content, sender: m.sender_id, recipient: m.recipient_id })));
}

checkMessages();
