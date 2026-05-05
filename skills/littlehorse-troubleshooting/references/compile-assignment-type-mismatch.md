# Error: Variable Assignment Type Mismatch

**Category:** Compile-Time  
**Component:** Workflow Spec

### The Error

```text
Exception in thread "main" io.grpc.StatusRuntimeException: INVALID_ARGUMENT: PutWfSpecRequest is invalid: ThreadSpec entrypoint invalid: Node 0-entrypoint-ENTRYPOINT invalid: Edge with sink node 1-greet-task-TASK invalid: Cannot assign INT to BOOL without explicit casting.
        at io.grpc.stub.ClientCalls.toStatusRuntimeException(ClientCalls.java:368)
        at io.grpc.stub.ClientCalls.getUnchecked(ClientCalls.java:349)
        at io.grpc.stub.ClientCalls.blockingUnaryCall(ClientCalls.java:174)
        at io.littlehorse.sdk.common.proto.LittleHorseGrpc$LittleHorseBlockingStub.putWfSpec(LittleHorseGrpc.java:5968)
        at io.littlehorse.sdk.wfsdk.internal.WorkflowImpl.registerWfSpec(WorkflowImpl.java:73)
        at org.example.Main.main(Main.java:18)
```

### Error Pattern

```text
Cannot assign <SOURCE_TYPE> to <TARGET_TYPE> without explicit casting.
```

### Faulty Code / Trigger

```java
WfRunVariable isGreeted = wf.declareBool("is-greeted").withDefault(false);
isGreeted.assign(12345);
```

### Root Cause

The workflow variable is declared as one type (`BOOL`) but an assignment provides an incompatible type (`INT`). LittleHorse enforces type safety at compile time and rejects the spec before it is registered.

### The Fix

1. Match the assigned value's type to the declared variable type, or change the declaration to match the value.
2. Re-run the application to re-register the spec.

### Corrected Code / Action

```java
WfRunVariable isGreeted = wf.declareBool("is-greeted").withDefault(false);
isGreeted.assign(true);
```
