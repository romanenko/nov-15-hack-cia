import { config } from 'dotenv';
import { Client } from 'pg';

// Load environment variables from .env.development.local
config({ path: '.env.development.local' });

async function migrate() {
  const client = new Client({
    connectionString: process.env.POSTGRES_PRISMA_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Running database migration...');
    await client.connect();

    // Add updated_at column
    await client.query(`
      ALTER TABLE public.users
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    `);

    console.log('✓ Added updated_at column');

    // Update existing rows
    await client.query(`
      UPDATE public.users
      SET updated_at = created_at
      WHERE updated_at IS NULL
    `);

    console.log('✓ Updated existing rows');

    await client.end();
    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await client.end();
    process.exit(1);
  }
}

migrate();
