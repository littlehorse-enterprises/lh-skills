---
name: java-wfspec-threads
description: Information about how to use and handle threads when building a WfSpec in Java.
---
# Java `WfSpec` Threads

* Every `WfSpec` has an entrypoint `ThreadSpec` which defines the thread to run when the `WfSpec` starts
* `ThreadRun` is a running instance of a `ThreadSpec`
* Use multiple threads for:
  * Running tasks in parallel
  * Catching failures on a group of steps (nodes) in a WfRun with a single failure handler
* A parent thread does not exit until all of its children terminate
* If a child fails its error propagates to parent when parent waits for child but not before then
* Parent can catch child failures
* Child threads can read / write any variables of the parent
* Parent cannot access variables of child
* Child threads don't know about their siblings
* If child throws business `EXCEPTION`, that exception is propagated as-is
* If child has a technical `ERROR`, parent receives `CHILD_FAILURE` error

## Examples

Relevant imports:
```java
import io.littlehorse.sdk.wfsdk.SpawnedThread;
import io.littlehorse.sdk.wfsdk.SpawnedThreads;
import io.littlehorse.sdk.wfsdk.WfRunVariable;
import io.littlehorse.sdk.wfsdk.Workflow;
```

### Starting a Child Thread

```java
WfRunVariable parentVar = wf.declareInt("parent-var");

SpawnedThread childThread1 = wf.spawnThread(child -> {
    WfRunVariable childInput = wf.declareStr("child-var");
    
    // You can use (read/mutate) parent var if you want
    parentVar.assign(child.execute("child-task-2", childInput));
},
"child-thread-name",
Map.of("child-var", "some-input"));// pass inputs

wf.execute("parent-task-2"); // executes in paralel with child-task-2

// Optionally have many children
SpawnedThread childThread2 = ...;

wf.waitForThreads(SpawnedThreads.of(childThread1, childThread2));

wf.execute("another-task");
```

### Catching Child Thread Failures on WaitFor Node

You can handle the error on the WaitForThreadNode itself. This exception handler thread is a *sibling* of the failed child thread and therefore doesn't have access to the variables from the child.

```java
WaitForThreadsNodeOutput node = wf.waitForThreads(SpawnedThreads.of(...));

wf.handleAnyFailure(node, handler -> {handler.execute("oh-no")});
```

### Catching Child Thread Failures on Each Thread

If you want the failure handler to have access to variables from the failed child, and you want to handle failures on each child individually:

```java
SpawnedThread thread1 = ...;
SpawneedThread thread2 = ...;

// ...

wf.waitForThreads(SpawnedThreads.of(thread1, thread2)).handleExceptionOnChild("credit-card-invalid", handler -> {
    handler.execute("some-compensation-logic-for-missing-credit-card");
});

// Catch any other failures
wf.waitForThreads(SpawnedThreads.of(thread1, thread2)).handleAnyFailureOnChild(handler -> {
    handler.execute("some-other-compensation-logic", someVariableFromChild);
});
```

### Hack: WfRunVariable Scoping

Access WfRunVariables from child thread without lambda func

```java
private WfRunVariable parentVar;

public void entrypointWfLogic(WorkflowThread wf) {
    parentVar = wf.declareStr("some-var");
    wf.spawnThread(this::childLogic, "child-thread", Map.of());
}

public void childLogic(WorkflowThread wf) {
    wf.execute("something", parentVar);
}
```

### Waiting Strategies

* `waitForThreads()` -> waits for all threads. Fails as soon as first thread fails, other child threads move to `HALTING` -> `HALTED` if they're not terminated yet.
* `waitForAnyOf()` -> waits for any thread to complete. Ignores failures unless all children fail, then throws `CHILD_FAILURE`.
* `waaitForFirstOf()` -> waits for the first thread to either fail or complete, and halts the others. If first thread fails, then the failure thrown by first thread propagates up.

