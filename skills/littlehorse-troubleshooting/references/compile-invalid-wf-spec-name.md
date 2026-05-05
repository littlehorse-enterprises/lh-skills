# Error: Invalid Workflow Spec Name Rejected During Registration

**Category:** Compile-Time  
**Component:** Workflow Spec

### The Error

```text
Exception in thread "main" io.grpc.StatusRuntimeException: INVALID_ARGUMENT: WfSpecName must be a valid hostname
        at io.grpc.stub.ClientCalls.toStatusRuntimeException(ClientCalls.java:368)
        at io.grpc.stub.ClientCalls.getUnchecked(ClientCalls.java:349)
        at io.grpc.stub.ClientCalls.blockingUnaryCall(ClientCalls.java:174)
        at io.littlehorse.sdk.common.proto.LittleHorseGrpc$LittleHorseBlockingStub.putWfSpec(LittleHorseGrpc.java:5968)
        at io.littlehorse.sdk.wfsdk.internal.WorkflowImpl.registerWfSpec(WorkflowImpl.java:73)
        at org.example.Main.main(Main.java:18)
```

### Faulty Code / Trigger

```java
final String GREET_WORKFLOW = "GREET_workflow";
```

### Root Cause

Workflow spec names (and task definition names) must follow hostname-style formatting: lowercase letters, numbers, and hyphens only. Uppercase letters and underscores are not allowed.

### The Fix

1. Rename the workflow spec constant to use only lowercase letters, numbers, and hyphens.
2. Re-run the application to re-register the spec.

### Corrected Code / Action

```java
final String GREET_WORKFLOW = "greet-workflow";
```