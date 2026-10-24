# Hire Flow — Backend Implementation Plan

## Planning Rules

- Build foundations before dependent features.
- Keep each task small enough to test independently.
- Follow `PRD.md`, `ARCHITECTURE.md`, `SANDBOX_SECURITY.md`, `DATABASE.md`, `API.md`, and `AGENTS.md`.
- Do not add technologies or features without a requirement.
- A feature is complete only when its behavior is tested.

## Phase 0 — Repository Foundation

### Goal
Create a reproducible TypeScript backend project.

### Tasks
- Confirm Node.js LTS, npm, Git, and editor are installed.
- Create repository and backend folder structure.
- Initialize API package and TypeScript.
- Add `.gitignore`, `.env.example`, README, formatting/linting/type-check scripts as selected.
- Add configuration validation and a basic health endpoint.
- Establish the first Git commit.

### Tests
- Type check.
- Build.
- Health endpoint smoke test.
- Verify secret files are ignored.

### Completion Criteria
API starts locally, health endpoint responds, build/type-check pass, and no secrets are committed.

## Phase 1 — Backend Documentation Approval

### Goal
Approve product scope and backend boundaries before feature implementation.

### Tasks
- Review PRD and MVP exclusions.
- Resolve architecture decisions.
- Review sandbox threat model.
- Review data model and API contract.
- Finalize coding-agent rules.

### Completion Criteria
No unresolved blocking decisions remain for the first backend vertical slice.

## Phase 2 — Configuration, Health, and Error Handling

### Goal
Create a stable API foundation.

### Tasks
- Configure Express.
- Add request ID/correlation ID.
- Add central error middleware.
- Add request validation pattern.
- Add liveness and readiness endpoints.
- Add structured logging with redaction.

### Tests
- Health success.
- Invalid configuration fails clearly.
- Unknown route returns stable error.
- Unexpected errors do not leak stack traces to clients.

## Phase 3 — Persistence and Interview Management

### Goal
Create and retrieve interviews.

### Tasks
- Configure MongoDB connection.
- Implement user/interview/question data access as approved.
- Implement validation and ownership checks.
- Add indexes justified by queries.
- Add development seed data only if approved.

### Tests
- Create/read/update interview.
- Invalid input rejection.
- Cross-owner access denied.
- Database unavailable behavior.
- Index/query-plan review.

## Phase 4 — Authentication and Invitations

### Goal
Restrict access to authorized interview participants.

### Tasks
- Implement approved authentication/session design.
- Implement role and resource checks.
- Create expiring/revocable invitations.
- Protect candidate sessions and interviewer-only data.
- Add audit events for sensitive operations.

### Tests
- Valid and invalid login/session cases as applicable.
- Expired/revoked invitation rejected.
- Candidate cannot access another interview.
- Interviewer cannot access another owner's private resources without permission.

## Phase 5 — Submission Records and Queue

### Goal
Accept code submissions without executing them in the API process.

### Tasks
- Implement immutable submission records.
- Implement idempotency-key handling.
- Add Redis/BullMQ after queue configuration is documented.
- Add a mock executor to validate the job lifecycle before real code execution.
- Implement queued/running/terminal status transitions.
- Add bounded retries and failure records.

### Tests
- Duplicate request behavior.
- Duplicate job delivery.
- Queue unavailable.
- Worker failure and retry.
- Valid state transitions.

## Phase 6 — Isolated Execution MVP

### Goal
Run one supported language under the approved isolation design.

### Tasks
- Select and review the execution runtime.
- Implement trusted controller and sandbox lifecycle.
- Add bounded test harness input/output.
- Protect hidden tests and expected outputs.
- Enforce CPU, memory, process, time, filesystem, network, and output policies.
- Implement cancellation and cleanup.
- Store sanitized execution results.

### Tests
- Correct/incorrect solution.
- Syntax/runtime failure.
- Infinite loop timeout.
- Excessive output/memory/processes.
- Network/filesystem restrictions.
- Hidden-test secrecy.
- Cleanup after controller crash or cancellation.

### Production Gate
Do not expose untrusted public execution until the sandbox security gate is passed.

## Phase 7 — Submission History and Evaluation

### Goal
Allow interviewers to inspect execution evidence and record human-reviewed evaluations.

### Tasks
- Add paginated submission history.
- Add evaluation rubric records.
- Separate AI suggestions from human-authored notes.
- Apply reviewer authorization.

### Tests
- Correct access scope.
- Pagination and ordering.
- Evaluation write permissions.
- AI/human provenance preserved.

## Phase 8 — Realtime Collaboration

### Goal
Deliver authorized interview-room events.

### Tasks
- Select WebSocket event schema and collaboration strategy.
- Authenticate connections and authorize room membership.
- Add presence and submission status updates.
- Add reconnect and stale-session handling.
- Add payload and event-rate limits.

### Tests
- Authorized room join.
- Cross-room isolation.
- Malformed/oversized messages.
- Reconnect behavior.
- Multiple clients receiving expected updates.

## Phase 9 — AI Interviewer Assistance

### Goal
Offer structured, human-reviewed suggestions.

### Tasks
- Add server-side provider adapter.
- Define structured response schema.
- Add timeouts, rate limits, and bounded retry policy.
- Treat candidate code and notes as untrusted prompt content.
- Label AI output and preserve human review.

### Tests
- Valid provider response.
- Timeout/rate-limit behavior.
- Malformed response validation.
- Prompt-injection-oriented tests.
- No autonomous hiring decision.

## Phase 10 — Observability and Load Testing

### Goal
Measure system behavior under realistic conditions.

### Tasks
- Add queue-depth and queue-wait metrics.
- Add execution duration/resource metrics.
- Trace request-to-result flow.
- Define workload profile and acceptance thresholds.
- Load-test API, queue, execution workers, and realtime separately.

### Tests
- Documented load test.
- Worker saturation and recovery.
- Queue backlog behavior.
- Latency percentiles and error rate.
- Resource cleanup.

## Phase 11 — Deployment and Production Readiness

### Goal
Prepare a controlled deployment.

### Tasks
- Build reproducible images and CI checks.
- Configure secrets and production environment.
- Set up HTTPS and allowed origins.
- Configure backup and restore.
- Add alerts and operational runbooks.
- Perform security and production readiness reviews.

### Completion Criteria
Production launch is approved only after critical security, recovery, and performance criteria are verified.

## Recommended First Task

Complete Phase 0: verify the development environment, initialize the backend package, create the health endpoint, and make the build/type-check pass before implementing interview features.
