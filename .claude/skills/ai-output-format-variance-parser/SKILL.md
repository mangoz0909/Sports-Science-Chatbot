---
name: ai-output-format-variance-parser
description: When AI responses vary on format: normalize on the client.
category: ai-integration
---

Add a response-parser function between the AI call and UI render to normalize output into your expected format.

Even with clear prompt instructions ("Answer in Markdown, never JSON"), models are inconsistent — some runs return the instructed format, others ignore it. Rather than chase prompt wording, normalize on the client: detect which format arrived, convert to canonical form, display that.

**Pattern:**
1. Write a pure parser function that detects format (JSON, Markdown, plain text) and converts to your canonical format.
2. Call it immediately after the API response, before storing or displaying.
3. Unit-test the parser with samples of each format the model might send, including edge cases.
4. Throw with a clear message if normalization fails.

**Why this beats chasing the prompt:**
- Prompts drift; client-side parsers are reliable and version-independent.
- Future model updates don't break your UI; the parser is your contract.
- Testing is faster (stub responses in-page, no backend calls needed).

See `references/pattern.md` for detailed example and testing strategy.