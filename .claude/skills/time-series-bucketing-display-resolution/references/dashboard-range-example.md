# Time-Series Bucketing: Dashboard Range Example

## Problem
A dashboard showed readiness, recovery, load, and fatigue scores. For a Year view, the raw data was 365 daily data points:
- Year view rendered a heatmap with 365 tiles in one row → horizontal scroll, illegible.
- Day view rendered hourly bars, but a single pixel-high bar was invisible.
- Labels (weekday, month, date) needed to vary by range to avoid clipping.

## Solution

### 1. Bucket definition by range
```typescript
const RANGE_BUCKET_WINDOWS = {
  1: 'daily',      // Day: keep all data (no bucketing)
  7: 'daily',      // Week: one point per day (already daily)
  30: 'daily',     // Month: one point per day
  365: 'monthly'   // Year: one point per month (aggregate 30~31 days)
};
```

### 2. Aggregation for monthly buckets
```typescript
function bucketByMonth(points: TrendPoint[], now: Date = new Date()): TrendPoint[] {
  // Group points into 12 month buckets from the past 12 months
  const buckets: Record<string, TrendPoint[]> = {};
  const cutoff = new Date(now.getFullYear() - 1, now.getMonth(), 1);
  
  points.filter(p => new Date(p.key) >= cutoff).forEach(p => {
    const date = new Date(p.key + 'T00:00:00');
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!buckets[monthKey]) buckets[monthKey] = [];
    buckets[monthKey].push(p);
  });
  
  // Average each bucket
  return Object.entries(buckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([monthKey, items]) => {
      const avg = (field: string) => items.reduce((sum, p) => sum + p[field], 0) / items.length;
      const date = new Date(monthKey + '-01T00:00:00');
      return {
        key: monthKey,
        day: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),  // "Nov '25"
        full: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),  // "November 2025"
        readiness: Math.round(avg('readiness')),
        recovery: Math.round(avg('recovery')),
        load: Math.round(avg('load')),
        sleep: Math.round(avg('sleep') * 10) / 10,
        fatigue: Math.round(avg('fatigue'))
      };
    });
}
```

### 3. Heatmap responsive row calculation
```typescript
function heatmapRowsPerWidth(tileCount: number, width: 375 | 1440): number {
  const tileSize = 24; // px per tile, plus gap
  const availableWidth = width - 32; // minus padding
  const tilesPerRow = Math.floor(availableWidth / tileSize);
  return Math.ceil(tileCount / tilesPerRow);
}

// Year: 12 months
// Desktop 1440px: (1440 - 32) / 24 ≈ 59 tiles per row → 1 row (12 tiles fit)
// Mobile 375px: (375 - 32) / 24 ≈ 14 tiles per row → 1 row (12 tiles fit, or 6×2 if laid out as grid)

const yearRowsDesktop = heatmapRowsPerWidth(12, 1440); // 1
const yearRowsMobile = heatmapRowsPerWidth(12, 375);   // 1

// But for legibility, arrange as CSS grid:
// Desktop: grid-template-columns: repeat(4, 1fr) → 3 rows of 4
// Mobile: grid-template-columns: repeat(2, 1fr) → 6 rows of 2
```

### 4. Label format by range
```typescript
function labelsByRange(range: 1 | 7 | 30 | 365): (dateStr: string) => { day: string; full: string } {
  return (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return {
      day: {
        1: d.toLocaleDateString('en-US', { weekday: 'short' }),         // "Mon"
        7: d.toLocaleDateString('en-US', { weekday: 'short' }),         // "Mon"
        30: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),  // "Oct 3"
        365: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })  // "Nov '25"
      }[range],
      full: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })  // "Mon Oct 3"
    };
  };
}
```

### 5. Testing the bucketing
```typescript
import { expect, it } from 'vitest';
import { bucketByMonth } from './trendRange';

it('buckets 365 daily points into 12 monthly averages', () => {
  const year = 365;
  const mockData = Array.from({ length: year }, (_, i) => ({
    key: new Date(new Date().getFullYear() - 1, 0, i + 1).toISOString().split('T')[0],
    day: `${i}`,
    full: `Day ${i}`,
    readiness: 70 + (i % 10),
    recovery: 65 + (i % 8),
    load: 50 + (i % 20),
    sleep: 7 + (i % 2),
    fatigue: 30 + (i % 15)
  }));
  
  const bucketed = bucketByMonth(mockData);
  expect(bucketed).toHaveLength(12);
  expect(bucketed[0].key).toMatch(/^\d{4}-01$/);  // First bucket is month 01
  expect(bucketed[0].day).toMatch(/Jan|Nov/);
  expect(bucketed[0].readiness).toBeGreaterThan(0);
});

it('labels match the display resolution', () => {
  const labels = labelsByRange(365);
  const result = labels('2025-11-15');
  expect(result.day).toMatch(/Nov/);
  expect(result.day).toMatch(/'\d{2}/);
});
```

## Result
- **Year:** 12 readable monthly tiles, no horizontal scroll.
- **Month:** 30 daily tiles, label density tuned (every 3rd or 5th).
- **Week:** 7 daily bars, no clipping.
- **Day:** Hourly or 4-hour detail, visible.

The trade-off: aggregation loses granularity, but a chart no one reads (because it's unreadable) is worse than one that simplifies data to show trends.