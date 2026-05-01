---
name: python-wfspec-basics
description: Use when building LittleHorse workflows and task workers in Python, including async worker lifecycle, variables, retries/timeouts, external events, conditionals, idempotent RunWf usage, and task error handling.
---
# Python `WfSpec` Basics

Use as a reference when building LittleHorse WfSpec's and task workers in Python.

## Boilerplate

Relevant imports:

```python
import asyncio
import signal
from typing import Any

import littlehorse
from littlehorse.config import LHConfig
from littlehorse.worker import LHTaskWorker, WorkerContext
from littlehorse.workflow import Workflow, WorkflowThread
from littlehorse.common.proto.common_wfspec_pb2 import RetryPolicy
from littlehorse.common.proto.service_pb2 import RunWfRequest
from littlehorse.exceptions import LHTaskException
```

## Client Management

Create one `LHConfig` and one stub per process. Reuse them.

```python
_lh_config = LHConfig()
_lh_stub = _lh_config.stub()


def get_lh_stub():
    return _lh_stub
```

Avoid creating new `LHConfig()` instances in loops, request handlers, or task bodies.

## Async Task Worker

Prefer `asyncio` workers and graceful shutdown:

```python
import asyncio
import signal
from typing import Any

from littlehorse.config import LHConfig
from littlehorse.worker import LHTaskWorker, WorkerContext


async def enrich_record(record_id: str, ctx: WorkerContext) -> dict[str, Any]:
    return {"record_id": record_id, "wf_run_id": ctx.wf_run_id, "status": "ok"}


async def main() -> None:
    cfg = LHConfig()
    worker = LHTaskWorker(enrich_record, "enrich-record", cfg)

    stop = asyncio.Event()
    loop = asyncio.get_running_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, stop.set)

    await worker.start()
    await stop.wait()
    await worker.close()


if __name__ == "__main__":
    asyncio.run(main())
```

## Variables

Variables are workflow state for each `WfRun`.

```python
def entry(wf: WorkflowThread) -> None:
    user_id = wf.declare_str("user_id").required().searchable()
    amount = wf.declare_double("amount").required()
    approved = wf.declare_bool("approved").with_default(False)

    approved.assign(amount.is_less_than_eq(1000.0))
```

Use searchable variables for values you need to query.

## Task Execution, Retries, and Timeouts

```python
RETRY = RetryPolicy(
    max_retries=3,
    backoff_multiplier=2.0,
    initial_millis=500,
)


def entry(wf: WorkflowThread) -> None:
    user_id = wf.declare_str("user_id").required()
    amount = wf.declare_double("amount").required()

    wf.execute(
        "charge-card",
        user_id,
        amount,
        options={
            "timeout_millis": 30_000,
            "retry_policy": RETRY,
        },
    )
```

## Conditionals

```python
def entry(wf: WorkflowThread) -> None:
    payment_result = wf.execute("charge-card")

    wf.do_if(
        payment_result.with_json_path("$.success").is_equal_to(True),
        lambda t: t.execute("ship-order"),
        lambda t: t.fail("payment-failed", "Charge card returned unsuccessful result."),
    )
```

Use `do_if(condition, if_body, else_body=None)`. For one-statement branches, lambdas are fine.

## External Events

```python
def entry(wf: WorkflowThread) -> None:
    wf.wait_for_event("approval-received")
    approval_payload = wf.last_external_event().content()
    wf.execute("apply-approval", approval_payload)
```

Use external events when the workflow must pause for an external callback.

## Idempotent `RunWf`

```python
cfg = LHConfig()
stub = cfg.stub()

request = RunWfRequest(
    wf_spec_name="order-fulfillment",
    id="order-12345",
    variables={
        "user_id": littlehorse.to_variable_value("alice"),
        "amount": littlehorse.to_variable_value(99.95),
    },
)

stub.RunWf(request)
```

Set `RunWfRequest.id` to a deterministic business key to avoid duplicate runs on retries.

## Task Error Handling

Use uncaught exceptions for retryable technical failures and `LHTaskException` for business failures.

```python
async def check_inventory(item_id: str, ctx: WorkerContext) -> dict[str, Any]:
    try:
        available = await fetch_inventory(item_id)
        if not available:
            raise LHTaskException("out-of-stock", f"No inventory available for item_id={item_id}")
        return {"available": True}
    except TimeoutError:
        raise
```

Include actionable details in exception messages.

## Gotchas

- `Workflow` generation code compiles a graph. It is not per-run imperative logic.
- `LHConfig` should be shared; avoid creating one per request or loop iteration.
- Task outputs should be serializable values.
- Use `RunWfRequest.id` for idempotent workflow starts.
- Use `LHTaskException` for business failures and plain exceptions for retryable technical failures.

## Troubleshooting

For runtime incident analysis and `WfRun`/`NodeRun`/`TaskRun` inspection, use `debug-with-lhctl`.
