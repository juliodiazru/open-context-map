# Project plan

> Language: English
> Idioma: [Español](es/PLAN.md)

This document explains the roadmap in simple language.

## Problem

When a person or an AI edits code, reading one file is rarely enough.

You also need to understand:

- where a flow starts
- who calls what
- which files are related
- which tests may be affected
- what depends on the code you want to change

## Goal

Build a local tool that creates a structural repository map before editing.

That map should be available from:

- the terminal
- `opencode` through MCP

The goal is not to replace normal code reading.

The goal is to make repository structure easier to find.

## What is already implemented

### Core engine

- Node.js project
- runtime based on built-in APIs
- local CLI
- local MCP server

### Local graph

- nodes for files and symbols
- import and call relationships
- local index in `.open-context-map/index.json`
- incremental reindexing when files change

### Analysis features

- symbol and file search
- callers
- callees
- forward trace
- backward impact analysis
- context packs for `bug`, `refactor`, `feature`, and `general`

### `opencode` integration

- generated `opencode.json` entry
- generated skill, commands, and subagent
- `init` command to create everything in a user project
- `uninstall` command to remove generated setup

## Next steps

### Improve parser quality

Keep improving symbol and call detection without turning the installation into a heavy setup.

### Improve symbol resolution

Better distinguish methods that share the same short name in different classes or files.

### Add higher-level graph signals

Useful future checks include:

- dead code candidates
- cycles in the call graph
- classes with too many outgoing calls

### Harden release workflow

The package is already published. The next maturity step is to keep improving release hardening, for example:

- maintainer account protection
- trusted publishing
- provenance
- stronger automated checks around releases

The current manual release process is documented in `docs/RELEASE_PROCESS.md`.

### Improve `opencode` experience carefully

Add more commands or agents only when they solve a repeated user problem.

### Evaluate on real repositories

Test the tool on more repositories and measure whether the generated context actually helps editing and review.

## Knowledge base

The project idea is grounded in known work on program comprehension:

- Weiser (IEEE TSE, 1984): slicing for impact analysis
- LaToza, Venolia, and DeLine (ICSE, 2006): following call chains helps maintain the mental model
- Maalej et al. (TOSEM, 2014): structural navigation helps people understand code better than purely linear reading
- RepoCoder (EMNLP, 2023): structured retrieval can help code-focused AI tasks more than dumping whole files
