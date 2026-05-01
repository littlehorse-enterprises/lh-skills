# LittleHorse Skills

This repository includes skill files compatible with OpenCode and Claude Code for working with the LittleHorse Ecosystem.

## Layout

- `skills/<skill-name>/SKILL.md`: one standalone skill per directory.
- Skills are organized around LittleHorse mental models, `lhctl` operations, and `WfSpec` development across Java, Go, C#, and Python.

## Installation

The following works for both OpenCode and Claude Code:

```
cp -r skills/* ~/.claude/skills/
```

Or for OpenCode:

```
cp -r skills/* ~/.config/opencode/skills/
```

### OpenCode plugin-based install (recommended)

This repository also supports OpenCode plugin-based skill discovery.

See `.opencode/README.md` for setup and maintainer notes.
For verification and troubleshooting steps, see `.opencode/README.md`.
