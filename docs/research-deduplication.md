# Research Deduplication System

## Overview

The research system implements deduplication to ensure Linkup research is only run **once per day per user**. This prevents unnecessary API calls, reduces costs, and avoids overwhelming the Linkup service.

## How It Works

### Database Schema

The `research_runs` table tracks every research execution:

```sql
CREATE TABLE research_runs (
  id BIGSERIAL PRIMARY KEY,
  handle TEXT NOT NULL REFERENCES users(handle),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running',
  error_message TEXT
);
```

**Statuses:**
- `running`: Research is currently in progress
- `completed`: Research finished successfully
- `failed`: Research encountered an error (allows retry)

### Three-Layer Deduplication

#### 1. Profile API Layer (`/api/profile/[username]`)

Before triggering research, checks if it can be run:

```typescript
const existingRun = await canRunResearch(username);

if (existingRun?.status === 'running') {
  // Skip - already running
  return;
}

if (existingRun?.status === 'completed') {
  // Skip - completed within last 24 hours
  return;
}

// Only trigger if null or status === 'failed'
triggerResearch(username);
```

#### 2. Research API Layer (`/api/research/[username]`)

Double-checks and enforces the cooldown:

```typescript
// Check cooldown
const existingRun = await canRunResearch(username);

if (existingRun?.status === 'running') {
  return 429; // Already running
}

if (existingRun?.status === 'completed') {
  return 429; // Wait 24 hours
}

// Atomic start (prevents race conditions)
const run = await startResearchRun(username);

if (!run) {
  return 429; // Another request beat us to it
}
```

#### 3. Database Layer (`startResearchRun`)

Uses PostgreSQL advisory locks for atomic deduplication:

```typescript
// Advisory lock prevents race conditions
const lockId = hashHandle(handle);
await client.query('SELECT pg_advisory_xact_lock($1)', [lockId]);

// Check if run exists today
const existing = await client.query(
  'SELECT * FROM research_runs WHERE handle = $1 AND started_at::DATE = CURRENT_DATE'
);

if (existing.rows.length > 0) {
  return null; // Already exists
}

// Insert new run
await client.query('INSERT INTO research_runs...');
```

## Key Features

### 24-Hour Cooldown

Research can only run once per calendar day per user. The system checks:

```sql
WHERE started_at > NOW() - INTERVAL '1 day'
```

### Race Condition Prevention

Multiple concurrent requests for the same user are handled safely:

1. **Advisory locks** ensure only one transaction can check/insert at a time
2. **Atomic check-and-insert** in a single transaction
3. **Returns null** if another request already started

### Failed Research Retry

If research fails, it can be retried:

```typescript
if (existingRun?.status === 'failed') {
  // Allow retry
  await startResearchRun(username);
}
```

### Fire-and-Forget Pattern

Research is triggered asynchronously without blocking the profile API:

```typescript
// Don't await - fire and forget
fetch(`/api/research/${username}`)
  .then(response => console.log('Research triggered'))
  .catch(error => console.error('Failed to trigger'));
```

## Database Queries

### Check if research can run

```sql
SELECT * FROM research_runs
WHERE handle = $1
  AND started_at > NOW() - INTERVAL '1 day'
ORDER BY started_at DESC
LIMIT 1;
```

### Start new research run (with lock)

```sql
BEGIN;
SELECT pg_advisory_xact_lock($1); -- Lock by handle hash

SELECT * FROM research_runs
WHERE handle = $2
  AND started_at::DATE = CURRENT_DATE;

-- If none found:
INSERT INTO research_runs (handle, started_at, status)
VALUES ($2, NOW(), 'running');

COMMIT;
```

### Mark as completed

```sql
UPDATE research_runs
SET status = 'completed', completed_at = NOW()
WHERE handle = $1
  AND DATE(started_at) = CURRENT_DATE
  AND status = 'running';
```

### Mark as failed

```sql
UPDATE research_runs
SET status = 'failed', error_message = $2
WHERE handle = $1
  AND DATE(started_at) = CURRENT_DATE
  AND status = 'running';
```

## Example Scenarios

### Scenario 1: First Profile Fetch
1. User visits `/profile/username`
2. Profile API fetches X data, saves to DB
3. Checks `canRunResearch` → returns `null`
4. Triggers research asynchronously
5. Research API starts run, inserts row with status `running`
6. Research completes, updates status to `completed`

### Scenario 2: Multiple Concurrent Requests
1. Request A calls `/api/profile/username`
2. Request B calls `/api/profile/username` (same time)
3. Request A triggers research
4. Request B triggers research
5. Research API (A) starts, acquires lock, inserts row
6. Research API (B) starts, acquires lock, sees existing row, returns null
7. Only one research runs

### Scenario 3: Refresh After 12 Hours
1. User visits `/profile/username` (12 hours after initial fetch)
2. Profile cache is stale (>1 hour), fetches fresh X data
3. Checks `canRunResearch` → returns existing run with status `completed`, started 12 hours ago
4. Skips research trigger (must wait 24 hours total)

### Scenario 4: Failed Research Retry
1. Previous research failed 2 hours ago
2. User visits `/profile/username`
3. Checks `canRunResearch` → returns run with status `failed`
4. Allows retry, triggers research
5. Research runs again

## Monitoring

### Check recent research runs

```sql
SELECT handle, started_at, completed_at, status, error_message
FROM research_runs
ORDER BY started_at DESC
LIMIT 20;
```

### Find stuck research (running > 1 hour)

```sql
SELECT handle, started_at, NOW() - started_at AS duration
FROM research_runs
WHERE status = 'running'
  AND started_at < NOW() - INTERVAL '1 hour';
```

### Count runs by status (last 7 days)

```sql
SELECT status, COUNT(*)
FROM research_runs
WHERE started_at > NOW() - INTERVAL '7 days'
GROUP BY status;
```

## Configuration

No configuration required! The system enforces:
- **1 day cooldown** (hardcoded in SQL queries)
- **Automatic retry** on failed runs
- **Race condition safe** via PostgreSQL advisory locks

## Migration

Run the migration script:

```bash
psql $NEON_DATABASE_URL -f scripts/create-research-runs-table.sql
```

This creates:
- `research_runs` table
- Indexes for performance
- Foreign key constraint to `users(handle)`
