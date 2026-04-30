---
name: debug-with-lhctl
description: Use the LittleHorse CLI (lhctl) to find, inspect, or debug workflow runs.
---
# `lhctl` LittleHorse CLI

`lhctl` follows similar patterns to kubectl: `lhctl <verb> <noun> <positional args...>`.

You can use `--configFile` to specify the `LHC_` configurations if the user hasn't set default options.

The output of all `lhctl` commands is just the GRPC call response but in JSON format. If you absolutely need to see the actual grpc code, fetch this: https://github.com/littlehorse-enterprises/littlehorse/blob/master/schemas/littlehorse/service.proto

## Basic Debug Process

Find all failed WfRun's for a `WfSpec` which started within last 5 min:

```
lhctl search wfRun my-workflow-spec --earliestMinutesAgo 5 --status ERROR
```

The WfRun might be stuck `RUNNING`, try that status too, or just simply leave out the `STATUS`. Once you have the ID, get the wfRun:

```
lhctl get wfRun asghasfjdokfjwoei
```

Look at the error message. Note which `ThreadRun` failed, and what `NodeRun` it's on. Assume threadRun `2` node position `3` failed:

```
lhctl get nodeRun asghasfjdokfjwoei 2 3
```

Look at the type of node. If it's a `task` node, do:

```
lhctl get taskRun asghasfjdokfjwoei 2-3
```

It's also useful to inspect variables in the `WfRun`:

```
lhctl list variable asghasfjdokfjwoei
```

Or get a specific variable (eg. get `my-variable` from the thread_run number 2):

```
lhctl get variable asghasfjdokfjwoei 2 my-variable
```

You can list all `TaskRun`s for a `WfRun` as follows:

```
lhctl list taskRun asghasfjdokfjwoei
```

### Common Problems

* If a `TaskRun` is `TASK_SCHEDULED`, there might not be a deployed task worker. Look at `lhctl get taskWorkerGroup <taskDefName>`.
* If an `externalEvent` `NodeRun` is stuck, the `ExternalEvent` may not have been posted. You may need to check the system posting events. If the correlation id is present, check that too.

## Useful Examples

* `lhctl get ...`: returns the object
* `lhctl search ...`: returns a list of ID's which can be passed into `lhctl get`
* `lhctl list <resource> <wfRunId>`: returns all objects of a given resource type associated with a WfRun.
* `lhctl delete <resource> <id>`: deletes a resource

```
lhctl get wfRun ahfoapjasdklj

# Fetch child WfRun as f"{parent-id}_{child-id}"
lhctl get wfRun parent-wfrun-id_child-wfrunid # child wfruns

# Grandchild WfRun
lhctl get wfRun parent-wfrun-id_child-wfrunid_grandchild-wfrunid

# Get nodeRun
lhctl get nodeRun <wfRunId> <threadRunNumber> <nodeRunPosition>

# Get TaskRun. TaskGuid is normally f"{threadRunNumber}-{nodePosition}"
lhctl get taskRun <wfRunId> <taskGuid>

# Get UserTaskRun
lhctl get userTaskRun <wfRunId> <userTaskGuid>

# Get CorrelatedEvent 
lhctl get correlatedEvent <correlationKey> <externalEventDefName>

# Search correlatedEvents
lhctl search correlatedEvent <externalEventDefName>

# get ExternalEvent
lhctl get externalEvent 

# Find recent external events that aren't yet associated to WfRun
lhctl search externalEvent <externalEventDefName> --earliestMinutesAgo 5 --isClaimed false # or true if you want associated with wfrun

# Find recent TaskRun's
lhctl search taskRun <taskDefName> --earliestMinutesAgo 5 --status TASK_SUCCESS # or TASK_ERROR or TASK_RUNNING or TASK_TIMEOUT or TASK_OUTPUT_SERDE_ERROR or TASK_INPUT_VAR_SUB_ERROR

# Find child wfRuns of a parent
lhctl search wfRun byParent <wfRunId>

# Run a WfRun and set my-var to "foo" and other-var to "bar"
lhctl run my-wfspec --majorVersion 5 --revision 3 --wfRunId my-custom-wfrun-id my-var foo other-var bar

# post an external event. Content type is a `VariableType`, STR INT BOOL JSON_OBJ JSON_ARR BYTES STRUCT TIMESTAMP or WFRUN_ID
lhctl postEvent <wfRunId> <externalEventDefName> <contentType> <payload>

# Search workflow schedules which run workflows on a cronjob
lhctl search schedule <wfSpecName> <majorVersion> <revision>
```

Almost all `--flag`s are optional and included here for documentation purposes.
