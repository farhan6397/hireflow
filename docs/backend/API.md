# Hire Flow — Backend API Contract

## 1. Purpose

Define the initial API surface. This is a proposed contract; endpoint details must be reconciled with the approved PRD, architecture, and database design before implementation.

Base path: `/api/v1`

Content type: `application/json`, except explicitly documented future upload endpoints.

## 2. Conventions

- Use consistent plural resource names.
- Validate request bodies, path parameters, and query parameters.
- Enforce authorization on every protected route.
- Never trust client-provided role, owner, score, or execution status fields.
- Use stable machine-readable error codes.
- Return a request/correlation ID for troubleshooting.
- Use pagination for potentially large lists.
- Apply body-size limits and rate limits.
- Do not return hidden tests, expected outputs, credentials, or stack traces.

Example error:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request is invalid",
    "requestId": "request-id"
  }
}
```

## 3. Health

### GET `/health`

Purpose: basic process liveness.

### GET `/ready`

Purpose: readiness check for required dependencies, with no secrets or detailed infrastructure information in the public response.

## 4. Interviews

### POST `/interviews`

Create an interview. Interviewer/admin only.

Request fields:
- `title`
- `questionIds`
- `startsAt` (optional)
- `endsAt` (optional)

The backend derives owner identity from the authenticated principal.

### GET `/interviews`

List interviews visible to the authenticated user. Support pagination and permitted status filtering.

### GET `/interviews/:interviewId`

Retrieve an interview after ownership/participant authorization.

### PATCH `/interviews/:interviewId`

Update allowed interview fields. Enforce owner and lifecycle rules.

### POST `/interviews/:interviewId/close`

Close an interview if the current status permits it.

## 5. Invitations

### POST `/interviews/:interviewId/invitations`

Create a candidate invitation. Return the raw token only at creation time if required by the approved invitation design. Store a verifier/hash rather than a reusable raw token.

### POST `/candidate-sessions`

Exchange a valid invitation for limited candidate access. Enforce expiry, revocation, and interview status.

Never expose invitation token hashes or other candidates' access information.

## 6. Questions

### GET `/questions/:questionId`

Return question metadata permitted for the caller. Candidate responses must exclude hidden test definitions and expected outputs.

### GET `/interviews/:interviewId/question`

Return the question assigned to the current interview participant, subject to access checks.

Question administration endpoints can be added when the MVP needs interviewer-managed question creation.

## 7. Submissions

### POST `/interviews/:interviewId/submissions`

Create a submission.

Headers:
- `Idempotency-Key`: required for retry-safe submission creation.

Request fields:
- `questionId`
- `language`
- `sourceCode`

The server validates size, language, interview state, and candidate access. It persists an immutable submission and enqueues execution. It must not execute code in the HTTP request process.

Response: submission ID, accepted status, and creation timestamp.

### GET `/submissions/:submissionId`

Return status and result fields authorized for the caller.

### GET `/interviews/:interviewId/submissions`

List authorized submission history with pagination.

### POST `/submissions/:submissionId/cancel`

Request cancellation if the execution state allows it. Cancellation is not considered complete until the controller confirms termination or the system records the appropriate terminal state.

## 8. Evaluations

### POST `/interviews/:interviewId/evaluations`

Create or update an interviewer-authored evaluation, according to the agreed rubric and permissions.

### GET `/interviews/:interviewId/evaluations`

Return evaluations only to authorized reviewers and administrators.

AI-generated suggestions must be labeled and stored separately from human-authored conclusions.

## 9. AI Assistance

### POST `/interviews/:interviewId/ai-suggestions`

Request a follow-up question or code explanation. Interviewer-only.

The server validates access, applies provider timeouts and rate limits, validates the structured response, and records provenance as required.

AI output is advisory. This endpoint must not make or finalize a hiring decision.

## 10. Realtime

WebSocket endpoint: `/api/v1/realtime`

Required controls:
- Authenticate the connection.
- Authorize room membership.
- Validate every event and payload.
- Limit message size and event rate.
- Re-check authorization for sensitive actions.
- Prevent cross-room event delivery.
- Handle reconnects and stale connections.
- Never send hidden tests or expected outputs to candidate clients.

The exact collaboration event schema will be specified before implementing realtime collaboration.

## 11. Status and Error Codes

Suggested stable codes:
- `VALIDATION_ERROR`
- `UNAUTHENTICATED`
- `FORBIDDEN`
- `NOT_FOUND`
- `CONFLICT`
- `RATE_LIMITED`
- `IDEMPOTENCY_CONFLICT`
- `UNSUPPORTED_LANGUAGE`
- `SUBMISSION_LIMIT_EXCEEDED`
- `DEPENDENCY_UNAVAILABLE`
- `EXECUTION_TIMEOUT`
- `EXECUTION_FAILED`
- `INTERNAL_ERROR`

Use appropriate HTTP status codes and avoid exposing internal exception details.

## 12. Rate Limiting and Resource Limits

Apply different limits to:
- Authentication and invitation exchange.
- Interview creation and management.
- Submission creation.
- AI provider requests.
- WebSocket connection and event traffic.

Limits must be configurable and measured. Execution CPU/memory/time/output limits are enforced by the execution system, not by HTTP rate limiting alone.

## 13. Environment Variables

Expected variable categories, with exact names finalized during setup:
- API port and environment.
- MongoDB connection string.
- Redis connection string.
- Authentication/session secrets or identity-provider configuration.
- LLM provider credentials.
- Allowed origins.
- Logging configuration.
- Execution controller/queue configuration.

Never expose server-only variables through frontend build configuration. Commit placeholders only in `.env.example`.

## 14. External Service Failure Handling

- Use explicit timeouts for external calls.
- Retry only operations that are safe to retry.
- Use bounded exponential backoff where appropriate.
- Respect provider rate-limit responses.
- Do not duplicate submissions or side effects on retry.
- Return a stable failure state when a dependency remains unavailable.
- Log correlation IDs and sanitized failure details.
