import fs from 'fs';
import path from 'path';
import { Client } from 'pg';

const connectionString =
  process.env.DIRECT_URL ||
  'postgresql://postgres.trodruvopmqnnkvghxye:Akash@aman10@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres';

async function run() {
  const sqlPath = path.resolve(__dirname, '../supabase/migrations/20261025000000_upsc_mock_test_system.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('Connecting to Supabase PostgreSQL at aws-0-ap-southeast-1.pooler.supabase.com...');
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('Connected! Executing migration...');
    await client.query(sql);
    console.log('Migration executed successfully!');

    // Verify created tables
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('questions', 'mock_tests', 'mock_test_questions', 'mock_test_responses', 'user_question_attempts');
    `);
    console.log('Verified created tables:', res.rows.map((r: any) => r.table_name));

    // Verify function
    const fnRes = await client.query(`
      SELECT proname FROM pg_proc WHERE proname = 'submit_mock_test';
    `);
    console.log('Verified functions:', fnRes.rows.map((r: any) => r.proname));

    await client.end();
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

run();
