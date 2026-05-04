# LittleHorse Debug Scenario Template

This format is designed for LLM retrieval. Each scenario should be easy to match from a stack trace, `lhctl` error, or broken code snippet.

Store one scenario per file under `docs/debug/`. Filename format: `<phase>-<short-slug>.md`.

---

# Error: [Short, Descriptive Title]

**Category:** [Compile-Time / Run-Time / Registration / Configuration]  
**Component:** [Workflow Spec / Task Worker / Client CLI]

### The Error

```text
[Paste the exact stack trace, gRPC StatusRuntimeException, or CLI output. LLMs use this for semantic matching against user queries.]
```

### Error Pattern *(optional — use for generic scenarios only)*

```text
[Normalized pattern with placeholder types, e.g. "Cannot assign <SOURCE_TYPE> to <TARGET_TYPE> without explicit casting."]
```

### Faulty Code / Trigger

```java
[Provide ONLY the relevant snippet or the CLI command that triggered the error. Omit boilerplate unless it's the cause of the issue.]
```

### Root Cause

[1–2 sentences explaining exactly *why* LittleHorse rejected this. What rule was broken?]

### The Fix

[Clear, step-by-step instructions on what to change.]

### Corrected Code / Action

```java
[The resulting valid code or command.]
```
