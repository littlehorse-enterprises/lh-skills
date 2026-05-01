---
name: python-wfspec-threads
description: Use when building LittleHorse Python workflows that need child threads or child workflows, including parallel fan-out/fan-in, wait strategies, variable scope, and child failure handling.
---
# Python `WfSpec` Threads

Use as a reference when handling concurrency and composition in Python WfSpec's.

## Thread Model

- Every `WfSpec` has an entrypoint thread.
- Parent threads can spawn child threads.
- Parent behavior depends on the wait strategy.
- Child threads can read and write parent variables.
- Parent cannot access child-only variables.

## Spawn Child Thread

```python
from littlehorse.workflow import WorkflowThread


def entry(wf: WorkflowThread) -> None:
    user_id = wf.declare_str("user_id").required()

    def fraud_checks(thread: WorkflowThread) -> None:
        thread.execute("run-fraud-checks", user_id)

    child = wf.spawn_thread(fraud_checks, "fraud-checks", {})

    wf.execute("reserve-inventory", user_id)
    wf.wait_for_threads(child)
    wf.execute("create-shipment", user_id)
```

## Fan-Out / Fan-In

```python
def entry(wf: WorkflowThread) -> None:
    order_id = wf.declare_str("order_id").required()

    payment = wf.spawn_thread(lambda t: t.execute("capture-payment", order_id), "payment", {})
    inventory = wf.spawn_thread(lambda t: t.execute("reserve-inventory", order_id), "inventory", {})
    notify = wf.spawn_thread(lambda t: t.execute("send-order-email", order_id), "notify", {})

    wf.wait_for_threads(payment, inventory, notify)
    wf.execute("mark-order-ready", order_id)
```

## Child Workflow Pattern

```python
def entry(wf: WorkflowThread) -> None:
    account_id = wf.declare_str("account_id").required()

    child = wf.run_wf(
        "provision-account",
        {"account_id": account_id},
    )

    child_result = wf.wait_for_child_wf(child)
    wf.execute("store-provisioning-result", child_result)
```

Use child workflows for reusable process boundaries across WfSpecs.

## Failure Propagation

- Technical failures from children propagate to parent waits as child failures.
- Business exceptions propagate as business exceptions.
- Place handlers where recovery has the data it needs.

## Wait Strategies

- `wait_for_threads(...)`: wait for all children.
- `wait_for_any_of(...)`: continue when any child completes.
- `wait_for_first_of(...)`: first completion/failure wins; remaining children are halted.

Choose strategy based on correctness first, then throughput.

## Gotchas

- Child run inspection may require composite IDs (`parent_child`) when using CLI debugging.
- Avoid putting large payloads into shared variables between parallel branches.
- Keep side effects idempotent when parallel work can retry.

## Debugging Threads

For operational debugging commands and run inspection workflow, use `debug-with-lhctl`.
