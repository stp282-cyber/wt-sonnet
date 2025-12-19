
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load .env.local
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
} else {
    console.warn('.env.local not found at', envPath);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase Environment Variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log('Testing RPC connection...');

    // 1. Get a wordbook ID
    const { data: wordbooks, error: wbError } = await supabase
        .from('wordbooks')
        .select('id, title')
        .limit(1);

    if (wbError || !wordbooks || wordbooks.length === 0) {
        console.error('Cannot find any wordbooks to test.', wbError);
        return;
    }

    const wordbook = wordbooks[0];
    console.log(`Found Wordbook: [${wordbook.title}] (ID: ${wordbook.id})`);

    // 2. Call RPC
    console.log('Calling RPC: get_wordbook_sections_lean...');
    const { data, error } = await supabase
        .rpc('get_wordbook_sections_lean', { p_wordbook_id: wordbook.id });

    if (error) {
        console.error('❌ RPC FAILED:', error);
        console.error('Hint: Did you run the optimize_egress.sql script in Supabase Dashboard?');
    } else {
        console.log(`✅ RPC SUCCESS! Retrieved ${data.length} sections.`);
        if (data.length > 0) {
            // Validation: Ensure 'words' is NOT present and 'word_count' IS present
            const firstRow = data[0];
            console.log('Sample Row Keys:', Object.keys(firstRow));
            console.log('Sample Row Data:', JSON.stringify(firstRow, null, 2));

            if (firstRow.words === undefined && typeof firstRow.word_count === 'number') {
                console.log('✅ VALIDATION PASSED using lean data structure.');
                console.log('   (words array is missing, word_count is present)');
            } else {
                console.error('❌ VALIDATION FAILED: Data structure is not optimized.');
            }
        } else {
            console.warn('⚠️ Wordbook has no sections, so cannot verify data structure, but RPC call worked.');
        }
    }
}

test();
