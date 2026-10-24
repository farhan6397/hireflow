# Hire Flow — Backend Architecture

## 1. Purpose and Principles

This document defines the backend structure for Hire Flow. `PRD.md` defines required behavior; this document defines the proposed implementation boundaries.

Principles:
- Start with the simplest reliable architecture.
- Use a modular monolith for application business logic.
- Keep untrusted code execution outside the API process and its trust boundary.
- Persist a submission before acknowledging acceptance.
- Treat queue delivery as potentially duplicated.
- Keep hidden tests and expected outputs in trusted components.
- Add infrastructure only when a requirement justifies it.

## 2. Proposed Technology Stack

- Node.js 24 LTS
- TypeScript
- Express
- MongoDB with the official Node.js driver or a documented ODM choice
- Redis and BullMQ for asynchronous execution jobs
- WebSockets for real-time interview events
- Docker for local development and controlled sandbox experiments
- A hardened sandbox runtime or microVM approach for production untrusted execution
- A server-side LLM provider adapter for interviewer assistance
- Automated unit, integration, security, and load tests

Exact dependency versions must be selected and locked during project setup. Do not install packages until the corresponding architecture choice is accepted.

## 3. Logical Components

### API Application
Responsibilities:
- Parse and validate HTTP requests.
- Authenticate users and enforce authorization.
- Execute interview and submission business logic.
- Persist records.
- Enqueue execution requests.
- Return sanitized responses.
- Expose health and readiness checks.

The API must never execute candidate source code itself.

### Domain Modules
- `health`
- `auth`
- `interviews`
- `questions`
- `submissions`
- `evaluations`
- `audit`
- `realtime`
- `ai-assistance`

Create modules incrementally as their milestone begins.

### Queue
BullMQ and Redis coordinate asynchronous execution work. Queue messages should contain identifiers and minimal required metadata, not credentials or unnecessary personal data.

### Trusted Execution Controller
Responsibilities:
- Claim an execution job.
- Load the approved submission and test-suite references from trusted storage.
- Prepare an isolated runtime.
- Apply resource and network policies.
- Collect bounded output and exit metadata.
- Ensure the process or sandbox is terminated.
- Submit sanitized results to the application.
- Record execution-attempt metadata.

The controller should run separately from the API and must not give candidate code access to its credentials or control channel.

### Untrusted Execution Sandbox
Runs candidate-controlled code under a strict policy. It must not receive production secrets, unrestricted host filesystem access, Docker control access, or unrestricted network access. The production isolation mechanism requires a separate security review; a default Docker container alone is not assumed sufficient.

### Realtime Transport
WebSockets deliver authorized room events, presence, editor updates, and submission status. Room membership and event permissions are checked server-side. Use Redis Pub/Sub or another cross-instance mechanism only when multiple realtime instances require it.

### AI Provider Adapter
The API calls an internal adapter for structured suggestions. Provider credentials remain server-side. Validate provider responses, handle timeouts/rate limits, and label AI-generated material as suggestions for human review.

## 4. Data Flow

### Create Interview
Client -> API validation/auth -> interview service -> MongoDB -> response.

### Submit Code
Candidate -> API validation/auth/idempotency -> persist submission -> enqueue job -> response with submission ID.

### Execute Code
Queue -> trusted controller -> isolated sandbox -> trusted test evaluation -> persist execution attempt/result -> publish status event.

### Request AI Assistance
Interviewer -> API authorization -> AI service/adapter -> validate structured response -> persist or return suggestion with AI provenance.

## 5. Suggested Backend Folder Structure

```text
apps/
  api/
    src/
      app.ts
      server.ts
      config/
      middleware/
      common/
        errors/
        logging/
        validation/
      modules/
        health/
        auth/
        interviews/
        questions/
        submissions/
        evaluations/
        audit/
        realtime/
        ai-assistance/
      infrastructure/
        database/
        queue/
        storage/
        llm/
    tests/
  executor/
    src/
      controller/
      sandbox/
      policies/
      results/
    tests/

packages/
  contracts/

docs/
  backend/
```

Do not create empty files for every future module. Add files when a milestone requires them.

## 6. Configuration

- Keep local values in ignored `.env` files.
- Commit `.env.example` with variable names and safe placeholders only.
- Validate required variables at startup.
- Never include secrets in frontend configuration or API responses.
- Use separate credentials for the API, queue/controller, database, and external providers where practical.
- Rotate credentials if they are exposed.

## 7. Error Handling

Use a consistent response envelope, for example:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request is invalid",
    "requestId": "request-id"
  }
}
```

Do not return stack traces, internal paths, secrets, hidden tests, or provider credentials. Preserve detailed diagnostics in access-controlled logs with sensitive fields redacted.

## 8. Security Boundaries

- Browser is untrusted.
- API validates identity, permissions, and input.
- Queue payload is validated and treated as potentially duplicated.
- Trusted execution controller handles orchestration but does not execute source inside its own process.
- Candidate code is untrusted and isolated from the host, API, queue, and production network.
- Hidden tests and expected outputs remain in trusted evaluation components.
- AI output is untrusted until validated and is never an autonomous hiring decision.

## 9. Testing Strategy

- Unit tests for domain rules, validation, and state transitions.
- Integration tests for API/database and queue interactions.
- Security tests for resource ownership, hidden-test secrecy, sandbox escape assumptions, network restrictions, and output limits.
- Failure tests for database/queue/worker unavailability, duplicate delivery, timeouts, and cancellation.
- Load tests for queue throughput, queue wait time, API latency, and live update latency.
- Do not claim performance targets without repeatable measurements.

## 10. Deployment Approach

Start with local development and one API instance. Add a separate execution controller and isolated sandbox as the submission lifecycle is implemented. Deploy components separately when the trust boundary or scaling requirements demand it. Add multiple workers and orchestration only after measuring a need.

## 11. Open Decisions

- Exact authentication/session approach.
- MongoDB driver versus ODM.
- Collaboration protocol and conflict-resolution strategy.
- Production sandbox runtime and infrastructure.
- LLM provider and retention policy.
- Object storage requirement.
- Production SLOs and load-test profile.
