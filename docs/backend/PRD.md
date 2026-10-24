# Hire Flow — Backend Product Requirements Document

## 1. Purpose

Hire Flow is an AI-assisted technical hiring platform for conducting developer interviews with live coding, code execution, collaboration, and interviewer assistance.

This document defines backend requirements and is the source of truth for the backend MVP. It does not define frontend visual design.

## 2. Problem and Value Proposition

Technical interviews involve coordinating participants, sharing coding tasks, running candidate code, reviewing results, and recording structured feedback. Hire Flow aims to provide a reliable backend for these workflows while isolating untrusted candidate code.

**Value proposition:** Provide interviewers with a consistent, observable technical interview workflow and secure code evaluation, while keeping hiring decisions under human control.

## 3. Target Users and Roles

### Interviewer
- Create and manage interviews.
- Select a coding question and allowed language.
- Invite a candidate.
- View submissions and execution results.
- Record interview notes and rubric-based feedback.
- Review AI-generated suggestions.

### Candidate
- Join an interview using a valid invitation.
- View the assigned question.
- Submit code.
- View permitted execution feedback and submission history.

### Administrator
- Manage platform-level configuration and operational access.
- Review security and audit events when authorized.

### System Components
- API: validates requests and enforces application permissions.
- Queue and worker system: schedules and processes execution jobs.
- Execution sandbox: runs candidate code under restrictive limits.
- AI provider integration: produces interviewer assistance, not autonomous hiring decisions.

## 4. MVP Scope

### In Scope
1. Health endpoint and configuration validation.
2. Interview creation and retrieval.
3. Question metadata and allowed language selection.
4. Candidate invitation and interview access checks.
5. Submission creation with immutable source snapshots.
6. Asynchronous submission lifecycle and status retrieval.
7. One supported execution language for the first end-to-end implementation.
8. Public and hidden test evaluation, with hidden tests protected from candidate access.
9. Execution time, CPU/memory limits, output limits, and cancellation.
10. Submission history and structured execution outcomes.
11. Interviewer notes and a basic evaluation rubric.
12. Audit events for important security-sensitive actions.
13. AI-generated follow-up suggestions and code explanations, reviewed by a human.
14. Automated tests for authorization, execution lifecycle, and critical failures.

### Out of Scope for the Initial MVP
- Autonomous candidate ranking or hiring decisions.
- Multiple programming languages at launch.
- Kubernetes and multi-region deployment before a measured need.
- Complex microservice decomposition.
- Production use of a basic Docker container as the sole security boundary for hostile public code.
- Unreviewed AI-generated evaluations being shown as final hiring outcomes.

## 5. Core User Journeys

### Interview Creation
1. Interviewer authenticates.
2. Interviewer creates an interview and selects a question.
3. Backend validates the request and stores the interview.
4. Backend creates a candidate invitation with an expiry and restricted scope.
5. Interviewer receives the invitation details.

### Candidate Joins
1. Candidate presents a valid invitation.
2. Backend validates expiry, revocation, interview status, and allowed access.
3. Backend issues or establishes limited interview access.
4. Candidate can access only the interview resources permitted by their role.

### Code Submission
1. Candidate submits source code and a client-generated idempotency key.
2. Backend validates the request, checks permissions and limits, and stores an immutable submission snapshot.
3. Backend schedules an execution job.
4. Candidate and interviewer can retrieve the current status.
5. The trusted execution controller starts an isolated execution environment.
6. The sandbox receives only the code, runtime inputs, and harness material needed to execute.
7. The trusted evaluator compares results with protected expected outputs.
8. Backend stores a sanitized result and publishes a status update.
9. The submission is marked with a terminal outcome.

### Interviewer Review
1. Interviewer opens submission history.
2. Backend checks interviewer access to the interview.
3. Interviewer reviews execution outcomes, notes, and rubric criteria.
4. AI suggestions may be requested.
5. The interviewer reviews, edits, accepts, or rejects suggestions.
6. The human-authored evaluation remains distinguishable from AI output.

## 6. Functional Requirements

- FR-01: Expose a health endpoint that reports application health without disclosing secrets.
- FR-02: Authenticate users and enforce authorization on every protected resource.
- FR-03: Allow authorized interviewers to create, read, update, and close interviews.
- FR-04: Ensure candidates can access only interviews associated with their valid invitation.
- FR-05: Store questions and test suites so hidden test data is never exposed through candidate-facing APIs.
- FR-06: Create immutable submission records.
- FR-07: Prevent duplicate logical submissions when a request is safely retried with the same idempotency key.
- FR-08: Process execution asynchronously and expose status transitions.
- FR-09: Enforce execution, memory, CPU, process, and output limits in the execution environment.
- FR-10: Terminate timed-out or cancelled executions and record the outcome.
- FR-11: Return sanitized compile/runtime/test outcomes without exposing hidden expected values.
- FR-12: Store submission history and execution-attempt metadata.
- FR-13: Support interviewer notes and a structured rubric.
- FR-14: Provide AI-generated suggestions only as assistance, with human review.
- FR-15: Record security-relevant audit events.
- FR-16: Use consistent validation and error response formats.
- FR-17: Apply request and execution queue limits to reduce abuse.
- FR-18: Provide logs and metrics sufficient to diagnose submission failures.

## 7. Non-Functional Requirements

### Security
- Candidate code is untrusted input.
- Candidate code must not execute inside the API process.
- Execution must not have access to production credentials, the Docker socket, or unrestricted host files.
- Hidden tests and expected outputs must remain outside candidate-controlled execution.
- Authentication, authorization, validation, rate limiting, and secret management are server-enforced.
- Logs must not contain passwords, tokens, or unnecessary sensitive candidate data.

### Reliability
- Submission state must be persisted before acknowledging successful acceptance.
- Queue processing must tolerate duplicate delivery.
- Failed jobs must have explicit terminal outcomes and diagnostic metadata.
- Retries must be bounded and used only when safe.
- Application startup should fail clearly when required configuration is invalid.

### Performance
- Define and measure API latency, queue wait time, execution time, and live-update latency.
- The proposed target of under 250 ms for collaboration updates is a benchmark target, not a guarantee.
- The proposed load of 1,000 queued submissions must be validated with a documented load test and workload profile.

### Maintainability
- Use TypeScript and modular backend boundaries.
- Keep business logic separate from HTTP handlers and execution orchestration.
- Include tests and update documentation with behavior changes.

## 8. Data Requirements

Initial domain records:
- User
- Interview
- Question
- TestSuite
- Submission
- ExecutionAttempt
- Evaluation
- InterviewEvent/AuditEvent
- OutboxEvent, if needed for reliable event publication

Sensitive records include invitation credentials, source code, hidden tests, expected outputs, and evaluation notes. Access must be restricted by role and interview ownership.

## 9. Integrations

- MongoDB: application persistence.
- Redis and BullMQ: asynchronous execution job coordination.
- Isolated execution runtime: runs untrusted candidate code.
- WebSocket transport: interview collaboration and status updates.
- LLM provider: interviewer assistance, with server-side credentials.
- Object storage such as S3: optional later for larger artifacts; not required for the first backend milestone.

## 10. Loading, Empty, and Error Conditions

Backend-relevant states include:
- Interview not found.
- Invitation invalid, expired, or revoked.
- Submission queued, running, completed, failed, timed out, or cancelled.
- Queue unavailable.
- Database unavailable.
- Execution worker unavailable.
- Invalid or unsupported language.
- Request exceeds size or rate limits.
- AI provider timeout, rate limit, or invalid response.
- Authorization denied.

Errors must be stable, sanitized, and actionable without exposing internals.

## 11. Success Criteria

The MVP is successful when:
- An authorized interviewer can create an interview and question assignment.
- A candidate can join only with valid access.
- A code submission is persisted and processed asynchronously.
- A correct solution passes the configured tests and an incorrect solution fails.
- Infinite loops and excessive output are terminated or bounded.
- Hidden test definitions and expected outputs are not returned to candidates.
- Duplicate requests do not create duplicate logical submissions.
- Interviewers can inspect results and record a human-reviewed evaluation.
- AI suggestions cannot autonomously make the hiring decision.
- Automated tests cover critical authorization, execution, and failure paths.

## 12. Assumptions and Decisions Requiring Approval

Assumptions for the initial design:
- Node.js with TypeScript and Express for the API.
- MongoDB for persistence.
- Redis and BullMQ for asynchronous jobs.
- One language for the first execution vertical slice.
- The API and untrusted execution process are separate security boundaries.

Approval required before production exposure:
- Exact sandbox runtime and hosting model.
- Supported language/runtime version.
- Authentication provider and invitation-token design.
- Data retention policy for code, notes, and evaluations.
- AI provider, data-sharing terms, and retention settings.
- Production workload and service-level objectives.
