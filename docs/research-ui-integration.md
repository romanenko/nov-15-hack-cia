# Research UI Integration

## Overview

The profile page now automatically triggers and displays real-time research status when accessing a user's profile. The UI updates dynamically as research progresses and insights are generated.

## Features Implemented

### 1. Research Status Component (`app/components/ResearchStatus.tsx`)

A smart banner component that displays the current state of research:

**States:**
- **Not Started**: Shows "Start Research" button
- **Running**: Animated spinner with progress message
- **Completed**: Success checkmark with timestamp
- **Failed**: Error message with "Retry" button

**Behavior:**
- Auto-triggers research on first profile visit if not already run
- Polls status every 5 seconds while research is running
- Notifies parent component when research completes
- Respects 24-hour cooldown (won't allow re-run within 24 hours)
- Allows retry if previous research failed

### 2. Status API Endpoint (`app/api/research/[username]/status/route.ts`)

**GET** `/api/research/[username]/status`

Returns current research status:

```typescript
{
  success: true,
  status: 'running' | 'completed' | 'failed' | 'not_started',
  started_at: '2025-11-24T...',
  completed_at: '2025-11-24T...',
  hours_ago: 2,
  can_retry: true
}
```

### 3. Profile Client Updates (`app/[username]/ProfileClient.tsx`)

Enhanced to support real-time research:

**New Features:**
- Integrates `ResearchStatus` component at top of page
- Automatically reloads insights when research completes
- Polls for new insights every 10 seconds while research runs
- Shows empty state when no insights exist yet
- Animated slide-in effect when new insights appear

**UI Flow:**
1. User visits profile page
2. Research status banner appears at top
3. If no research run in 24h, automatically triggers research
4. Banner shows "Research in Progress" with spinner
5. Insights automatically populate as research completes
6. New insight cards slide in with animation

### 4. Animated Insight Cards (`app/components/InsightCard.tsx`)

Enhanced with animations:
- Fade-in and slide-up animation when first displayed
- Smooth 500ms transition
- Custom CSS animation in `globals.css`

## User Experience Flow

### First Visit to Profile

```
┌─────────────────────────────────┐
│ Profile Header                  │
├─────────────────────────────────┤
│ 🔵 Deep Research Available      │
│    [Start Research]             │  ← Auto-clicks after load
├─────────────────────────────────┤
│ Intelligence Analysis           │
│                                 │
│ 📄 No Intelligence Data Yet     │
│    Start research to generate   │
└─────────────────────────────────┘
```

### Research Running

```
┌─────────────────────────────────┐
│ Profile Header                  │
├─────────────────────────────────┤
│ ⚡ Research in Progress         │
│    Analyzing profile...         │  ← Polls every 5s
├─────────────────────────────────┤
│ Intelligence Analysis           │
│                                 │
│ ┌─────────────┐ ┌─────────────┐│
│ │ Biography   │ │ Beliefs     ││  ← Insights appear
│ └─────────────┘ └─────────────┘│     gradually
│ ┌─────────────┐ ┌─────────────┐│
│ │ Expertise   │ │ Voting      ││
│ └─────────────┘ └─────────────┘│
└─────────────────────────────────┘
```

### Research Complete

```
┌─────────────────────────────────┐
│ Profile Header                  │
├─────────────────────────────────┤
│ ✅ Research Complete            │
│    Completed 1h ago             │
├─────────────────────────────────┤
│ Intelligence Analysis           │
│                                 │
│ ┌─────────────┐ ┌─────────────┐│
│ │ Biography   │ │ Beliefs     ││
│ └─────────────┘ └─────────────┘│
│ ┌─────────────┐ ┌─────────────┐│
│ │ Expertise   │ │ Voting      ││
│ └─────────────┘ └─────────────┘│
│ ┌─────────────┐ ┌─────────────┐│
│ │ Risk        │ │ Worldview   ││
│ └─────────────┘ └─────────────┘│
└─────────────────────────────────┘
```

### Revisit Within 24 Hours

```
┌─────────────────────────────────┐
│ Profile Header                  │
├─────────────────────────────────┤
│ ✅ Research Complete            │
│    Completed 3h ago. Refresh    │
│    available in 24 hours.       │
├─────────────────────────────────┤
│ Intelligence Analysis           │
│ [All insights displayed]        │
└─────────────────────────────────┘
```

### Research Failed

```
┌─────────────────────────────────┐
│ Profile Header                  │
├─────────────────────────────────┤
│ ❌ Research Failed              │
│    Error: Connection timeout    │
│                    [Retry]      │  ← Can retry
├─────────────────────────────────┤
│ Intelligence Analysis           │
│ [Existing insights if any]      │
└─────────────────────────────────┘
```

## Technical Details

### Polling Strategy

**Status Polling:**
- Every 5 seconds while research is running
- Stops when research completes or fails
- Minimal network overhead (small JSON response)

**Insights Polling:**
- Every 10 seconds while research is running
- Silent reload (no loading spinner)
- Only updates changed data

### Auto-Trigger Logic

Research automatically triggers when:
1. Profile page loads
2. No research run in last 24 hours
3. Status check returns `not_started`
4. After 500ms delay (allows status to load)

### Deduplication Protection

Multiple layers prevent duplicate research:
1. **UI Layer**: ResearchStatus checks before triggering
2. **API Layer**: Research route validates cooldown
3. **Database Layer**: Atomic operations with advisory locks

### Performance Optimizations

- **Silent Reloads**: Insights reload without showing spinner
- **Debounced Updates**: Prevents excessive re-renders
- **Efficient Queries**: Indexed database lookups
- **Caching**: Status endpoint checks DB efficiently

## API Integration

### Trigger Research

```typescript
// POST /api/research/[username]
const response = await fetch(`/api/research/${username}`);

// Returns:
// 200 - Success, research started
// 429 - Already running or completed within 24h
// 404 - User profile not found
```

### Check Status

```typescript
// GET /api/research/[username]/status
const response = await fetch(`/api/research/${username}/status`);
const data = await response.json();

// data.status: 'not_started' | 'running' | 'completed' | 'failed'
// data.hours_ago: number (hours since research started)
// data.can_retry: boolean (can trigger new research)
```

### Load Insights

```typescript
// GET /api/features/[username]
const response = await fetch(`/api/features/${username}`);
const { success, data } = await response.json();

// data: Feature[] (grouped by question)
```

## Styling

**Color Scheme:**
- Not Started: Blue (`bg-blue-50`, `border-blue-200`)
- Running: Amber (`bg-amber-50`, `border-amber-200`)
- Completed: Green (`bg-green-50`, `border-green-200`)
- Failed: Red (`bg-red-50`, `border-red-200`)

**Dark Mode Support:**
- All colors have dark mode variants
- Proper contrast ratios maintained

**Animations:**
- Insight cards: 500ms slide-in + fade
- Spinner: Continuous rotation
- Transitions: Smooth 300-500ms

## Testing Scenarios

### Test 1: Fresh Profile
1. Visit `/username` where research never run
2. Should auto-trigger research
3. Status banner shows "Running"
4. Insights appear gradually

### Test 2: Running Research
1. Research in progress
2. Reload page
3. Status shows "Running" without re-triggering
4. Insights continue to load

### Test 3: Completed Research
1. Research completed 2 hours ago
2. Visit profile
3. Status shows "Completed 2h ago"
4. All insights displayed
5. Cannot trigger new research

### Test 4: Failed Research
1. Previous research failed
2. Visit profile
3. Status shows "Failed" with error
4. Can click "Retry" button
5. Research re-triggers

### Test 5: 24-Hour Cooldown
1. Research completed 25 hours ago
2. Visit profile
3. Can trigger new research
4. Old data cleared, new research starts

## Configuration

No configuration needed! All settings are hardcoded:

- **Status poll interval**: 5 seconds
- **Insights poll interval**: 10 seconds
- **Cooldown period**: 24 hours
- **Animation duration**: 500ms

## Monitoring

Watch console logs for:

```
[Linkup] Research already completed 3h ago for @username, skipping trigger
[Research API] Request received for @username
[Research API] Starting research for @username
[ProfileClient] Research completed, reloading insights...
```

## Future Enhancements

Possible improvements:
- Real-time WebSocket updates instead of polling
- Progress percentage indicator
- Estimated time remaining
- Detailed research steps/stages
- Cancel research button
- Research history view
- Manual refresh after 24 hours
