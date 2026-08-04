require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
    console.log('DATABASE_URL or POSTGRES_URL is not set in .env.local.');
    console.log('Please copy the contents of fix_all_rls_security.sql and run it in Supabase Dashboard -> SQL Editor.');
    process.exit(0);
}

const client = new Client({
    connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

async function run() {
    try {
        await client.connect();
        console.log('Connected to Supabase PostgreSQL database.');

        const sqlPath = path.join(__dirname, 'fix_all_rls_security.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Executing fix_all_rls_security.sql ...');
        const res = await client.query(sql);
        console.log('Successfully enabled RLS and applied permissive policies for all public tables!');
        
        // Output RLS verification results if available
        const verification = Array.isArray(res) ? res[res.length - 1] : res;
        if (verification && verification.rows) {
            console.log('\n--- RLS Status Verification ---');
            console.table(verification.rows);
        }
    } catch (err) {
        console.error('Error applying RLS fix:', err);
    } finally {
        await client.end();
    }
}

run();
