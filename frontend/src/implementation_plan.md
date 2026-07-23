# Dashboard Implementation Plan

## Problem Statement
The Dashboard page and its 9 widgets currently use hardcoded `mockLeads` and `mockActivities` from `mock-data.ts`. They need to display real-time analytics pulled from the Supabase database, while respecting the interactive `dateFilter` (Today, Week, Month, Year, Custom) present on the page.

## Proposed Changes

We will transition the dashboard from isolated mock-data imports to a top-down data flow architecture. 

### 1. Centralized Data Fetching
Instead of each component independently fetching data (which would trigger 9+ simultaneous queries to Supabase), we will fetch the data once at the top level and pass it down. 
We will create a new custom hook in `use-data.ts` called `useDashboardData(dateFilter, customRange)`. 
This hook will fetch:
- All leads matching the date filter
- All activities matching the date filter
- The status definitions (for colors/names)

### 2. Update `app/(main)/dashboard/page.tsx`
- Call `useDashboardData` to fetch `leads` and `activities`.
- Handle the `loading` state (render a skeleton or loading spinner).
- Pass the fetched `leads` and `activities` as props to all 9 child widgets.

### 3. Refactor Dashboard Widgets
Update the following 9 components to accept `leads` and `activities` as props, and remove all imports of `mockLeads`/`mockTeamMembers`/`mockActivities`:
- [MODIFY] `PipelineSummary.tsx`
- [MODIFY] `NewLeadsStats.tsx`
- [MODIFY] `LeadsBySource.tsx`
- [MODIFY] `ConversionRate.tsx`
- [MODIFY] `PipelineValue.tsx`
- [MODIFY] `FollowUps.tsx`
- [MODIFY] `TeamLeaderboard.tsx`
- [MODIFY] `RecentActivityFeed.tsx`
- [MODIFY] `WonVsLostTrend.tsx`

### 4. Remove `mock-data.ts`
Once the dashboard is fully migrated, the `mock-data.ts` file will no longer be used anywhere in the application. We can safely delete it.
- [DELETE] `src/lib/mock-data.ts`

## User Review Required

> [!IMPORTANT]
> **Client-Side Aggregation vs Backend RPCs**
> For this V1 iteration, since the volume of leads created in a given month is manageable (typically <10,000), we will pull the filtered records to the client and run the math (sums, counts, grouping) in JavaScript. This is much faster to build and extremely snappy for the user. If the dataset grows to millions of records, we will need to move these aggregations to Supabase SQL RPC functions in a future update.

## Open Questions
None. If this plan looks good, I will execute the changes!
