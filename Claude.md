# Claude Code Project Guide

This file contains project-specific instructions for Claude Code when working on this codebase.

## Session Initialization

### 1. Initialize Next.js Context (REQUIRED)

**At the start of every session, run:**

```bash
# Initialize Next.js DevTools MCP context
mcp__next-devtools__init

# Start the dev server
npm run dev
```

This initialization:
- Loads the latest Next.js documentation
- Establishes mandatory documentation-first approach
- Sets up MCP tools for runtime debugging
- Starts the development server

### 2. Use Next.js Documentation

For ANY Next.js-related concept, API, or feature:
- ALWAYS use `nextjs_docs` tool with the `get` action
- Refer to the llms.txt index loaded during init
- NEVER answer from training data alone

## Task Management

### Use Beads Exclusively

**DO NOT create markdown TODO files or plans.**

Instead, use beads for all task tracking:

```bash
# List current issues
bd list

# Show ready-to-work tasks
bd ready

# Show project statistics
bd stats

# Create a new task
bd create --type task --priority 2 "Task description"

# Update issue status
bd update <issue-id> --status in_progress
bd update <issue-id> --status closed

# View specific issue
bd show <issue-id>
```

### Beads Workflow

1. **Starting work**: Check `bd ready` for tasks with no blockers
2. **During work**: Update issue status to `in_progress`
3. **After completion**: Close issues with `bd update <id> --status closed`
4. **Commit beads changes**: Always commit `.beads/` directory after updates

## Project-Specific Information

### Database Connection

- Uses PostgreSQL via Neon
- Connection: `NEON_DATABASE_URL` environment variable
- Library: `pg` (node-postgres)
- SSL: Standard PostgreSQL SSL (sslmode=require)

### Environment Variables

Located in `.env.development.local` (gitignored):
- `NEON_DATABASE_URL` - Database connection (pooled)
- `X_RAPIDAPI_HOST` - Twitter API host
- `X_RAPIDAPI_KEY` - Twitter API key

### API Routes

- `/api/profile/[username]` - Fetch X/Twitter profile with 1-hour cache

### Tech Stack

- **Framework**: Next.js 16.0.3 (App Router with Turbopack)
- **React**: 19.2.0
- **Database**: PostgreSQL (Neon)
- **Styling**: Tailwind CSS v4
- **Database Client**: `pg` library

## Best Practices

1. **Always commit with descriptive messages** including:
   - What was changed
   - Why it was changed
   - Beads issue references when applicable

2. **Never commit secrets**:
   - All `.env*` files are gitignored
   - Use environment variables for all sensitive data

3. **Track progress in beads**:
   - Close completed issues immediately
   - Update issue status as you work
   - Commit `.beads/` directory with your changes

4. **Use Next.js MCP tools**:
   - `nextjs_runtime` - Check running dev server state
   - `browser_eval` - Test pages with browser automation
   - `nextjs_docs` - Get official Next.js documentation

## Quick Reference

### Start New Session
```bash
# 1. Initialize Next.js context
mcp__next-devtools__init

# 2. Start dev server
npm run dev

# 3. Check beads for current tasks
bd ready
```

### During Development
```bash
# Check server status
# Use BashOutput tool to monitor dev server

# Test API endpoint
curl http://localhost:3000/api/profile/<username>

# Update beads progress
bd update <issue-id> --status in_progress
```

### Before Committing
```bash
# Verify no secrets in staged files
git diff --cached

# Commit code changes
git add -A
git commit -m "Description"

# Update and commit beads
bd update <issue-id> --status closed
git add .beads/
git commit -m "Update beads: close completed tasks"

# Push everything
git push
```

---

**Last Updated**: 2025-11-15
**Next.js Version**: 16.0.3
**Beads Plugin**: [steveyegge/beads](https://github.com/steveyegge/beads)
