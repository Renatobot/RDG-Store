const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.gvnfuindbwokvbacqksu:RDGstore2026@aws-0-ca-central-1.pooler.supabase.com:5432/postgres' });

async function run() {
  await client.connect();
  try {
    await client.query(`CREATE POLICY "Allow public uploads" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'images');`);
    console.log('Policy created!');
  } catch (e) {
    console.log('Policy probably already exists or error:', e.message);
  }
  await client.end();
}
run();
