# Error: Missing Required Input Variable on Workflow Run

**Category:** Run-Time  
**Component:** Client CLI

### The Error

```text
2026/04/20 16:33:34 rpc error: code = InvalidArgument desc = ThreadSpec entrypoint invalid: Must provide required input variable name of type STR
```

### Faulty Code / Trigger

```bash
lhctl run greet-workflow
```

### Root Cause

The workflow declares `name` as a required input variable. The `lhctl run` command omitted it, so the server rejects the run request before execution begins.

### The Fix

1. Pass the required variable name and value as `key value` pairs after the workflow name.
2. Variable names are case-sensitive and must match exactly what was declared in the workflow spec.

### Corrected Code / Action

```bash
lhctl run greet-workflow name Obi-Wan
```
