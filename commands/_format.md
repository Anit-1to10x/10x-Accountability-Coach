# Command Format Reference

All commands use structured tags for efficient parsing by both small and large models.

## Tags

- `<cmd name="...">` — Command identity and short description
- `<ref>` — Skill file to reference for detailed behavior
- `<input>` — Accepted arguments and flags
- `<steps>` — Numbered execution steps (follow in order)
- `<data path="...">` — JSON schema shorthand for file I/O
- `<output>` — What to display to user after execution
- `<options>` — Available choices/modes

## Rules

1. Follow `<steps>` in exact order
2. Read `<ref>` skill file for detailed behavior when referenced
3. Write data matching `<data>` schema exactly
4. Always show `<output>` format to user on completion
5. If a step fails, inform user and suggest fix
