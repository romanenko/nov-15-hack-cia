import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

// Create a connection pool using Neon's pooled connection
const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL
});

export const dynamic = 'force-dynamic'; // Disable caching for this route

interface Feature {
  feature_name: string;
  answers: string[];
}

interface InsertFeaturesRequest {
  handle: string;
  features: Feature[];
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: InsertFeaturesRequest = await request.json();
    const { handle, features } = body;

    // Validate required fields
    if (!handle || typeof handle !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid handle' },
        { status: 400 }
      );
    }

    if (!features || !Array.isArray(features) || features.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid features array' },
        { status: 400 }
      );
    }

    // Validate features array structure
    for (const feature of features) {
      if (!feature.feature_name || typeof feature.feature_name !== 'string') {
        return NextResponse.json(
          { success: false, error: 'Each feature must have a valid feature_name' },
          { status: 400 }
        );
      }
      if (!feature.answers || !Array.isArray(feature.answers)) {
        return NextResponse.json(
          { success: false, error: 'Each feature must have an answers array' },
          { status: 400 }
        );
      }
    }

    // Verify that the user exists in the database
    const userCheck = await pool.query(
      'SELECT handle FROM users WHERE handle = $1',
      [handle]
    );

    if (userCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: `User with handle '${handle}' not found` },
        { status: 404 }
      );
    }

    // Prepare bulk insert data
    // For each feature, create a row for each answer
    let insertedCount = 0;

    for (const feature of features) {
      for (const answer of feature.answers) {
        await pool.query(
          `INSERT INTO features (handle, name, answer)
           VALUES ($1, $2, $3)`,
          [handle, feature.feature_name, answer]
        );
        insertedCount++;
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          inserted_count: insertedCount
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('API error (insert features):', error);

    // Handle database errors
    if (error instanceof Error) {
      // Check for foreign key constraint violation
      if (error.message.includes('fk_features_users_handle')) {
        return NextResponse.json(
          { success: false, error: 'Invalid handle: user does not exist' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
