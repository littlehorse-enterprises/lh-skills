# Error: Task Output Assigned Directly to WfRunVariable

**Category:** Compile-Time  
**Component:** Workflow Spec

### The Error

```text
incompatible types: TaskNodeOutput cannot be converted to WfRunVariable
    WfRunVariable result = wf.execute("greet-task");
```

### Error Pattern *(optional — use for generic scenarios only)*

```text
incompatible types: <TASK_OUTPUT_TYPE> cannot be converted to <WF_VARIABLE_TYPE>
```

### Faulty Code / Trigger

```java
@Override
public void define(WorkflowThread wf) {
    WfRunVariable result = wf.execute("greet-task");
}
```

### Root Cause

`wf.execute()` returns a `TaskNodeOutput` (a node output reference), not a declared `WfRunVariable`. Direct assignment fails because the workflow variable must first be declared and then assigned from the task output.

### The Fix

1. Declare a workflow variable with the expected type (for example, `wf.declareStr("result")`).
2. Execute the task and capture the returned `NodeOutput`/`TaskNodeOutput`.
3. Assign that task output into the declared variable using `.assign(...)`.

### Corrected Code / Action

```java
@Override
public void define(WorkflowThread wf) {
    WfRunVariable result = wf.declareStr("result");
    NodeOutput taskOutput = wf.execute("greet-task");
    result.assign(taskOutput);
    // or directly:
    // result.assign(wf.execute("greet-task"));
}
```
