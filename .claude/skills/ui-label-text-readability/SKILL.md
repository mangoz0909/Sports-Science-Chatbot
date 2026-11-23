---
name: ui-label-text-readability
description: "When UI captions appear too small: ensure at least 12px."
category: accessibility
---

UI captions, labels, and form text must be at least 12px for readability and accessibility.

Scan with DevTools or use `[...document.querySelectorAll('span, p, label')].filter(e => parseFloat(getComputedStyle(e).fontSize) < 12)` to catch violations. Example: LevelPicker.tsx SOLO/TEAM captions raised from 11px to 12px (commit 1702e36).