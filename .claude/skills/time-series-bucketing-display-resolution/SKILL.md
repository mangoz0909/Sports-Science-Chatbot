---
name: time-series-bucketing-display-resolution
description: When time-series charts crowd: bucket by display scale.
category: data-visualization
---

When visualizing a year of daily data as individual tiles or bars, every point becomes noise — a 365-wide heatmap, a 365-tall chart. Aggregate the granularity: compress years to months, days to hours, weeks to days. The display window determines the bucket size.

**Pattern:**
1. Define bucket boundaries by the view's time range: Day → hourly, Week → daily, Month → daily, Year → monthly.
2. Write a stateless aggregation function (sum, average, or take-latest for each bucket).
3. Map the raw data into buckets, compute the aggregate, and emit one point per bucket.
4. Adjust label density and grid layout to the bucket count (e.g., Year: 12 months → 3 cols × 4 rows on desktop, 2 cols × 6 rows on mobile; adjust so no label clipping occurs).

**Why this matters:**
- A 365-tile heatmap scrolls off-screen and is visually illegible; 12 monthly tiles fit and show trends.
- Unread charts are ignored; readable charts drive action.
- The view range (Day/Week/Month/Year) is your UI's contract with the data; honor it by bucketing.

See `references/dashboard-range-example.md` for the Day/Week/Month/Year bucketing used in a real dashboard with heatmap row calculation and responsive label formats.