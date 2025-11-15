import { config } from 'dotenv';
import { Pool } from 'pg';

// Load environment variables
config({ path: '.env.development.local' });

// Disable TLS certificate validation for development
if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

async function testConnection() {
  const pool = new Pool({
    connectionString: process.env.POSTGRES_PRISMA_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Testing database connection...');
    console.log('POSTGRES_PRISMA_URL:', process.env.POSTGRES_PRISMA_URL?.substring(0, 50) + '...');

    const result = await pool.query('SELECT NOW() as current_time');
    console.log('✓ Connection successful!');
    console.log('Current time from DB:', result.rows[0]);

    // Test if users table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'users'
      )
    `);

    console.log('Users table exists:', tableCheck.rows[0].exists);

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:', error);
    await pool.end();
    process.exit(1);
  }
}

testConnection();
