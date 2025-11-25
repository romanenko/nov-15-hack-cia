# Research Retry Fix

## Problem

When research failed, retrying would get stuck in a loop:

```
[Research API] Previous research failed for @username, allowing retry
[Research API] Could not start research for @username - already running
GET /api/research/username 429
```

The logs said "allowing retry" but then immediately blocked it.

## Root Cause

The `startResearchRun()` function in `app/lib/db.ts` was checking if ANY run existed today:

```typescript
// OLD CODE (BUGGY)
const checkResult = await client.query(
  `SELECT * FROM research_runs
   WHERE handle = $1
     AND started_at::DATE = CURRENT_DATE  -- ANY run today
   LIMIT 1`
);

if (checkResult.rows.length > 0) {
  return null; // Block ALL runs
}
```

This blocked retries because:
1. Failed run exists from today → query finds it
2. Function returns `null` → "Could not start research"
3. User can't retry even though status is 'failed'

## The Fix

Updated the query to only block 'running' or 'completed' runs, not 'failed':

```typescript
// NEW CODE (FIXED)
const checkResult = await client.query(
  `SELECT * FROM research_runs
   WHERE handle = $1
     AND started_at::DATE = CURRENT_DATE
     AND status IN ('running', 'completed')  -- Only block successful/active runs
   LIMIT 1`
);

if (checkResult.rows.length > 0) {
  return null; // Block only if running or completed
}

// If previous run failed, this allows a new insert
```

## Behavior After Fix

### Scenario 1: Research Failed

```
1. Research failed at 10:00 AM
2. User visits profile at 10:05 AM
3. canRunResearch() returns failed run
4. Research API allows retry (status is 'failed')
5. startResearchRun() checks for running/completed today
6. Finds only 'failed' run → ignores it
7. Inserts new 'running' run → Research starts ✅
```

### Scenario 2: Research Running

```
1. Research started at 10:00 AM (status: 'running')
2. User visits profile at 10:01 AM
3. startResearchRun() checks for running/completed
4. Finds 'running' run → blocks
5. Returns null → "Already running" error ✅
```

### Scenario 3: Research Completed

```
1. Research completed at 10:00 AM (status: 'completed')
2. User visits profile at 3:00 PM (same day)
3. startResearchRun() checks for running/completed
4. Finds 'completed' run → blocks
5. Returns null → "Wait 24 hours" error ✅
```

## Code Changes

### File: `app/lib/db.ts`

**Before:**
```typescript
// Check if a run exists today
const checkResult = await client.query<ResearchRun>(
  `SELECT * FROM research_runs
   WHERE handle = $1
     AND started_at::DATE = CURRENT_DATE
   LIMIT 1`,
  [handle]
);
```

**After:**
```typescript
// Check if a successful or running run exists today (ignore failed runs)
const checkResult = await client.query<ResearchRun>(
  `SELECT * FROM research_runs
   WHERE handle = $1
     AND started_at::DATE = CURRENT_DATE
     AND status IN ('running', 'completed')
   LIMIT 1`,
  [handle]
);
```

## Testing

Build verified:
```bash
npm run build
✓ Compiled successfully
```

### Manual Test Flow

1. **Trigger research** → Should start
2. **Wait for it to fail** (or force failure)
3. **Visit profile again** → Should auto-retry
4. **Check logs** → Should show "Starting research" (not "Could not start")

## Related Issues

This fix resolves the issue where:
- User gets error → Research fails
- User refreshes page → Still blocked
- Only option: Wait 24 hours (bad UX)

Now failed research can be retried immediately.

## Database State

Multiple runs can exist for the same day:
- Run 1: Failed at 10:00 AM
- Run 2: Running at 10:05 AM (retry)

The most recent run is used for status checks (`canRunResearch()` orders by `started_at DESC`).

## Edge Cases Handled

### Multiple Failed Attempts
```
Failed at 10:00 → Retry at 10:05 → Failed at 10:07 → Retry at 10:10
✅ Each retry creates a new run with 'running' status
✅ Previous failed runs remain in database (audit trail)
```

### Failed Then Completed
```
Failed at 10:00 → Retry at 10:05 → Completed at 10:10
✅ Can't run again until tomorrow (completed status blocks)
```

### Running Then Failed
```
Started at 10:00 → Still running at 10:05 → Failed at 10:10
✅ While running: blocked from retry
✅ After failed: can retry immediately
```

## Related Documentation

- [Research Deduplication](./research-deduplication.md) - Overall system design
- [Research Database Fix](./research-database-fix.md) - Direct DB implementation
- [Research UI Integration](./research-ui-integration.md) - Frontend behavior
