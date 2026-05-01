# OpenCode Support for lh-skills

This repository includes an OpenCode plugin that auto-registers the local `skills/` directory.

## Install and Use

Add this repository as a plugin in your OpenCode config (`opencode.json`):

```json
{
  "plugin": ["lh-skills@git+https://github.com/littlehorse-enterprises/lh-skills.git"]
}
```

Restart OpenCode after updating config.

You can verify discovery with the `skill` tool, for example by listing skills and loading one from this repo.

## Why this plugin exists

- It ensures skills are discoverable without each user manually setting `skills.paths`.
- It is registration-only by design: no prompt/bootstrap injection, to avoid context bloat.

## File Layout

- `.opencode/plugins/lh-skills.js`: plugin entry point that appends the repository `skills/` path to `config.skills.paths`.
- `.opencode/README.md`: this document.

## Maintainer Notes

- Keep plugin behavior minimal and idempotent.
- Fail fast if `skills/` cannot be found; do not silently ignore misconfiguration.
- Prefer Node stdlib only unless a dependency is strictly necessary.

## Troubleshooting

If skills are not discoverable:

1. Confirm the plugin entry in `opencode.json` is correct.
2. Restart OpenCode.
3. Check that this repository contains the `skills/` directory.
4. Check OpenCode logs for plugin loading errors.
