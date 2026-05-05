# Error: Workflow References a Nonexistent TaskDef

**Category:** Compile-Time  
**Component:** Workflow Spec / Task Worker

### The Error

```text
Exception in thread "main" io.grpc.StatusRuntimeException: INVALID_ARGUMENT: PutWfSpecRequest is invalid: ThreadSpec entrypoint invalid: Node 1-method-1-TASK invalid: Refers to nonexistent TaskDef method-1
        at io.grpc.stub.ClientCalls.toStatusRuntimeException(ClientCalls.java:368)
        at io.grpc.stub.ClientCalls.getUnchecked(ClientCalls.java:349)
        at io.grpc.stub.ClientCalls.blockingUnaryCall(ClientCalls.java:174)
        at io.littlehorse.sdk.common.proto.LittleHorseGrpc$LittleHorseBlockingStub.putWfSpec(LittleHorseGrpc.java:5968)
        at io.littlehorse.sdk.wfsdk.internal.WorkflowImpl.registerWfSpec(WorkflowImpl.java:73)
        at org.example.Main.main(Main.java:18)
```

### Error Pattern

```text
Refers to nonexistent TaskDef <task-def-name>
```

### Faulty Code / Trigger

```java
// The task def name passed to wf.execute() does not match any registered TaskDef.
wf.execute("method-1", someVar);
```

### Root Cause

The workflow spec references a task definition name that the server does not know at registration time. This usually happens in one of two ways: a naming mismatch, or incomplete/late task definition registration in `Main.java`.

### The Fix

1. Confirm the task name in `wf.execute(...)` exactly matches the name used by `@LHTaskMethod(...)` and `LHTaskWorker(...)`.
2. **IMPORTANT** Confirm all referenced task defs are registered before `registerWfSpec()`.

### Debug Checklist

1. Name match check:
`wf.execute("method-1")` must match `@LHTaskMethod("method-1")` exactly (including casing and hyphens).
2. Registration order check:
All `registerTaskDef()` calls must happen before `workflow.getWorkflow().registerWfSpec(...)`.
3. Coverage check:
Every task referenced in the workflow must have a corresponding worker instance that registers that task def.

### Corrected Code / Action

```java
// Check 1: Name mismatch, use constants to avoid name discrepancies
Worker.java
----
public static final String MY_TASK = "my-task";

@LHTaskMethod(MY_TASK)
public String myTask(String input) { ... }
----

Workflow.java
----
wf.execute(Worker.MY_TASK, someVar);
----

// Check 2: ensure all task definitions referenced by the wfSpec are registered before the wfSpec
Main.java 
----
LHTaskWorker greetWorker   = new LHTaskWorker(new Worker(), Worker.GREET_TASK, config);
LHTaskWorker method1Worker = new LHTaskWorker(new Worker(), "method-1", config);
LHTaskWorker method2Worker = new LHTaskWorker(new Worker(), "method-2", config);
LHTaskWorker method3Worker = new LHTaskWorker(new Worker(), "method-3", config);

greetWorker.registerTaskDef();
method1Worker.registerTaskDef();
method2Worker.registerTaskDef();
method3Worker.registerTaskDef();

workflow.getWorkflow().registerWfSpec(config.getBlockingStub());
----
```
