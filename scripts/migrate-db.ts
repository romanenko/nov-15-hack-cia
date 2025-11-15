import { config } from 'dotenv';
import { createClient } from '@vercel/postgres';

// Load environment variables from .env.development.local
config({ path: '.env.development.local' });

async function migrate() {
  const client = createClient({
    connectionString: process.env.POSTGRES_URL
  });

  try {
    console.log('Running database migration...');
    await client.connect();

    // Add updated_at column
    await client.sql`
      ALTER TABLE public.users
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    `;

    console.log('✓ Added updated_at column');

    // Update existing rows
    await client.sql`
      UPDATE public.users
      SET updated_at = created_at
      WHERE updated_at IS NULL
    `;

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
