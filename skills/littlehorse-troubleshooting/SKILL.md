---
name: littlehorse-troubleshooting
description: Generic LittleHorse troubleshooting workflow using scenario docs and lhctl-based server inspection.
---
# LittleHorse Troubleshooting

Use this skill when diagnosing LittleHorse issues across workflow registration, runtime execution, task workers, and CLI/client interactions.

## Primary Inputs

Use two complementary sources of truth:

1. Scenario documents in `skills/littlehorse-troubleshooting/docs/`.
2. Live system state queried from the LittleHorse server via `lhctl`.

Treat scenario docs as structured diagnostic guidance, and use `lhctl` to validate current reality on the server.

## How to Interpret Troubleshooting Scenario Files

Scenario files in `skills/littlehorse-troubleshooting/docs/` follow a retrieval-friendly structure so an LLM can map user-reported failures to a known issue pattern.

Read each section as follows:

* `Error: [Short, Descriptive Title]`: Human-friendly identifier for the failure mode.
* `Category`: The failure phase, such as compile-time, run-time, registration, or configuration.
* `Component`: The primary system area impacted, such as workflow spec, task worker, or client CLI.
* `The Error`: Exact raw output from stack traces or CLI messages. Prioritize semantic matching against user-provided error text.
* `Error Pattern` (optional): Normalized form of the error for fuzzy matching across similar failures.
* `Faulty Code / Trigger`: Minimal reproducer that caused the issue.
* `Root Cause`: Precise rule or contract that was violated.
* `The Fix`: Ordered remediation steps.
* `Corrected Code / Action`: Expected corrected state after remediation.

When diagnosing:

* Start matching from `The Error`, then refine with `Category` and `Component`.
* Use `Root Cause` and `The Fix` as the authoritative explanation and remediation path.
* Use `Faulty Code / Trigger` and `Corrected Code / Action` to verify the change required.

## `lhctl` Basics for Troubleshooting

Assume `lhctl` is available and should be used as a primary debugging tool for querying the LittleHorse server.

Core ideas:

* `lhctl` is the operational CLI for reading LittleHorse state.
* It is useful for confirming whether a suspected issue is present in live metadata or runtime objects.
* It allows you to inspect object status, relationships, and identifiers needed to trace failures.
* CLI output should be compared against scenario docs to confirm or reject a diagnosis.

Use `lhctl` during troubleshooting to:

* Locate relevant workflow and task execution objects.
* Inspect status and error fields on server-side records.
* Drill down from high-level workflow failures to lower-level execution details.
* Validate that remediation changed system behavior as expected.

## Troubleshooting Workflow

1. Capture the user's exact error text and context.
2. Find the closest matching scenario doc by error semantics.
3. Confirm phase/component alignment via `Category` and `Component`.
4. Query live state with `lhctl` to validate the scenario fit.
5. Apply remediation from `The Fix`.
6. Re-query with `lhctl` to verify successful resolution.

If no scenario matches, document the new failure pattern using the same template structure so it is reusable for future retrieval.
