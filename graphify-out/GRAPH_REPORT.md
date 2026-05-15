# Graph Report - C:\Users\jhernandez\.config\opencode  (2026-05-15)

## Corpus Check
- Corpus is ~2,388 words - fits in a single context window. You may not need a graph.

## Summary
- 23 nodes · 28 edges · 3 communities
- Extraction: 68% EXTRACTED · 32% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Engram Plugin|Engram Plugin]]
- [[_COMMUNITY_AGENTS.md Config|AGENTS.md Config]]
- [[_COMMUNITY_Module 2|Module 2]]

## God Nodes (most connected - your core abstractions)
1. `Engram Plugin` - 8 edges
2. `Engram()` - 4 edges
3. `engramFetch (HTTP Client)` - 3 edges
4. `ensureSession` - 3 edges
5. `MEMORY_INSTRUCTIONS` - 3 edges
6. `engramFetch()` - 2 edges
7. `isEngramRunning()` - 2 edges
8. `extractProjectName()` - 2 edges
9. `Claude-Mem Memory Context` - 2 edges
10. `Context7 MCP` - 2 edges

## Surprising Connections (you probably didn't know these)
- `MEMORY_INSTRUCTIONS` --conceptually_related_to--> `Claude-Mem Memory Context`  [INFERRED]
  plugins/engram.ts → .config/opencode/AGENTS.md

## Communities (3 total, 0 thin omitted)

### Community 0 - "Engram Plugin"
Cohesion: 0.31
Nodes (6): Engram(), ENGRAM_PORT, ENGRAM_TOOLS, engramFetch(), extractProjectName(), isEngramRunning()

### Community 1 - "AGENTS.md Config"
Cohesion: 0.31
Nodes (9): ENGRAM_TOOLS (Set), engramFetch (HTTP Client), Engram Go Binary (Backend), Engram Plugin, ensureSession, OpenCode Event System, Passive Learning Capture, Session On-Demand Creation (+1 more)

### Community 2 - "Module 2"
Cohesion: 0.4
Nodes (5): Claude-Mem Memory Context, Context7 MCP, Library Documentation Workflow, MEMORY_INSTRUCTIONS, Compaction Persistence Hooks

## Knowledge Gaps
- **5 isolated node(s):** `ENGRAM_PORT`, `ENGRAM_TOOLS`, `Library Documentation Workflow`, `ENGRAM_TOOLS (Set)`, `OpenCode Event System`
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Engram Plugin` connect `AGENTS.md Config` to `Module 2`?**
  _High betweenness centrality (0.251) - this node is a cross-community bridge._
- **Why does `MEMORY_INSTRUCTIONS` connect `Module 2` to `AGENTS.md Config`?**
  _High betweenness centrality (0.130) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `Engram Plugin` (e.g. with `OpenCode Event System` and `Session On-Demand Creation`) actually correct?**
  _`Engram Plugin` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `MEMORY_INSTRUCTIONS` (e.g. with `Compaction Persistence Hooks` and `Claude-Mem Memory Context`) actually correct?**
  _`MEMORY_INSTRUCTIONS` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `ENGRAM_PORT`, `ENGRAM_TOOLS`, `Library Documentation Workflow` to the rest of the system?**
  _5 weakly-connected nodes found - possible documentation gaps or missing edges._