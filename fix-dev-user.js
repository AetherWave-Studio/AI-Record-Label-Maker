// Quick script to fix dev user subscription plan
// Run with: node fix-dev-user.js

import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_cy4DWh0JEpen@ep-sparkling-mountain-aekuxs2f.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require"
});

async function fixDevUser() {
  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Update dev user's plan from 'all_access' to 'mogul'
    const result = await client.query(`
      UPDATE users
      SET subscription_plan = 'mogul',
          credits = 10000,
          updated_at = NOW()
      WHERE id = 'dev-user-123'
      RETURNING id, email, subscription_plan, credits;
    `);

    if (result.rows.length > 0) {
      console.log('✅ Dev user updated successfully:');
      console.log(result.rows[0]);
    } else {
      console.log('⚠️  No user found with id: dev-user-123');
    }

    await client.end();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixDevUser();
