---
name: open-context-map-first
description: Use when the user asks about bugs, refactors, code flow, callers, callees, impact analysis, or repository context. Use the open-context-map MCP before editing files.
---

# Open Context Map First

Use this skill when the user needs to understand code before changing it.

## Rule

Use the `open-context-map` MCP first for bugs, refactors, features, impact analysis, and flow explanations.

## Suggested flow

1. Build a context pack for the requested symbol or topic.
2. If needed, inspect callers, callees, and trace flow.
3. Read the real files that the map points to.
4. Only edit after checking the source files.

The graph is a helper, not the final truth.
