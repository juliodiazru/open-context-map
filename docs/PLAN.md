# Project plan

This document explains the plan in simple language.

## Problem

When an AI or a person changes code, reading a single file is not enough.

You need to understand:

- where a flow starts
- who calls what
- which files are related
- which tests might break
- what happens if one piece changes: what depends on it

## Goal

Build a local tool that creates a structural code map before editing.

That map should be queryable from the terminal and also from `opencode` through MCP.

The LLM should not have to discover the architecture by reading linear text.

The system should provide the relevant path, the impact, and the real relationships.

It should also make two common mental paths explicit:

- go backward from a piece to find the origin of the flow
- go forward from a piece to understand everything it triggers

## What is already implemented

### Engine base

- minimal Node.js project
- no external runtime dependencies
- local CLI
- MCP server

### Local map

- nodes for files and symbols
- import and call relationships
- index persisted in `.open-context-map/index.json`
- incremental reindexing when files change

### Graph analysis

- symbol and file search
- callers: who calls a symbol
- callees: what a symbol calls
- trace: forward flow from a symbol
- impact: backward flow, what breaks if a symbol changes

### Integration with opencode

- `opencode.json`
- local skill
- example commands
- example subagent
- `init` command to generate everything in a user project
- `uninstall` command to clean up everything `init` added
- automatic behavior after restarting `opencode`

## Recommended next steps

### Better parser

Keep improving the parser without breaking the simple installation principle.

If a deeper parser or LSP support is ever added, it should be transparent to the user and should not require extra manual steps.

### Better symbol resolution

Resolve methods with the same name in different classes more accurately.

### Architectural anomaly detection

Detect:

- classes with too many methods and too many outgoing calls
- symbols with no callers (dead code)
- cycles in the call graph

### Open publication

Publish the package manually when it is ready, so usage becomes:

```bash
pnpm dlx open-context-map@0.1.0 init .
```

### Better opencode experience

Add more specialized commands and agents only if they solve real repeated cases.

### Evaluation

Test the project with several example repositories and measure whether the generated context actually helps editing.

## Knowledge base

The project idea does not come from intuition alone.

It is supported by known work on program comprehension:

- Weiser (IEEE TSE, 1984): slicing for impact analysis
- LaToza, Venolia, and DeLine (ICSE, 2006): following call chains helps maintain the mental model
- Maalej et al. (TOSEM, 2014): people understand code better with structural navigation than with linear reading
- RepoCoder (EMNLP, 2023): for AI models, retrieving structured context works better than feeding complete files
