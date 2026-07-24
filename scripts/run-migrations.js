/**
 * Run all 14 Supabase migrations in order.
 * Uses the Supabase Management API to execute SQL.
 * 
 * SECURITY: Reads secrets from environment variables.
 * Usage: SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=eyJ... node scripts/run-migrations.js
 */
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('ERROR: Missing required environment variables.');
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running.');
  process.exit(1);
}

const migrationsDir = path.join(__dirname, '..', 'backend', 'supabase', 'migrations');

const migrationFiles = [
  '001_create_enums.sql',
  '002_create_users_table.sql',
  '003_create_statuses_table.sql',
  '004_create_leads_table.sql',
  '005_create_activities_table.sql',
  '006_create_tags_tables.sql',
  '007_create_reminders_table.sql',
  '008_create_status_history.sql',
  '009_create_saved_views.sql',
  '010_create_functions.sql',
  '011_create_triggers.sql',
  '012_create_rls_policies.sql',
  '013_create_storage_bucket.sql',
  '014_seed_initial_data.sql',
];

async function runSQL(sql) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  });
  return response;
}

async function runMigrationViaPostgrest(sql) {
  // Use the pg_query function via SQL editor endpoint
  const response = await fetch(`${SUPABASE_URL}/pg/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  });
  return response;
}

async function main() {
  console.log('=== Foremark CRM Migration Runner ===\n');

  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf-8');

    process.stdout.write(`Running ${file}... `);

    try {
      const response = await runMigrationViaPostgrest(sql);

      if (response.ok) {
        console.log('✅ Success');
      } else {
        const text = await response.text();
        console.log(`❌ HTTP ${response.status}`);
        console.log(`   Error: ${text.substring(0, 200)}`);
        
        // Try alternate endpoint
        const altResponse = await fetch(`${SUPABASE_URL}/rest/v1/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
            'Prefer': 'return=minimal',
          },
          body: sql,
        });
        
        if (!altResponse.ok) {
          console.log('   Alt method also failed. You may need to run this manually.');
          console.log('   Continuing to next migration...\n');
        }
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }

  console.log('\n=== Migration complete ===');
  console.log('Go to Supabase Dashboard → Table Editor to verify tables.');
}

main();
