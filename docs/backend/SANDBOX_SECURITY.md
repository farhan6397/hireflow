# Hire Flow — Sandbox Security Design

## 1. Purpose

This document defines security requirements for running candidate-submitted code. Candidate code must be treated as hostile, even when the candidate is legitimate.

This document is a design baseline, not proof that the implementation is secure. Production use requires review and adversarial testing.

## 2. Threat Model

Assume candidate code may attempt to:
- Run forever or consume excessive CPU.
- Allocate excessive memory.
- Spawn many processes or threads.
- Produce unlimited output.
- Read files outside its permitted workspace.
- Access environment variables or credentials.
- Access the Docker socket or host control interfaces.
- Reach internal services or the public internet.
- Exploit the runtime, kernel, sandbox, or test harness.
- Interfere with another candidate's execution.
- Infer hidden tests or expected outputs.

Also consider malicious or compromised dependencies and malformed execution requests.

## 3. Trust Boundaries

Trusted components:
- API and authorization layer.
- Database records and hidden test storage.
- Queue/controller credentials.
- Test-result comparison logic.
- Operational control plane.

Untrusted component:
- Candidate source code and any process it creates.

Candidate code must not execute inside the API process or trusted execution controller.

## 4. Required Isolation Controls

Before public untrusted execution is enabled, select and validate an appropriate isolation technology and host configuration.

Required controls include:
- Separate execution environment per job or tightly isolated job unit.
- Non-root execution where supported.
- Read-only base filesystem where feasible and a bounded temporary workspace.
- No host filesystem mounts beyond explicitly approved, minimal paths.
- No Docker socket or container-runtime control socket inside the sandbox.
- No production secrets or reusable credentials in the sandbox.
- Network disabled by default; explicitly allow only required destinations if any.
- CPU quota and execution deadline.
- Memory limit.
- Process/PID limit.
- File-size, disk, and output limits.
- Restricted Linux capabilities and syscall policy where applicable.
- Sandbox cleanup after success, failure, timeout, or cancellation.
- Host patching, runtime updates, and monitoring.
- Isolation tests and documented residual risk.

A default Docker container is not, by itself, a sufficient security claim for hostile public code. Evaluate a hardened runtime such as gVisor or a microVM approach such as Firecracker for the production threat model.

## 5. Hidden Test Protection

- Hidden test definitions and expected outputs remain in trusted storage.
- Candidate APIs never return hidden test contents or expected values.
- The sandbox receives only the inputs and harness artifacts needed for the run.
- Result reporting returns aggregate pass/fail counts and sanitized failure details.
- Do not place hidden expected outputs in candidate-readable files, environment variables, command arguments, or logs accessible to candidate code.
- Review whether test feedback leaks enough information to reconstruct hidden tests.

## 6. Execution Lifecycle

1. Validate request and authorization.
2. Persist immutable submission.
3. Enqueue execution job.
4. Trusted controller claims the job.
5. Load the approved language/runtime and test-suite version.
6. Create the isolated execution environment.
7. Apply policy and resource limits before starting candidate code.
8. Run with bounded input and output.
9. Stop on completion, timeout, cancellation, or resource violation.
10. Evaluate output in a trusted component.
11. Persist sanitized outcome and resource metadata.
12. Destroy the sandbox and temporary artifacts.
13. Publish the terminal status.

Every terminal path must perform cleanup.

## 7. Results and Logging

Record:
- Submission and execution-attempt IDs.
- Runtime image/version.
- Start/end times and duration.
- Exit reason.
- Resource usage when available.
- Bounded, sanitized stdout/stderr or a reference to approved stored output.
- Test counts and sanitized failure information.

Never log secrets, unrestricted source artifacts, or hidden expected outputs. Set retention limits for source code and output artifacts.

## 8. Required Security Tests

- Infinite loop is terminated within the configured deadline.
- Excessive memory allocation is contained and reported.
- Excessive output is truncated or terminates the job.
- Process-spawning abuse is bounded.
- Sandbox cannot access host secrets or unauthorized files.
- Sandbox cannot reach internal metadata services or protected networks.
- Sandbox cannot access the container-runtime control socket.
- One job cannot read or alter another job's files.
- Hidden test definitions and expected outputs are absent from candidate responses and candidate-readable paths.
- Cancellation destroys the execution environment.
- Worker crash does not leave uncontrolled candidate processes running.
- Malformed job payloads are rejected.

These tests must run in a controlled environment. Do not test escape attempts against systems you do not own or have permission to assess.

## 9. Production Gate

Do not expose public untrusted code execution until:
- Isolation technology and host policy are reviewed.
- Resource limits are verified under load.
- Network and filesystem restrictions are tested.
- Hidden-test confidentiality has been reviewed.
- Cleanup and worker-crash behavior are tested.
- Logging and retention are configured.
- Remaining risks have an explicit owner and acceptance decision.
