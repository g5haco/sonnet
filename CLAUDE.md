@AGENTS.md

## graphify

Project got knowledge graph at graphify-out/ — god nodes, community structure, cross-file relations.

Rules:
- Codebase question? Run `graphify query "<question>"` first when graphify-out/graph.json exist. Use `graphify path "<A>" "<B>"` for relations, `graphify explain "<concept>"` for concepts. Return scoped subgraph, smaller than GRAPH_REPORT.md or raw grep.
- graphify-out/wiki/index.md exist? Use for broad nav, not raw source browse.
- Read graphify-out/GRAPH_REPORT.md only for broad arch review or when query/path/explain not enough.
- After code change, run `graphify update .` — keep graph current (AST-only, no API cost).

## Working style

Optimize token efficiency. Use smallest effective agent count.

### Default implementation review rule

Normal feature work — lightweight review default:

1. Implement change normal.
2. Run relevant tests/build/app flow.
3. Spawn one fresh reviewer sub-agent, not the implementer.
4. Reviewer check only:
   - all prompt requirements done
   - feature work in running app
   - no obvious bug, regression, overflow, broken state, runtime error
   - existing function not broken/rewritten needlessly
5. Issues found? Fix, retest.
6. Max one review/fix round.
7. No big agent team unless task clearly need parallel work.
8. No tokens on subjective micro-polish unless asked.

Tiny change? Skip reviewer, just implement + verify.

Major milestone or release-critical feature — full multi-round Gauntlet only if explicitly asked.

## Codebase Navigation

Graphify = primary method for understand repo.

Before broad Glob, Grep, exploratory Read:

1. Query Graphify knowledge graph first.
2. Find smallest set relevant files/symbols.
3. Read only files needed for task.
4. No recursive explore of unrelated repo parts.

Use:
- `graphify query "<question>"` for arch/subsystem question
- `graphify explain "<concept>"` for understand component/concept
- `graphify path "<A>" "<B>"` for see how two parts connect

After big code change, update graph — don't rebuild from scratch.

Optimize min context usage, keep correctness.

## Token Efficiency

Optimize min context, keep correctness.

### Repository Navigation
Use Graphify before broad source explore.

1. Query Graphify — find subsystem, symbol, dependency, exec path.
2. Read only min source files needed.
3. Avoid broad recursive Glob/Grep/Read unless Graphify not enough.

### Communication
Use Caveman-style terse talk.

- No filler talk.
- No long preamble.
- Don't restate my request.
- Report finding, decision, blocker, result direct.
- Keep explain short unless I ask detail.

### Tool Output
Prefer compressed command/tool output where can.

For big:
- test output
- build log
- JSON
- diff
- search result
- web output

use Caveman compress, not full raw output into context.

Get original output only if compressed not enough.

### Context Discipline
Don't read file just to "understand project."

Use:
- `HANDOFF.md` for current project state, decision
- Graphify for code arch
- source file only for impl detail needed by current task