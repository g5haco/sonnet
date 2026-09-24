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
