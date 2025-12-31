require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
    console.error('DATABASE_URL or POSTGRES_URL not found in .env.local');
    process.exit(1);
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
        console.log('Connected to database.');

        const sqlPath = path.join(__dirname, 'create_get_titles_rpc.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Creating RPC function get_grammar_titles...');
        await client.query(sql);
        console.log('Successfully created RPC function.');
    } catch (err) {
        console.error('Error creating RPC function:', err);
    } finally {
        await client.end();
    }
}

run();
