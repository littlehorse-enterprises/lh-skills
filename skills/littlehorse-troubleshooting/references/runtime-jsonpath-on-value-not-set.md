# Error: JSONPath Mutation Fails on Uninitialized JSON Object

**Category:** Run-Time  
**Component:** Workflow Spec / Client CLI

### The Error

```text
lhctl get wfRun 4cdd463875b646b69e42bea33e48853c
...
"status": "ERROR",
...
"errorMessage": "Failed evaluating edge with sink node 2-method-2-TASK: Mutating variable an-object with operation ASSIGN: Cannot jsonpath on VALUE_NOT_SET"
```

### Error Pattern

```text
Cannot jsonpath on VALUE_NOT_SET
```

### Faulty Code / Trigger

```java
WfRunVariable someObject = wf.declareJsonObj("an-object");

someObject.jsonPath("$.firstField").assign(wf.execute("method-1"));
NodeOutput output = wf.execute("method-2");
someObject.jsonPath("$.secondField").assign(output);
```

```bash
lhctl get wfRun <wfRunId>
```

### Root Cause

`an-object` is declared as a JSON object variable but starts as `VALUE_NOT_SET`. The workflow then tries to assign into nested JSONPath fields on that unset value, which fails at runtime.

### The Fix

1. Initialize the JSON object with a default map before writing to JSONPath fields.
2. Include all fields you plan to read/write so path mutations always target an initialized object.
3. Re-run the workflow and verify the wfRun status is no longer `ERROR`.

### Corrected Code / Action

```java
import java.util.Map;

WfRunVariable someObject = wf.declareJsonObj("an-object")
    .withDefault(Map.of(
        "firstField", "",
        "secondField", "",
        "thirdField", ""
    ));

someObject.jsonPath("$.firstField").assign(wf.execute("method-1"));
NodeOutput output = wf.execute("method-2");
someObject.jsonPath("$.secondField").assign(output);

WfRunVariable thirdField = wf.declareStr("third-field");
thirdField.assign(wf.execute("method-3"));
someObject.jsonPath("$.thirdField").assign(thirdField);
```
