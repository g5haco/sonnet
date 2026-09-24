@AGENTS.md

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## Working style

Optimize for token efficiency. Prefer the smallest effective number of agents.

### Default implementation review rule

For normal feature work, use a lightweight review process by default:

1. Implement the requested change normally.
2. Run the relevant tests/build/app flow.
3. Spawn one fresh reviewer sub-agent that did not implement the task.
4. Reviewer checks only:
   - all prompt requirements were completed
   - the feature works in the running app
   - no obvious bugs, regressions, overflow, broken states, or runtime errors
   - existing functionality was not unnecessarily broken or rewritten
5. If important issues are found, fix them and re-test.
6. Maximum one review/fix round.
7. Do not spawn a large agent team unless the task clearly benefits from parallel work.
8. Do not spend tokens on subjective micro-polish unless explicitly requested.

For tiny changes, skip the reviewer and just implement + verify.

For major milestones or release-critical features, use a full multi-round Gauntlet only when explicitly requested.

## Codebase Navigation

Use Graphify as the primary method for understanding the repository.

Before performing broad Glob, Grep, or exploratory Read operations:

1. Query the Graphify knowledge graph first.
2. Identify the smallest set of relevant files/symbols.
3. Read only those files necessary for the task.
4. Do not recursively explore unrelated parts of the repository.

Use:
- `graphify query "<question>"` for architecture/subsystem questions
- `graphify explain "<concept>"` to understand a component or concept
- `graphify path "<A>" "<B>"` to understand how two parts of the system connect

After significant code changes, update the graph rather than rebuilding it from scratch.

Optimize for minimum context usage while preserving correctness.

## Token Efficiency

Optimize for minimal context usage without sacrificing correctness.

### Repository Navigation
Use Graphify before broad source exploration.

1. Query Graphify to locate relevant subsystems, symbols, dependencies, and execution paths.
2. Read only the minimum source files necessary.
3. Avoid broad recursive Glob/Grep/Read operations unless Graphify is insufficient.

### Communication
Use Caveman-style concise communication.

- No conversational filler.
- No lengthy preambles.
- Do not restate my request.
- Report findings, decisions, blockers, and results directly.
- Keep explanations concise unless I explicitly request detail.

### Tool Output
Prefer compressed command/tool output where possible.

For large:
- test output
- build logs
- JSON
- diffs
- search results
- web output

use Caveman compression rather than loading full raw output into context.

Retrieve the original output only when the compressed version is insufficient.

### Context Discipline
Do not read files merely to "understand the project."

Use:
- `HANDOFF.md` for current project state and decisions
- Graphify for code architecture
- source files only for implementation details required by the current task
