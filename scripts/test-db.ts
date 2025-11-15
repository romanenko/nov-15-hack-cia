import { config } from 'dotenv';
import { sql } from '@vercel/postgres';

// Load environment variables
config({ path: '.env.development.local' });

async function testConnection() {
  try {
    console.log('Testing database connection...');
    console.log('POSTGRES_URL:', process.env.POSTGRES_URL?.substring(0, 50) + '...');

    const result = await sql`SELECT NOW() as current_time`;
    console.log('✓ Connection successful!');
    console.log('Current time from DB:', result.rows[0]);

    // Test if users table exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'users'
      );
    `;

    console.log('Users table exists:', tableCheck.rows[0].exists);

    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:', error);
    process.exit(1);
  }
}

testConnection();
