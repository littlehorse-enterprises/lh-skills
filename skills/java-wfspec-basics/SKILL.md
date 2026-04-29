---
name: java-wfspec-basics
description: Information and code examples to develop and register littlehorse workflows (`WfSpec`s) in java.
---
# Java `WfSpec` Basics

Use as a reference when building LittleHorse WfSpec's in Java.

## Boilerplate

When not using LH Quarkus extension:

```java
LHConfig config = ...;
Workflow wfGenerator = Workflow.newWorkflow(this::wfLogic, "some-wfspec-name");

// Best practices
wfGenerator.withRetentionPolicy(WorkflowRetentionPolicy.newBuilder().setSecondsAfterWfTermination(604800).build());
wfGenerator.setDefaultTaskRetries(5);
wfGenerator.setDefaultTaskExponentialBackoffPolicy(ExponentialBackoffRetryPolicy.newBuilder().setBaseIntervalMs(1000).setMultiplier(3).build());

// Required: actually register
wfGenerator.registerWfSpec(config.getBlockingStub());

// ...

public void wfLogic(WorkflowThread wf) {
    WfRunVariable item = wf.declareStr("item");
    wf.execute("ship-item", item);
}
```

When using LH Quarkus it's automatically registered:

```java
import io.littlehorse.quarkus.workflow.LHWorkflow;
import io.littlehorse.quarkus.workflow.LHWorkflowDefinition;

@LHWorkflow("my-workflow")
public class Foo implements LHWorkflowDefinition {
    @Override
    public void define(WorkflowThread wf) {
        WfRunVariable person = wf.declareStr("person").required().searchable(); // required input var, with index
        wf.execute("send-greeting", person);
    }
}
```

## Variables

Can be used as inputs or intermediate vals, can be searched. Variables are the mutable state/context of the `WfRun`. Everything is nullable like a `String` in java. Prefer `Struct` over `JSON_OBJ`.

DO NOT put large payloads (>20kb) in a variable.

```java
WfRunVariable myInt = wf.declareInt("some-int").searchable(); // has an index
WfRunVariable myStr = wf.declareStr("some-str").asPublic(); // shows up in output topic, can be seen by child WfRuns
WfRunVariable myDouble = wf.declareDouble("some-double").required(); // required as input
WfRunVariable myBool = wf.declareBool("some-bool").withDefault(false);
WfRunVariable myBytesStr = wf.declareBytes("byte-string");
WfRunVariable someStruct = wf.declareStruct("some-obj", Car.class); // See Structs skill for more info

myInt.assign(5); // myInt = 5
myInt.assign(myInt.add(5)); // myInt += 5. also divide(), multiply(), subtract()
myStr.assign(myStr.add("fdsa"));
```

### Structs

```java
import io.littlehorse.sdk.worker.LHStructDef;

@LHStructDef("car")
public class Car {
  private String make;
  private int year;

  @LHStructField(isNullable = true)
  private String model;

  @LHStructField(masked = true, isNullable = true)
  private Address homeAddress;


  public Car(String make, String model, int year) {
    this.make = make;
    this.model = model;
    this.year = year;
  }

  public Car() {}

  // Add getters and setters for struct fields and they'll be automaticallly added to the StructDef
}
```


## Task Execution

```java
// Execute a task
NodeOutput taskOutput = wf.execute("foo", myInt.add(5), "asdf"); // foo(myInt + 5, "asdf") // doesn't modify myInt.

wf.execute("another-task", taskOutput); // pass output from one task to other
wf.execute("slow-task").timeout(300).withRetries(3); // allow 5 min each attempt, 3 retries

wf.execute(wf.format("email-{0}", someVar), "asdf"); // use dynamic taskdef name based on variables
```

## Conditionals

```java
wf.doIf(myBool, handler -> {
    handler.execute("some-task");
}).doElseIf(myInt.isLessThan(5).or(myStr.isIn(myList)), handller -> {
    handler.execute("another-task");
}).doElse(handler -> {
    handler.execute("last-case");
})
```

## External Events

Wait for an `ExternalEvent` sent to the specific `WfRun`:

```java
ExternalEventNodeOutput eventContent = wf.waitForEvent("some-event")
        .registeredAs(String.class) // create ExternalEventDef with relevant type, including Struct annotated classes
        .timeout(60);

someVar.assign(eventContent); // use content of event
```

Wait for a `CorrelatedEvent` with a correlationKey:

```java
import io.littlehorse.sdk.common.proto.CorrelatedEventConfig;

WfRunVariable documentId = ...;

wf.waitForEvent("document-signed")
    .registeredAs(Foo.class) // some struct
    .withCorrelationId(documentId)
    .withCorrelatedEventConfig(CorrelatedEventConfig.newBuilder()
        .setDeleteAfterFirstCorrelation(true) // CorrelatedEvent can only go to one WfRun if this is true
        .setTtlSeconds(3600) // How long to keep correlatedEvent if no wfrun correlates to it
        .build());
```

## Gotchas

- `WfRunVariable` is a symbolic handle, not a runtime Java object.
- Child threads can access parent variables; parents cannot access child-only variables.
- The stuff in `wfLogic` or `define` is only run once to compile the WfSpec, producing a directed graph that is traversed for each WfRun. The function ONLY RUNS ONCE and is not used after the compilation.
