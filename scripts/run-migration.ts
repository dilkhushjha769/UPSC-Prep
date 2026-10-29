import fs from 'fs';
import path from 'path';
import { Client } from 'pg';

const connectionString =
  process.env.DIRECT_URL ||
  'postgresql://postgres.trodruvopmqnnkvghxye:Akash@aman10@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres';

async function run() {
  const migrationsDir = path.resolve(__dirname, '../supabase/migrations');
  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  console.log('Connecting to Supabase PostgreSQL at aws-0-ap-southeast-1.pooler.supabase.com...');
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('Connected! Executing migrations...');
    for (const file of migrationFiles) {
      const sqlPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(sqlPath, 'utf8');
      console.log(` -> Applying ${file}...`);
      await client.query(sql);
    }
    console.log('All migrations executed successfully!');

    // Verify created tables
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN (
          'questions', 'mock_tests', 'mock_test_questions', 'mock_test_responses', 'user_question_attempts',
          'ca_sources', 'ca_articles', 'ca_category_status', 'ca_ingestion_logs'
        )
      ORDER BY table_name;
    `);
    console.log('Verified created tables:', res.rows.map((r: any) => r.table_name));

    await client.end();
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

run();
