---
name: littlehorse-mental-model
description: Mental model for how LittleHorse works. Workflow & Application Design Best Practices.
---
# LittleHorse Mental Model

LittleHorse is a workflow engine which lets you write business flows in Java, Python, Go, or C# DSL's.

1. You write Task Workers, which are normal Java/Go/Python/C# functions with special decorators. The Task Workers poll the LH Server on a task queue, execute tasks, and report the results. Task Workers have logic to connect to other systems to take action.
2. You write a `WfSpec` (workflow specification) which includes `TaskNode`s (steps to execute tasks), and may include waiting for external events, conditionals, threads, failure handling, etc.
3. The `WfSpec` is registered (normally, in the application startup time) as metadata inside the LH Server
4. Some client (normally, a backend app like Spring Boot or Django or Quarkus, or a Kafka Connector) tells LittleHorse to run the `WfSpec`, creating a `WfRun`
5. The `WfRun` results in `TaskRun`s being scheduled to Task Workers which execute `TaskRun`s and report back to the LH Server.

LittleHorse exposes a GRPC API from the proto files here: https://github.com/littlehorse-enterprises/littlehorse/blob/master/schemas/littlehorse/service.proto

## Important Terms

Terms `InCode` are objects in our grpc API or protobuf

* `TaskDef`: defines a unit of work
* `TaskRun`: running instance of a `TaskDef`
* Task Worker: polls the LH Server on a task queue, executes `TaskRun`s. Connects to your external systems (db, SaaS API, etc). Often embedded in a microservice.
* `WfSpec`: workflow specification (like a "program" in LH)
* `WfRun`: running instance of a `WfSpec` (like a "process" in LH)
* `ThreadSpec`: specification for a Thread. Every `WfSpec` has a special "entrypoint" `ThreadSpec` which runs when the WfRun starts
* `Node`: a step in a `ThreadSpec`. A `Node` has outgoing edges (with optional conditions) determining where the `WfRun` goes next
* `NodeRun`: a running instance of a `Node`. Contains pointers to sub-nodes, such as `TaskNodeRun`, `ExternalEventNodeRun`, etc.
* `ThreadRun`: running instance of a `ThreadSpec`. Each `WfRun` has an "entrypoint" `ThreadRun` which defines the lifecycle of the `WfRun`
* `ExternalEvent`: a record in the LH API signifying that something happened. An `ExternalEvent` contains a specific `WfRunId`. A `ThreadRun` can wait for an `ExternalEvent` before continuing. An `ExternalEvent` can also interrupt a `WfRun`
* `CorrelatedEvent`: an record in the LH API that is not yet associated with a specific WfRun but can be matched to one or more `WfRun`s (creating an `ExternalEvent`) by a correlation key.
* `Variable`: an instance of a variable, belonging to a `WfRun`. Inspecting it in the API is useful for debugging.

## Best Practices

### Workflow Granularity

* A `WfSpec` should mirror business processes as much as possible.
* If you find yourself chaining too many workflows together with task workers calling other workflows, your workflows are probably too small.
* Tasks should be API's that are reusable.

### Idempotency

* LH allows only one `WfRun` with a specific ID to exist, throws `ALREADY_EXISTS` if conflict. Use this for idempotency with `rpc RunWf`.
* Add a `WorkerContext ctx` param at the end of your task signature and use `ctx.getIdempotencyKey()` to make `TaskRun`s idempotent.
* When designing a REST service that needs to be idempotent, it's best if the WfRunId can be deterministically generated from the request body. Eg `create-user-{email}`

### Configurations

The `LHConfig` by default reads configurations from environment variables, which is best practice. You can also pass in a config file location or a set of properties, which all accept the same `LHC_*` configs. Generally your app should create one `LHConfig` and share it everywhere.

### Running Workflows

Terminology: you run a `WfSpec` and create a `WfRun`.

You generally will run a `WfSpec` in two main ways:
* Our Sink Connectors for Kafka Connect (https://littlehorse.io/docs/integrations/kafka-connectors)
* A REST handler which calls `rpc RunWf` with a grpc stub.

### When LH is a Good Fit

* You need to take multiple actions in multiple systems reliably (alternative to transactional outbox)
* You need to implement the Saga Transaction Pattern
* Multi-step process involving waiting for callbacks or external events
* Anytime you need to react to an anomaly in an event stream

### Scaling

* Scale by running many WfRun's in parallel. One WfRun for an event. Avoid using a single WfRun to model a large batch.
* Instead of passing large variable payloads through a WfRun, use the claimcheck pattern and pass around an id that points to the data (eg. in S3 or postgres).

### Deploying Workers & Workflows

* Register StructDefs then ExternalEventDefs then UserTaskDefs then TaskDefs then WfSpecs when starting up an app. Then start the Task Workers. Once that succeeds you can start the REST server.
* If the LH mmetadata startup fails, your service will flap, causing an alert which lets you avoid silent failures.
